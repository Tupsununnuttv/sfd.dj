import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compactState, compactEvent } from '../../resources/js/lib/compactState.ts';

const initial = () => compactState({ compact: false, compact_chat: false, compact_layout: false });
const event = (token, phase, value, key = 'compact_chat') => ({ key, token, phase, value });

test('compact choice is visible before the save completes', () => {
    const state = compactEvent(initial(), event('one', 'preview', true));
    assert.equal(state.values.compact_chat, true);
    assert.equal(state.confirmed.compact_chat, false);
    assert.equal(state.pending.compact_chat, 'one');
});

test('failed saves restore confirmed state and show an error', () => {
    const state = compactEvent(compactEvent(initial(), event('one', 'preview', true)), event('one', 'failed', true));
    assert.equal(state.values.compact_chat, false);
    assert.ok(state.error);
    assert.equal(state.pending.compact_chat, undefined);
});

test('an old success cannot undo a newer toggle', () => {
    let state = compactEvent(initial(), event('one', 'preview', true));
    state = compactEvent(state, event('two', 'preview', false));
    state = compactEvent(state, event('one', 'saved', true));
    assert.equal(state.values.compact_chat, false);
    assert.equal(state.pending.compact_chat, 'two');
    state = compactEvent(state, event('two', 'saved', false));
    assert.equal(state.confirmed.compact_chat, false);
    assert.equal(state.pending.compact_chat, undefined);
});

test('a newer failed toggle restores the last successful server save', () => {
    let state = compactEvent(initial(), event('one', 'preview', true));
    state = compactEvent(state, event('two', 'preview', false));
    state = compactEvent(state, event('one', 'saved', true));
    state = compactEvent(state, event('two', 'failed', false));
    assert.equal(state.values.compact_chat, true);
});

test('simultaneous independent compact settings keep their own values', () => {
    let state = compactEvent(initial(), event('one', 'preview', true, 'compact'));
    state = compactEvent(state, event('two', 'preview', true, 'compact_layout'));
    state = compactEvent(state, event('one', 'failed', true, 'compact'));
    assert.equal(state.values.compact, false);
    assert.equal(state.values.compact_layout, true);
});
