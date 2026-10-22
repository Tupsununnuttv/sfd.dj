import Avatar from '../../resources/js/Components/Avatar';
import RoomScene from '../../resources/js/Components/RoomScene';
import { useTouchRendering } from '../../resources/js/lib/touchRendering';
import { useState } from 'react';

/** Production room renderer with the Dragon scene, animated characters and repeated cosmetic avatars. */
export default function MobileRoomHarness() {
    const touch = useTouchRendering();
    const [tab, setTab] = useState('Chat');
    const role = { key: 'user', label: 'User', color: '#a78bfa' };
    const users = [{ id: 1, name: 'Kaida', avatar: 'char:kaida', role }, { id: 2, name: 'Foxy', avatar: 'char:foxy', role }, { id: 3, name: 'DJ', avatar: 'char:foxy', role }];
    return <div className="sfd-room flex h-dvh overflow-hidden bg-black text-white" data-rendering={touch ? 'touch' : 'full'}>
        <style>{`.sfd-room .sfd-navbar, .sfd-room .sfd-chat {backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important}.sfd-room .sfd-avatar {filter:drop-shadow(0 0 6px #ff00cc)!important}`}</style>
        <main className="sfd-main flex min-w-0 flex-1 flex-col">
            <header className="sfd-navbar flex h-14 shrink-0 items-center gap-3 bg-violet-950/70 px-3">
                <span data-render-marker className="h-2 w-2 shrink-0 bg-white" />
                <Avatar name="Kaida" avatar="char:kaida" cosmetics={{ frame: 'neon', effect: 'fireflyswarm' }} className="h-8 w-8" />
                <h1 className="truncate text-sm font-bold">Mobile room rendering</h1>
            </header>
            <RoomScene background="dragon" users={users} dj={users[2]} dancing={new Set([1, 2])} playing myId={1}
                screen={<div data-test-video className="flex h-full items-center justify-center bg-neutral-900 text-white">Video stays mounted</div>}
                votes={<button className="bg-green-900 px-3 py-2">Woot</button>} waitlist={<button className="bg-sky-900 px-3 py-2">Join Waitlist</button>} seat={null} onUser={() => {}} />
        </main>
        <aside className="sfd-panel flex w-36 shrink-0 flex-col bg-black sm:w-72">
            <nav className="sfd-tabs flex h-14 shrink-0 items-stretch">{['Chat', 'Users'].map((name) => <button key={name} onClick={() => setTab(name)} className="flex-1 text-xs">{name}</button>)}</nav>
            <div className="sfd-chat min-h-0 flex-1 overflow-y-auto bg-violet-950/40 px-3" data-test-tab={tab}>
                {Array.from({ length: 24 }, (_, i) => <div key={i} className="sfd-message flex items-center gap-2 border-b border-white/10 py-3">
                    <Avatar name={`Member ${i}`} avatar="char:kaida" cosmetics={{ frame: 'neon', effect: 'fireflyswarm' }} className="h-8 w-8" />
                    <span className="text-xs">Message {i + 1}</span>
                    <span data-chat-marker className="h-2 w-2 shrink-0 bg-white" />
                </div>)}
            </div>
        </aside>
    </div>;
}
