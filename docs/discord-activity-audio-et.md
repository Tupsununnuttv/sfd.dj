# Discord Activity muusika ja heli

2026-10-27 kontrollis avanes SFD.DJ ruum Discordi proxy kaudu HTTP 200 vastusega, kuid YouTube'i `/_discord/youtube/iframe_api` ja SoundCloudi `/_discord/soundcloud/player/api.js` vastasid HTTP 404-ga. Need päringud peavad laadima JavaScripti. Ainult veebilehe juurkirjest `/` ei piisa pleierite laadimiseks.

Sama päeva hilisemas kontrollis laadis YouTube'i API juba HTTP 200 vastusega. SoundCloudi proxy API vastas endiselt 404-ga, samal ajal kui teenuse enda `https://w.soundcloud.com/player/api.js` vastas 200-ga. Kontrolli ja salvesta ka SoundCloudi Proxy Path Mapping. YouTube'i API 200 ei tõesta veel video ega heli käivitumist.

## 1. Lisa teenuste URL Mappings

1. Ava [SFD.DJ rakendus Developer Portalis](https://discord.com/developers/applications/1563979983582535841).
2. Ava **Activities → URL Mappings**.
3. Jaotises **Root Mapping** hoia olemasolev `/` → `sfd-dj.eu` alles. Seal on ainult üks juurkirje; pleierite jaoks ei ole vaja uut Root Mapping'ut.
4. Keri sama lehe jaotisse **Proxy Path Mappings**. Lisa sinna järgmised kaheksa kirjet. Need vastavad faili `config/discord-activity.php` loendile.

| Prefix | Target |
| - | - |
| `/_discord/youtube` | `www.youtube.com` |
| `/_discord/youtube-nocookie` | `www.youtube-nocookie.com` |
| `/_discord/ytimg/{subdomain}` | `{subdomain}.ytimg.com` |
| `/_discord/soundcloud` | `w.soundcloud.com` |
| `/_discord/sndcdn/{subdomain}` | `{subdomain}.sndcdn.com` |
| `/_discord/twitch` | `player.twitch.tv` |
| `/_discord/kick` | `player.kick.com` |
| `/_discord/discord-cdn` | `cdn.discordapp.com` |

Target on domeen **ilma `https://`-ta**. `{subdomain}` on nimeline asendus, mitte tärn. Ära suuna neid prefikseid oma Laravel Cloudi domeenile: nende sihtkohad on teenusepakkujate domeenid.

5. Salvesta Portalist muudatused.
6. Sulge vana Activity täielikult ja käivita see häälekanalis uuesti. Testi ajal peab SFD.DJ ruumis päriselt lugu mängima.

## 2. Kontrolli heli kasutajana

1. Vajuta parandatud vaates nuppu **Enable sound**. Vanemas vaates võib sama nupp olla **Tap to start playback with sound**. Brauser võib nõuda kasutaja klõpsu enne heliga taasesitust.
2. Kontrolli ruumi ülaribast, et heli pole vaigistatud ja helitugevus on suurem kui 0.
3. Kontrolli Discordi Activity helitugevust selle juhtnuppudest ning arvuti heliväljundit/helitugevuse mikserit. Iga osaleja kuuleb oma kliendi pleierit; veebipleier ei edasta muusikat mikrofonina häälekanalisse.
4. Katseta eraldi üht YouTube'i ja üht SoundCloudi lugu ning loo vahetumist. Kui üks konkreetne lugu ei mängi, proovi teist avalikku manustamist lubavat lugu.
5. Kui kuvatakse pleieri veateade, kontrolli kõigepealt mapping'uid ja vajuta **Retry playback**. See loob pleieri uuesti. Kui viga kordub, salvesta kuvatud teenuse nimi ja veakood.

## 3. Paigalda koodiparandus ja kontrolli päringuid

Tõsta paranduse lähtefailid Laravel Cloudiga ühendatud GitHubi repositooriumi samade kaustateedega, tee commit ühendatud harusse ning deploy uus commit. Hoia olemasolevad Composer/PHP käsud alles ja ehita frontend:

```sh
npm ci
npm run build
```

Koodiparandus hoiab YouTube'i iframe'i kaardistatud aadressil, kuid annab pleieri API `host` väärtuseks ainult Discordi proxy **päritolu** (`https://1563979983582535841.discordsays.com`). Varasem `host`, mille lõpus oli `/_discord/youtube`, sisaldas teed ja ei sobinud API `postMessage` päritolukontrolliga. Lisaks kuvatakse pleieri laadimise/taasesituse vead ning saab kasutada nuppe **Enable sound** ja **Retry playback**. Need parandused ei kinnita iseenesest teenuste päris heli ühilduvust Discordiga.

Hoia Cloudis **X-Frame-Options = Anywhere**, **X-Content-Type-Options = nosniff** ja **Purge edge cache on deploy** sees. Ära keela heli parandamiseks `nosniff`-i ega lülita sisse **Under attack mode**. Helipleierite 404 lahendatakse esmalt URL Mapping'utes, mitte nende päiste nõrgendamisega.

Pärast salvestamist ja deploy'd käivita projekti kaustas:

```sh
node scripts/check-discord-activity.mjs https://sfd-dj.eu
```

Mõlemad **Provider URL Mapping** read peavad näitama HTTP 200 ja JavaScripti Content-Type'i. 404 või HTML tähendab, et vajalik päring ei jõua pleieri teenuseni; kontrolli rakenduse ID-d, täpset prefiksit, sihtdomeeni ja salvestamist. HTTP-kontroll ei tõesta, et video/heli päris Discordi kliendis mängib.

## Teenuste ühilduvuse piir

Discord piirab Activity välispäringuid ja nõuab kaardistatud aadresse. Rakenduse `patchUrlMappings` aitab selle lehe päringuid; see ei muuda automaatselt teenuse enda iframe'i sees olevat koodi. Teenuse iframe võib kasutada täiendavaid domeene, kontrollida päritolu või piirata proxys esitamist. Seetõttu ei taga üksnes skriptide HTTP 200 veel heli. Kui pleier ise näitab veakoodi, on järgmise paranduse jaoks vaja selle koodi ja teenuse nime.

Parandus ei laadi teenuste muusikat serveri kaudu alla ega eemalda nende manustamise kaitseid. Heli lõppkontroll tuleb teha päris Discordis pärast Portalisse salvestamist.

Allikad: [Discordi võrk ja URL Mappings](https://docs.discord.com/developers/activities/development-guides/networking), [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference), [SoundCloud Widget API](https://developers.soundcloud.com/docs/api/html5-widget).
