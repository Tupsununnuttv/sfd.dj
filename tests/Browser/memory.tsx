import '../../resources/css/app.css';
import { createRoot } from 'react-dom/client';
import Avatar from '../../resources/js/Components/Avatar';
import RoomScene from '../../resources/js/Components/RoomScene';
import { syncSystemPreferences } from '../../resources/js/lib/systemPreferences';

const names = ['kaida', 'veyra', 'solstice', 'aether', 'foxy', 'neko', 'bun', 'panda', 'wolfie', 'robo', 'ice', 'azure', 'sun', 'nebula', 'elementaar', 'boomer', 'milky', 'pip', 'emberdragon', 'frostdragon', ...Array.from({ length: 9 }, (_, i) => `admin0${i + 1}`), ...Array.from({ length: 4 }, (_, i) => `ba0${i + 1}`), ...Array.from({ length: 4 }, (_, i) => `dragone0${i + 1}`)];
Object.assign(window, { route: (_: string, { name, state = 'standing' }: { name: string; state?: string }) => `/Avatars/${state === 'dancing' ? 'Dancing' : state === 'djing' ? 'DJing' : 'Standing'}/${name}.${/^(admin|ba|dragone)\d+$/.test(name) ? 'gif' : 'svg'}` });
const role = { key: 'member', label: 'User', color: '#a78bfa' };
syncSystemPreferences(42, { system: { low_performance: new URLSearchParams(location.search).has('low-performance') } });
const users = names.map((name, i) => ({ id: i + 1, name, avatar: `char:${name}`, role }));
createRoot(document.getElementById('root')!).render(
    <div className="sfd-room flex h-dvh overflow-hidden bg-black text-white" data-rendering="full">
        <main className="flex min-w-0 flex-1 flex-col">
            <RoomScene background="dragon" users={users} dj={users.at(-1)!} dancing={new Set(users.filter((_, i) => i % 2 === 0).map(u => u.id))} playing myId={1}
                screen={<div className="h-full bg-neutral-950" data-test-video>Video placeholder</div>} votes={<button>Woot</button>} waitlist={<button>Join waitlist</button>} seat={null} onUser={() => {}} />
        </main>
        <aside className="sfd-chat w-72 shrink-0 overflow-auto bg-neutral-950">
            {Array.from({ length: 120 }, (_, i) => <div className="flex items-center gap-2 p-2" key={i}><Avatar name={names[i % names.length]} avatar={`char:${names[i % names.length]}`} /><span>Message {i + 1}</span></div>)}
        </aside>
    </div>,
);
