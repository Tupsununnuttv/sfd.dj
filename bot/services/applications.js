import { ActionRowBuilder, ButtonBuilder, ButtonStyle, LabelBuilder, ModalBuilder, RadioGroupBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { siteUrl, token } from '../config/index.js';

// Staff applications. The application lives on the website (database, staff review, the message in the staff channel): the bot asks the questions the website
// lists in /apply, sends the answers there, and passes on the buttons under the staff channel message (Approve, Under review, Reject, Full answers).

/** The website's bot API. Never throws: a website that cannot be reached is `{ ok: false, status: 0 }`. */
export const website = async (path, { method = 'GET', body } = {}) => {
    try {
        const response = await fetch(new URL(`/api/discord/${path}`, siteUrl), {
            method,
            headers: { Authorization: `Bot ${token}`, Accept: 'application/json', ...(body && { 'Content-Type': 'application/json' }) },
            body: body && JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });

        return { ok: response.ok, status: response.status, json: await response.json().catch(() => ({})) };
    } catch {
        return { ok: false, status: 0, json: {} };
    }
};

const FORM_MINUTES = 30;
const DRAFT_MINUTES = 60;
let formCache = null;

/** The questions, as the website lists them. Kept for a while so the "Start application" button can open the first form within Discord's three seconds. */
export const cachedForm = () => (formCache && Date.now() - formCache.at < FORM_MINUTES * 60_000 ? formCache.form : null);

export const loadForm = async () => {
    if (cachedForm()) {
        return cachedForm();
    }

    const response = await website('staff-application-form');
    if (!response.ok || !Array.isArray(response.json.fields)) {
        return null;
    }
    formCache = { form: response.json, at: Date.now() };

    return response.json;
};

export const forgetForm = () => { formCache = null; };

/** The questions in groups of at most five: one Discord form each. The Discord username is not asked, the bot knows it. */
export const stepsOf = (form) => Object.entries(form.sections)
    .map(([key, title]) => ({ key, title, fields: form.fields.filter((field) => field.section === key && field.key !== 'discord_username') }))
    .filter((step) => step.fields.length > 0);

/** The value of the "Other" choice in a select: the person's own words are then in the box under it. */
export const OTHER = '__other__';
const ownBox = (field) => `${field.key}_own`;

const labelFor = (field) => {
    const label = new LabelBuilder().setLabel(field.short.slice(0, 45)).setDescription(field.label.slice(0, 100));
    const options = (field.options ?? []).map((option) => ({ label: option, value: option }));

    if (field.type === 'select') {
        // a Discord select cannot take free text: a question that allows own words gets an Other choice and a box for them
        const choices = field.other ? [...options, { label: 'Other (write it in the box below)', value: OTHER }] : options;

        return label.setStringSelectMenuComponent(new StringSelectMenuBuilder().setCustomId(field.key).setPlaceholder('Choose one').setRequired(field.required).addOptions(choices));
    }
    if (field.type === 'radio') {
        return label.setRadioGroupComponent(new RadioGroupBuilder().setCustomId(field.key).setRequired(field.required).setOptions(options));
    }

    return label.setTextInputComponent(new TextInputBuilder()
        .setCustomId(field.key)
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(field.min ?? 0)
        .setMaxLength(field.max)
        .setRequired(field.required));
};

/** The optional box under a select whose question allows the person's own words. */
const ownLabelFor = (field) => new LabelBuilder()
    .setLabel(`${field.short} (if Other)`.slice(0, 45))
    .setDescription('Only when you chose Other above.')
    .setTextInputComponent(new TextInputBuilder().setCustomId(ownBox(field)).setStyle(TextInputStyle.Short).setMaxLength(field.max ?? 60).setRequired(false));

/** Form number `index` (0-based) of the application. At most five boxes: Discord allows no more. */
export const stepModal = (form, index) => {
    const steps = stepsOf(form);

    return new ModalBuilder()
        .setCustomId(`staff-application:step:${index}`)
        .setTitle(`Staff application ${index + 1}/${steps.length}: ${steps[index].title}`.slice(0, 45))
        .addLabelComponents(...steps[index].fields.flatMap((field) => [labelFor(field), ...(field.type === 'select' && field.other ? [ownLabelFor(field)] : [])]));
};

/** What was answered in a submitted form, by question. Somebody who chose Other and left the box empty has an empty answer. */
export const readStep = (form, index, fields) => Object.fromEntries(stepsOf(form)[index].fields.map((field) => {
    if (field.type === 'textarea') {
        return [field.key, fields.getTextInputValue(field.key)];
    }
    if (field.type === 'select') {
        const chosen = fields.getStringSelectValues(field.key)[0] ?? '';

        return [field.key, chosen === OTHER ? fields.getTextInputValue(ownBox(field)).trim() : chosen];
    }

    return [field.key, fields.getRadioGroup(field.key) ?? ''];
}));

/** The questions of form `index` that are required but have no answer (only possible with Other and an empty box). */
export const unanswered = (form, index, answers) => stepsOf(form)[index].fields.filter((field) => field.required && !answers[field.key]);

/** Answers so far, per Discord user. In memory: a restart of the bot ends an application in progress (the person just starts /apply again). */
const drafts = new Map();

export const startDraft = (user) => drafts.set(user.id, { answers: { discord_username: user.username }, at: Date.now() });

export const draftOf = (userId) => {
    const draft = drafts.get(userId);
    if (draft && Date.now() - draft.at > DRAFT_MINUTES * 60_000) {
        drafts.delete(userId);

        return undefined;
    }

    return draft;
};

export const dropDraft = (userId) => drafts.delete(userId);

/** The button under /apply that opens the first form. */
export const applicationStartButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('staff-application:start').setLabel('Start application').setStyle(ButtonStyle.Primary),
);

/** The button between two forms (Discord cannot open a form straight after a form). */
export const continueButton = (index) => new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`staff-application:next:${index}`).setLabel('Continue').setStyle(ButtonStyle.Primary),
);

export const retryButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('staff-application:retry').setLabel('Try sending again').setStyle(ButtonStyle.Primary),
);

/** The first thing the website said was wrong, in words for the applicant. */
export const problemOf = (json) => (json.errors ? Object.values(json.errors)[0]?.[0] : null) ?? json.message ?? 'Something went wrong.';

/** Send the finished draft to the website. Returns the text to show and, when the person can try again, the button for it. */
export const sendDraft = async (user) => {
    const draft = draftOf(user.id);
    if (!draft) {
        return { content: 'Your application expired. Use /apply to start again.', components: [] };
    }

    const response = await website('staff-applications', { method: 'POST', body: { discord_id: user.id, answers: draft.answers } });
    if (response.ok) {
        dropDraft(user.id);

        return { content: 'Your application has been sent to the staff team. Thank you! If you have an SFD-DJ.EU account you can follow it under Community → Staff application.', components: [] };
    }
    if (response.status === 422) {
        dropDraft(user.id);

        return { content: `Your application could not be sent: ${problemOf(response.json)}`, components: [] };
    }

    // the website could not be reached or failed: the answers stay for an hour
    return { content: 'The website did not answer, so the application is not sent yet. Your answers are kept for an hour.', components: [retryButton] };
};
