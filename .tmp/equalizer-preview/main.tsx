import React from 'react';
import { createRoot } from 'react-dom/client';
import AudioEqualizer from '../../resources/js/Components/AudioEqualizer';
import '../../resources/css/app.css';
createRoot(document.getElementById('root')!).render(<div className="sfd-room flex justify-end p-8 text-white"><AudioEqualizer /></div>);
