import React from 'react';
import {createRoot} from 'react-dom/client';
import PlaybackFrame from '../../resources/js/Components/PlaybackFrame';
import '../../resources/css/app.css';
createRoot(document.getElementById('root')!).render(<div className="sfd-room relative h-screen w-screen text-white"><PlaybackFrame normal={{left:20,top:20,width:420,height:236}} wide={{left:0,top:0,width:'100%',height:'80vh'}} source={{key:'preview',title:'Preview',youtubeId:'M7lc1UVf-VE',position:()=>12}}><iframe title="Preview main player" srcDoc="<body style='background:#121018;color:white;font:20px system-ui'>Main player remains mounted</body>" className="h-full w-full"/></PlaybackFrame></div>);
