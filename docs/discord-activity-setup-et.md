# SFD.DJ Discord Activity seadistamine

Rakenduse ID: `1563979983582535841`. Activity peab avama SFD.DJ avaliku ruumi `sfddj` külalisena.

## 1. Paigalda uus kood GitHubi kaudu

1. Laadi alla selle paranduse ZIP ja paki see arvutis lahti.
2. Laravel Cloudis ava olemasoleva `sfd.dj` rakenduse `production` keskkond. Vaata deploy-seadistusest, milline GitHubi repositoorium ja haru on ühendatud.
3. Tõsta ZIP-is olevad projektifailid sellesse repositooriumi **samade suhteliste kaustateedega**. Näiteks `app/Support/DiscordActivity.php` peab asendama just sama faili. Ära paiguta tervet ZIP-i rakenduse juurkausta ega muuda oma privaatset `.env` faili ZIP-i põhjal.
4. Tee commit ühendatud harusse. Deploy peab kasutama seda uut commiti, mitte eelmist versiooni.

Kood kuvab ruumi kohe HTTP 200 vastusena. Varasem alguslehe suunamine tagasi Discordi proxy aadressile andis päris proxys 520-vea. Lisaks parandati `/discord` tuvastamine, vana veebisisselogimise mõju ja ümbernimetatud ruumi suunamine. Veebilehe tavaline avaleht jääb väljaspool Activityt samaks.

## 2. Laravel Cloudi keskkonnamuutujad

Kontrolli `production` keskkonnas:

```dotenv
APP_URL=https://sfd-dj.eu
DISCORD_ACTIVITY_CLIENT_ID=1563979983582535841
DISCORD_ACTIVITY_ROOM=sfddj
```

Selle külalisvaate jaoks pole vaja Activity client secret'it ega uut `server.js` teenust. Hoia senised veebilehe OAuthi ja andmebaasi muutujad alles. Salvesta muudatused ja kasuta neid uuel deploy'l.

## 3. Laravel Cloudi võrgu- ja deploy-seadistus

1. Ava **Settings → Network → Edge network settings → Configure → Response rules**.
2. Sea **X-Frame-Options = Anywhere**.
3. Hoia **X-Content-Type-Options = nosniff**.
4. Vajuta **Update**, kui muutsid midagi.
5. **Cache** vaates hoia **Purge edge cache on deploy** sees. Pärast uut deploy'd võid kasutada ka **Purge cache now**.
6. Hoia olemasolevad Composer/PHP build-käsud alles. Frontendi build kasutab:

   ```sh
   npm ci
   npm run build
   ```

7. Käivita uue commiti **Deploy** ja oota edukat lõppu. Hoia rakenduse senine `php artisan optimize` / konfiguratsiooni vahemälu protsess kasutusel. Ära deploy `public/hot` faili.

Pelgalt päiste muutmine ei paigalda uut koodi. Pelgalt vana commiti uus deploy ei sisalda parandust.

## 4. Discord Developer Portal

