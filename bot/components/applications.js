import { AttachmentBuilder, MessageFlags } from 'discord.js';
import { canManageBot } from '../lib/permissions.js';
import {
    cachedForm, continueButton, draftOf, problemOf, readStep, sendDraft, startDraft, stepModal, stepsOf, unanswered, website,
} from '../services/applications.js';

const EXPIRED = 'Your application expired or the bot was restarted. Use /apply to start again.';

/** The status each button under an application in the staff channel sets. */
const STATUS = { approve: 'accepted', review: 'under_review', reject: 'rejected' };

const start = async (interaction) => {
    const form = cachedForm();
    if (!form) {
        await interaction.reply({ content: 'This form is out of date. Use /apply again.', flags: MessageFlags.Ephemeral });

        return;
    }

    startDraft(interaction.user);
    await interaction.showModal(stepModal(form, 0));
};

/** "Continue" between two forms (`staff-application:next:<form number>`). */
const next = async (interaction) => {
    const form = cachedForm();
    if (!form || !draftOf(interaction.user.id)) {
        await interaction.update({ content: EXPIRED, components: [] });

        return;
    }

    await interaction.showModal(stepModal(form, Number(interaction.customId.split(':')[2])));
};

/** A form was sent in (`staff-application:step:<form number>`): keep the answers, then open the next form or send everything. */
const step = async (interaction) => {
    const index = Number(interaction.customId.split(':')[2]);
    const form = cachedForm();
    const draft = draftOf(interaction.user.id);
    // a form sent in from a message updates that message; Discord gives three seconds, and sending to the website can take longer
    await interaction.deferUpdate();
    if (!form || !draft) {
        await interaction.editReply({ content: EXPIRED, components: [] });

        return;
    }

    const answers = readStep(form, index, interaction.fields);
    const missing = unanswered(form, index, answers);
    if (missing.length) {
        // Other was chosen with nothing written in its box: nothing of this part is kept, the same form opens again
        await interaction.editReply({
            content: `Please write your own answer for: ${missing.map((field) => field.short).join(', ')}. This part is not saved yet.`,
            components: [continueButton(index)],
        });

        return;
    }

    Object.assign(draft.answers, answers);
    const steps = stepsOf(form);
    if (index + 1 < steps.length) {
        await interaction.editReply({
            content: `Part ${index + 1} of ${steps.length} saved. Next: ${steps[index + 1].title}.`,
            components: [continueButton(index + 1)],
        });

        return;
    }

    await interaction.editReply(await sendDraft(interaction.user));
};

const retry = async (interaction) => {
    await interaction.deferUpdate();
    await interaction.editReply(await sendDraft(interaction.user));
};

/** Approve, Under review or Reject under an application in the staff channel (`staff-application:<approve|review|reject>:<application number>`). */
const review = async (interaction) => {
    const [, action, applicationId] = interaction.customId.split(':');
    if (!canManageBot(interaction)) {
        await interaction.reply({ content: 'You do not have permission to review staff applications.', flags: MessageFlags.Ephemeral });

        return;
    }
    if (action !== 'full' && !STATUS[action]) {
        await interaction.reply({ content: 'That button is not part of the application form.', flags: MessageFlags.Ephemeral });

        return;
    }
    // messages posted before applications were kept on the website carried a long random id and the applicant's Discord id
    if (!/^\d+$/.test(applicationId ?? '') || interaction.customId.split(':').length !== 3) {
        await interaction.reply({ content: 'This application was sent before applications moved to the website, so these buttons cannot change it. Ask the person to apply again on the website or with /apply.', flags: MessageFlags.Ephemeral });

        return;
    }

    await interaction.deferUpdate();
    if (action === 'full') {
        // not a decision: the whole application as a text file, for the person who pressed the button only
        const response = await website(`staff-applications/${applicationId}`);
        await interaction.followUp(response.ok
            ? { files: [new AttachmentBuilder(Buffer.from(response.json.text, 'utf8'), { name: `staff-application-${applicationId}.txt` })], flags: MessageFlags.Ephemeral }
            : { content: `The application could not be loaded: ${problemOf(response.json)}`, flags: MessageFlags.Ephemeral });

        return;
    }

    const response = await website(`staff-applications/${applicationId}`, {
        method: 'PATCH',
        body: { status: STATUS[action], reviewer_discord_id: interaction.user.id, reviewer_name: interaction.user.username },
    });
    if (!response.ok) {
        await interaction.followUp({ content: `The decision was not saved: ${problemOf(response.json)}`, flags: MessageFlags.Ephemeral });

        return;
    }

    // the website has updated the message itself; this makes sure it shows the new status even if it could not
    await interaction.editReply(response.json.message);
    if (response.json.notice) {
        await interaction.followUp({ content: response.json.notice, flags: MessageFlags.Ephemeral });
    }
    console.log(`Application ${applicationId} set to ${STATUS[action]} by ${interaction.user.tag}`);
};

export const buttons = [
    { id: 'staff-application:start', execute: start },
    { id: 'staff-application:retry', execute: retry },
    { prefix: 'staff-application:next:', execute: next },
    { prefix: 'staff-application:', execute: review }, // after the ones above: this takes every other staff-application button
];

export const modals = [
    { prefix: 'staff-application:step:', execute: step },
];
