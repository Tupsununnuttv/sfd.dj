import assert from 'node:assert/strict';
import { test, before } from 'node:test';
import { applyRegional, formatTime, formatDateTime, formatDate, translate, loadRegionalLanguage } from '../../resources/js/lib/regional.ts';

globalThis.document = { documentElement: { lang: 'en' } };
before(() => Promise.all([loadRegionalLanguage('et'), loadRegionalLanguage('ru')]));
const afternoon = new Date(2026, 9, 22, 13, 5);

test('all supported languages respect the explicit clock preference', () => {
    for (const language of ['en', 'et', 'ru']) {
        applyRegional({ regional: { language, time_format: '24' } });
        assert.equal(document.documentElement.lang, language);
        assert.equal(formatTime(afternoon), '13:05');
        assert.match(formatDateTime(afternoon), /13:05/);
        applyRegional({ regional: { language, time_format: '12' } });
        assert.match(formatTime(afternoon), /0?1:05/);
        assert.doesNotMatch(formatDateTime(afternoon), /13:05/);
    }
});

test('dates and settings labels follow the selected language, with English fallback', () => {
    applyRegional({ regional: { language: 'et', time_format: '24' } });
    assert.match(formatDate(afternoon, { month: 'long' }), /oktoober/);
    assert.equal(translate('Language & Time'), 'Keel ja kellaaeg');
    applyRegional({ regional: { language: 'ru' } });
    assert.match(formatDate(afternoon, { month: 'long' }), /октябрь/);
    assert.equal(translate('Language'), 'Язык');
    assert.equal(translate('Untranslated text'), 'Untranslated text');
    applyRegional(null);
    assert.equal(translate('Language'), 'Language');
    assert.equal(formatTime(afternoon), '13:05');
});
