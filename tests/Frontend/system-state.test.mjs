import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SYSTEM_DEFAULTS, effectiveSystem, systemState, systemEvent } from '../../resources/js/lib/systemState.ts';

test('low mode suspends expensive effects and restores the individual choices when disabled', () => {
    const chosen = { ...SYSTEM_DEFAULTS, animated_characters: false, simple_background: false };
    const low = effectiveSystem({ ...chosen, low_performance: true });
    assert.equal(low.animated_characters, false);
    assert.equal(low.background_effects, false);
    assert.equal(low.visual_effects, false);
    assert.equal(low.simple_background, true);
    assert.equal(effectiveSystem(chosen), chosen);
    assert.equal(chosen.simple_background, false);
});

test('old save completion cannot undo a newer preview and failure restores the last confirmed choice', () => {
    let state = systemState(SYSTEM_DEFAULTS);
    const first = { key: 'low_performance', token: 'first', value: true, phase: 'preview' };
    const second = { ...first, token: 'second', value: false };
    state = systemEvent(state, first);
    state = systemEvent(state, second);
    state = systemEvent(state, { ...first, phase: 'saved' });
    assert.equal(state.values.low_performance, false);
    state = systemEvent(state, { ...second, phase: 'failed' });
    assert.equal(state.values.low_performance, true);
    assert.match(state.error, /Could not save/);
    assert.equal(state.values.animated_characters, true);
});
