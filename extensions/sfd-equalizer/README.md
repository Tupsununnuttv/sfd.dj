# Paigaldamine

1. Paki ZIP lahti eraldi kausta ja hoia see kaust alles.
2. Ava Chrome'is chrome://extensions v?i Edge'is edge://extensions.
3. L?lita sisse Developer mode / Arendajare?iim.
4. Vajuta Load unpacked / Laadi pakkimata laiendus ja vali kaust, kus on manifest.json.
5. Kinnita SFD DJ Equalizer brauseri t??riistaribale ja v?rskenda ruumi lehte.
6. Vajuta ruumi vahelehel laienduse ikoonile. Ikoonile ilmub EQ.
7. N??d saad ruumi Equalizer-paneelis bassi, keskmisi ja k?rgeid kohe muuta.

V?ljal?litamiseks vajuta paneelis Turn off v?i uuesti laienduse ikoonile.
P?rast lehe t?ielikku v?rskendamist tuleb uuesti laienduse ikoonile vajutada.
Ekraani jagamise akent ei avata. Brauseri enda helijuurdep??su m?rki ei peideta.
Laiendus t??tleb selle vahelehe k?iki helisid kohapeal, midagi ei salvestata ega laadita serverisse.

---

# SFD DJ Equalizer (Chrome / Edge desktop)

1. Open chrome://extensions (Chrome) or edge://extensions (Edge).
2. Enable Developer mode.
3. Choose Load unpacked and select this folder (the folder containing manifest.json).
4. Pin SFD DJ Equalizer to the browser toolbar. Refresh the SFD DJ room.
5. While the room tab is selected, click the extension icon once. The icon shows EQ.
6. Use the Equalizer sliders beside Volume in the room. Changes apply immediately.

Click the extension icon again, or Turn off in the room, to restore normal audio.
After a full page refresh or navigation, click the extension icon again. An extension
click is required by the browser for tab-audio access. No screen-sharing picker is used.
Chrome may still display its normal tab-audio capture indicator; it cannot be hidden.

Supports https://sfd-dj.eu (including subdomains), http://localhost and http://127.0.0.1.
Uses Chrome 116+ tabCapture and offscreen APIs; Firefox and mobile are not supported.
One room tab can be processed at a time. All sounds from that tab are processed,
including notification sounds. No microphone, camera, video capture, recording,
server upload, analytics, external scripts, or permission to read other websites.
Only bass/mid/treble settings are saved locally by the extension.

Source: https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture
