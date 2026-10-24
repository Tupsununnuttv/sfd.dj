import assert from 'node:assert/strict';
import { test, before } from 'node:test';
import protectUserContent from '../../scripts/protect-user-content.mjs';
import { applyRegional, previewRegional, cancelRegionalPreview, translate, getLanguage, loadRegionalLanguage } from '../../resources/js/lib/regional.ts';
globalThis.document = { documentElement: { lang: 'en' } };
before(() => Promise.all([loadRegionalLanguage('et'), loadRegionalLanguage('ru')]));

test('language changes optimistically and survives stale page props until saved', () => {
    applyRegional(null);
    previewRegional({ language: 'et', time_format: '24' });
    applyRegional({ regional: { language: 'en', time_format: '24' } });
    assert.equal(getLanguage(), 'et');
    assert.equal(translate('Dashboard'), 'Avaleht');
    assert.equal(translate('  Friends  '), '  Sõbrad  ');
    assert.equal(translate('Kati joined the room'), 'Kati liitus toaga');
    applyRegional({ regional: { language: 'et', time_format: '24' } });
    previewRegional({ language: 'ru', time_format: '24' });
    assert.equal(translate('Dashboard'), 'Главная');
    assert.equal(translate('Discover'), 'Обзор');
    cancelRegionalPreview({ regional: { language: 'et', time_format: '24' } });
    assert.equal(getLanguage(), 'et');
});

test('interface strings are localized while user text is marked as original', () => {
    const source = 'export default function Example({user, message}) { return <section><h1>Settings</h1><p>{user.name}</p><p>{message.body}</p><button onClick={() => confirm("Delete account?")}>Delete</button></section>; }';
    const result = protectUserContent().transform(source, '/project/resources/js/Example.tsx').code;
    assert.match(result, /<h1>Settings<\/h1>/);
    assert.match(result, /__SfdOriginal>\{user.name\}/);
    assert.match(result, /__SfdOriginal>\{message.body\}/);
    assert.match(result, /confirm\(__sfdTranslate\("Delete account\?"\)\)/);
    const docs = protectUserContent().transform('export const section = <article>{s.title}{s.body}</article>;', '/project/resources/js/Pages/Docs.tsx');
    assert.equal(docs, undefined);
});
