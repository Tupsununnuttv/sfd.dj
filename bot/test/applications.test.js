// The staff application in Discord: the forms /apply opens, what is sent to the website, and the buttons under the staff channel message.
// Nothing here logs in to Discord or reaches the network: the website is a stand-in `fetch`. The questions are a copy of what the website lists
// (bot/test/fixtures/staff-application-form.json, from App\Support\StaffApplicationForm::definition()).
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

process.env.DISCORD_BOT_SETTINGS_PATH = join(mkdtempSync(join(tmpdir(), 'sfd-bot-')), 'settings.json');
process.env.DISCORD_BOT_TOKEN = 'test-token';
process.env.DISCORD_STAFF_ROLE_ID = '555';

const form = JSON.parse(readFileSync(new URL('./fixtures/staff-application-form.json', import.meta.url), 'utf8'));
const { buttons, handlerFor, modals } = await import('../components/index.js');
const { OTHER, forgetForm, loadForm, problemOf, readStep, stepModal, stepsOf, unanswered } = await import('../services/applications.js');
const { commandsByName } = await import('../commands/index.js');

/** Stand in for the website: records every call and answers with `reply(path, init)`. */
const fakeWebsite = (reply) => {
    const calls = [];
    globalThis.fetch = async (url, init = {}) => {
        const path = new URL(url).pathname.replace('/api/discord/', '');
        const call = { path, method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : undefined, headers: init.headers };
        calls.push(call);
        const { status = 200, json = {} } = reply(call);

        return { ok: status < 400, status, json: async () => json };
    };

    return calls;
};

/** A Discord interaction that remembers what it was told to do. */
const fakeInteraction = (extra = {}) => {
    const done = [];
    const record = (name) => async (payload) => { done.push([name, payload]); };

    return {
        done,
        user: { id: '111111111111111111', username: 'applicant', tag: 'applicant' },
        reply: record('reply'), update: record('update'), deferUpdate: record('deferUpdate'), deferReply: record('deferReply'),
        editReply: record('editReply'), followUp: record('followUp'), showModal: record('showModal'),
        memberPermissions: { has: () => false }, member: { roles: ['555'] },
        ...extra,
    };
};

const fieldsOf = (answers) => ({
    getTextInputValue: (key) => answers[key],
    getStringSelectValues: (key) => [answers[key]],
    getRadioGroup: (key) => answers[key],
});

const ANSWERS = {
    age_group: '18–20', server_time: '14–30 days', position: 'Site Moderator',
    motivation: 'I like helping people.', experience: 'No', why_you: 'I am calm and fair.', hours: '4–7 hours',
    handle_spam: 'Warn, then mute.', handle_argument: 'Listen to both sides.', handle_abuse: 'Tell a lead moderator.', handle_disrespect: 'Stay calm.',
    read_rules: 'Yes', trial: 'Yes', extra: '',
};

test('the 14 questions Discord asks fit its forms: at most five each, labels and descriptions within the limits', () => {
    const steps = stepsOf(form);
    assert.equal(steps.length, 4);
    assert.equal(steps.flatMap((step) => step.fields).length, 14, 'the Discord username is known, so it is not asked');
    steps.forEach((step, index) => {
        assert.ok(step.fields.length <= 5, step.title);
        const modal = stepModal(form, index).toJSON();
        assert.ok(modal.title.length <= 45);
        // a question that allows the person's own words has a second box under its select
        assert.equal(modal.components.length, step.fields.length + step.fields.filter((field) => field.other).length);
        assert.ok(modal.components.length <= 5, `${step.title}: Discord allows five boxes`);
        modal.components.forEach((label) => {
            assert.ok(label.label.length <= 45, label.label);
            assert.ok(label.description.length <= 100, label.description);
        });
    });
});

test('what was chosen or written in a form is read back by question', () => {
    const answers = readStep(form, 0, fieldsOf(ANSWERS));
    assert.deepEqual(answers, { age_group: '18–20', server_time: '14–30 days', position: 'Site Moderator' });
    assert.equal(readStep(form, 3, fieldsOf({ read_rules: null, trial: 'Yes', extra: 'Hi' })).read_rules, '', 'a skipped choice is an empty answer, not a crash');
});

test('four forms in a row, then the application goes to the website with the Discord id and every answer', async () => {
    forgetForm();
    const calls = fakeWebsite((call) => (call.path === 'staff-application-form' ? { json: form } : { status: 201, json: { id: 7 } }));
    const apply = fakeInteraction();
    await commandsByName.get('apply').execute(apply);
    assert.equal(calls[0].headers.Authorization, 'Bot test-token');
    assert.ok(apply.done.some(([name, payload]) => name === 'editReply' && payload.components?.length === 1), '/apply offers the Start button');

    const start = fakeInteraction({ customId: 'staff-application:start' });
    await handlerFor(buttons, start.customId).execute(start);
    assert.equal(start.done[0][0], 'showModal');

    let last;
    for (const index of [0, 1, 2, 3]) {
        const submit = fakeInteraction({ customId: `staff-application:step:${index}`, fields: fieldsOf(ANSWERS) });
        await handlerFor(modals, submit.customId).execute(submit);
        last = submit.done.at(-1)[1];
        if (index < 3) {
            assert.match(last.content, new RegExp(`Part ${index + 1} of 4`));
            const next = fakeInteraction({ customId: `staff-application:next:${index + 1}` });
            await handlerFor(buttons, next.customId).execute(next);
            assert.equal(next.done[0][0], 'showModal');
        }
    }

    const post = calls.find((call) => call.method === 'POST');
    assert.equal(post.path, 'staff-applications');
    assert.equal(post.body.discord_id, '111111111111111111');
    assert.equal(post.body.answers.discord_username, 'applicant');
    assert.equal(post.body.answers.motivation, 'I like helping people.');
    assert.equal(Object.keys(post.body.answers).length, 15);
    assert.match(last.content, /sent to the staff team/);
});