1. Ava [rakendus 1563979983582535841](https://discord.com/developers/applications/1563979983582535841).
2. Ava **Activities → Settings** ja kontrolli, et **Enable Activities** oleks sees.
3. Kontrolli lubatud platvorme. Kui soovid telefoni tuge, peab vastav mobiiliplatvorm olema samuti lubatud.
4. Ava **Activities → URL Mappings**. Jaotises **Root Mapping** peab ainus põhikirje olema:

   | Prefix | Target |
   | - | - |
   | `/` | `sfd-dj.eu` |

   Target on domeen ilma `https://` ja ilma `/rooms/sfddj` lõputa. Õige ruumi valib serveri kood.

5. Keri samal lehel jaotisse **Proxy Path Mappings**. Lisa sinna muusika, mängijate ja piltide jaoks järgmised kirjed ning salvesta. Hoia Root Mapping oma veebilehele suunatuna:

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

   `{subdomain}` on nimeline asendus, mitte tärn. Kirjed peavad vastama koodis olevale `config/discord-activity.php` loendile. Senised YouTube'i ja SoundCloudi proxy-aadressid tagastasid kontrollis Laravel 404: vajalikud kirjed polnud nende päringute jaoks jõus.

## 5. Testi enne avalikustamist

1. Lisa vajalikud proovijad **App Testers** lehel ja palu neil kutse vastu võtta. Discordi juhendi järgi on verifitseerimata Activity piiratud arendajate/testijatega ning alla 25 liikmega serveritega. Kasuta selleks väikest testserverit.
2. Testija saab Discordi **User Settings → Advanced → Application Test Mode** kaudu aktiveerida ID `1563979983582535841`. Arendaja saab kasutada Developer Mode'i.
3. Sulge vana SFD.DJ Activity täielikult ja käivita see häälekanalis uuesti.
4. Nähtavale peab tulema SFD.DJ ruumi stseen, mängija ja vestluse ajalugu ning külalise olek. Avalehte ega vana Live rooms kataloogi ei pea alguses ilmuma.
5. Vajuta vajadusel **Enable sound** ning proovi helinuppu ja loo vahetumist. Pleieri vea järel kontrolli mapping'uid ja kasuta **Retry playback**. Proovi värskendamist ja kahe eri kasutaja üheaegset liitumist.

Muusika puhul tuleb päriselt kontrollida mõlemat teenust. URL Mappings valmistab vajalikud päringud ette, kuid teenuse enda iframe võib kasutada lisadomeene või proxy esitust piirata. Selles paranduses ei eemaldata teenuste kaitseid ega laadita muusikat serveri kaudu alla.

Heli paranduse kood annab YouTube'i API `host` väljale ainult proxy päritolu ja hoiab `/_discord/youtube` tee iframe'i aadressis. See parandab API sõnumite päritolukontrolli; päris heli tuleb siiski Discordis proovida. Täpsem juhend: [Discord Activity muusika ja heli](discord-activity-audio-et.md).

## 6. Tee Activity kõigile kättesaadavaks

1. Ava Developer Portalis **App Verification**.
2. Täida selle rakenduse lehel kuvatud nõuded. Rakenduse/arendustiimi omanik peab läbima Discordi nõutud isikutuvastuse ise.
3. Kui tingimused on täidetud, kasuta **Verify App** / esita taotlus ja oota Discordi kinnitust.
4. Kui rakendus on **Verified**, täida **Discovery → Discovery Settings** andmed ja pildid.
5. Ava **Discovery → Discovery Status** ja kasuta **Enable Discovery**, kui kõik nõuded on täidetud. See teeb rakenduse App Launcheri ja App Directory otsingus leitavaks; ilmumine võib võtta aega.

**Public Bot üksi ei tee Activityt kõigile avalikuks.** Laravel Cloudi päised, SDK ega uus domeen ei saa Discordi verifitseerimist asendada. Selles vestluses kinnitas omanik, et rakendus pole veel Verified.

## 7. Kontrollkäsk pärast deploy'd

Arvutis, kus projekti failid on olemas:

```sh
node scripts/check-discord-activity.mjs https://sfd-dj.eu
```

Kontroll vaatab nüüd ka päris Discordi proxyt, mitte ainult veebiserverit. Algusleht peab vastama otse 200-ga; proxy 520 tähendab, et käivitus pole korras. YouTube'i/SoundCloudi mängijate 404 tähendab, et URL Mapping'ud pole veel õiged. HTTP-kontroll ei kinnita App Verification'it ega asenda päris kliendis heli proovimist.

## Tehtud kontrollid ja piirid

Kohalikult läbisid 12 serveritesti 186 kontrolliga. Chromiumi iframe-kontroll kinnitas ruumi otseavamist, ühte SDK ready-ühendust, külalisõigusi, ruumivahetust, HTTP värskendusi ja mobiilivaadet. Mängijad olid selles testis asendused; päris YouTube'i/SoundCloudi heli pole siin kinnitatud. Uut parandust pole sellest sessioonist tootmisserverisse paigaldatud ning Developer Portali kirjeid pole muudetud, sest ühendatud repositooriumile ja sisselogitud portaalile puudub ligipääs.

Allikad: [Discordi verifitseerimata ja Verified Activityd](https://support-dev.discord.com/hc/en-us/articles/26576097154199-What-are-Verified-and-Unverified-Activities), [testijad ja käivitamine](https://support-dev.discord.com/hc/en-us/articles/21204493235991-How-Can-Users-Discover-and-Play-My-Activity), [App Verification](https://support-dev.discord.com/hc/en-us/articles/23926564536471-How-Do-I-Get-My-App-Verified), [Discovery](https://docs.discord.com/developers/discovery/enabling-discovery), [URL Mappings ja võrk](https://docs.discord.com/developers/activities/development-guides/networking).
