import '../../resources/css/app.css';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import PeekCard from '../../resources/js/Components/PeekCard';
import { browserChannel } from '../../resources/js/lib/browserChannel';
import { copyText } from '../../resources/js/lib/clipboard';
import { syncCompactPreferences, saveCompactPreference, useCompactPreferences } from '../../resources/js/lib/compactPreferences';

// Only the preference endpoint is mocked. The production store, CSS and browser APIs run unchanged.
Object.assign(window, { route: (name: string, params: { name?: string } | number) => name === 'users.card' ? `/profile-api/${params}` : name === 'characters.show' ? `/Avatars/Standing/${(params as { name: string }).name}.svg` : '/preferences' });
syncCompactPreferences(42, null);
const events: unknown[] = [];
const channel = browserChannel('browser-test', (data) => events.push(data));
Object.assign(window, { testChannel: channel, testEvents: events });
function Harness() {
    const state = useCompactPreferences();
    const [peek, setPeek] = useState(false);
    return <div className="bg-neutral-950 p-4 text-neutral-100">
        <h1>Browser compatibility</h1>
        <button id="copy" onClick={() => void copyText('SFD-DJ.EU').then(() => { document.body.dataset.copy = 'ok'; }).catch(() => { document.body.dataset.copy = 'error'; })}>Copy</button>
        <input id="focus" defaultValue="Keep my focus" />
        <button id="peek" onClick={() => setPeek(true)}>Preview member</button>
        {peek && <PeekCard user={{ id: 77, name: 'DJ Test', avatar: 'char:foxy', role: { key: 'member', label: 'Member', color: '#ffffff' } }} anchor={new DOMRect(500, 100, 20, 20)} />}
        <button id="compact" onClick={() => saveCompactPreference('compact', !state.values.compact)}>Compact</button>
        <button id="compact-chat" onClick={() => saveCompactPreference('compact_chat', !state.values.compact_chat)}>Compact chat</button>
        <output id="density" className="block break-all">{JSON.stringify(state.values)}</output>
        <select aria-label="Genre"><option>All genres</option><option>House</option></select>
        <img alt="Bamboo Panda" width="120" height="165" src="/Avatars/Dancing/bamboopanda.svg" />
    </div>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