test('when the website does not answer the answers are kept and can be sent again; when it says no, the reason is shown', async () => {
    forgetForm();
    fakeWebsite((call) => (call.path === 'staff-application-form' ? { json: form } : { status: 503 }));
    await loadForm();
    const start = fakeInteraction({ customId: 'staff-application:start' });
    await handlerFor(buttons, start.customId).execute(start);
    for (const index of [0, 1, 2, 3]) {
        const submit = fakeInteraction({ customId: `staff-application:step:${index}`, fields: fieldsOf(ANSWERS) });
        await handlerFor(modals, submit.customId).execute(submit);
        if (index === 3) {
            assert.match(submit.done.at(-1)[1].content, /not sent yet/);
            assert.equal(submit.done.at(-1)[1].components.length, 1, 'a Try again button');
        }
    }

    const calls = fakeWebsite(() => ({ status: 422, json: { message: 'x', errors: { application: ['You already have an application waiting for a decision.'] } } }));
    const retry = fakeInteraction({ customId: 'staff-application:retry' });
    await handlerFor(buttons, retry.customId).execute(retry);
    assert.equal(calls.length, 1);
    assert.match(retry.done.at(-1)[1].content, /already have an application waiting/);
    assert.equal(problemOf({ message: 'Nope' }), 'Nope');
});

test('the buttons under an application change its status through the website, and only for staff', async () => {
    const calls = fakeWebsite(() => ({ json: { message: { embeds: [], components: [] }, notice: 'No role was given.' } }));
    const outsider = fakeInteraction({ customId: 'staff-application:approve:7', member: { roles: [] } });
    await handlerFor(buttons, outsider.customId).execute(outsider);
    assert.match(outsider.done[0][1].content, /do not have permission/);
    assert.equal(calls.length, 0);

    for (const [action, status] of [['approve', 'accepted'], ['review', 'under_review'], ['reject', 'rejected']]) {
        const staff = fakeInteraction({ customId: `staff-application:${action}:7` });
        await handlerFor(buttons, staff.customId).execute(staff);
        const call = calls.at(-1);
        assert.equal(call.method, 'PATCH');
        assert.equal(call.path, 'staff-applications/7');
        assert.deepEqual(call.body, { status, reviewer_discord_id: '111111111111111111', reviewer_name: 'applicant' });
        assert.ok(staff.done.some(([name]) => name === 'editReply'));
        assert.ok(staff.done.some(([name, payload]) => name === 'followUp' && payload.content === 'No role was given.'));
    }

    const legacy = fakeInteraction({ customId: 'staff-application:approve:6f1c2e9e-aaaa-bbbb-cccc-0123456789ab:222222222222222222' });
    await handlerFor(buttons, legacy.customId).execute(legacy);
    assert.match(legacy.done[0][1].content, /before applications moved to the website/);
    assert.equal(calls.length, 3);

    fakeWebsite(() => ({ json: { text: 'Staff application #7\n\n1. What is your Discord username?\napplicant\n' } }));
    const full = fakeInteraction({ customId: 'staff-application:full:7' });
    await handlerFor(buttons, full.customId).execute(full);
    assert.equal(full.done.at(-1)[1].files[0].name, 'staff-application-7.txt');
});

test('Other in a select takes what was written in the box under it; with an empty box the part is asked again and nothing of it is kept', async () => {
    assert.deepEqual(readStep(form, 0, fieldsOf({ age_group: OTHER, age_group_own: ' 19 ', server_time: '14–30 days', position: 'Admin' })), { age_group: '19', server_time: '14–30 days', position: 'Admin' });
    assert.deepEqual(readStep(form, 0, fieldsOf({ age_group: '21+', age_group_own: 'ignored', server_time: OTHER, server_time_own: '3 years', position: 'Developer' })), { age_group: '21+', server_time: '3 years', position: 'Developer' });
    assert.deepEqual(unanswered(form, 0, { age_group: '', server_time: '3 years', position: 'Developer' }).map((field) => field.key), ['age_group']);

    forgetForm();
    const calls = fakeWebsite((call) => (call.path === 'staff-application-form' ? { json: form } : { status: 201, json: { id: 8 } }));
    await loadForm();
    const start = fakeInteraction({ customId: 'staff-application:start' });
    await handlerFor(buttons, start.customId).execute(start);

    const empty = fakeInteraction({ customId: 'staff-application:step:0', fields: fieldsOf({ age_group: OTHER, age_group_own: '  ', server_time: '14–30 days', position: 'Admin' }) });
    await handlerFor(modals, empty.customId).execute(empty);
    const reply = empty.done.at(-1)[1];
    assert.match(reply.content, /write your own answer for: Age group/);
    assert.equal(reply.components.length, 1, 'a Continue button opens the same form again');
    assert.equal(calls.filter((call) => call.method === 'POST').length, 0);

    // the second try, then the other three parts, sends the written answer
    for (const index of [0, 1, 2, 3]) {
        const submit = fakeInteraction({ customId: `staff-application:step:${index}`, fields: fieldsOf({ ...ANSWERS, age_group: OTHER, age_group_own: '19', server_time: OTHER, server_time_own: 'about a year' }) });
        await handlerFor(modals, submit.customId).execute(submit);
    }
    const post = calls.find((call) => call.method === 'POST');
    assert.equal(post.body.answers.age_group, '19');
    assert.equal(post.body.answers.server_time, 'about a year');
    assert.equal(post.body.answers.position, 'Site Moderator');
});
