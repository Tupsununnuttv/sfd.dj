import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatPanel from '../../resources/js/Components/ChatPanel';
import '../../resources/css/app.css';
window.route = ((name: string) => '/preview/' + name) as any;
createRoot(document.getElementById('root')!).render(<div className="h-[400px] w-full text-white"><ChatPanel slug="preview" messages={[]} userId={1} canDelete={false} emojis={[]} stickers={[]} typingText="" onType={() => {}} roomRoleOf={() => null} chatSize="normal" showAvatars myName="Preview" onUser={() => {}} mention={null} onMentionConsumed={() => {}} /></div>);
