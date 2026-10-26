# Discordi keskkonnamuutujate kontroll

Kontrollitud 2026-10-26 kohalikus projektis. Laravel Cloudi salvestatud muutujad ei ole selle kohaliku failiga automaatselt sünkroonis.

## Kohalikus .env failis korrastatud

- Säilitatud varasem veebilehe OAuthi `DISCORD_CLIENT_ID` ja `DISCORD_CLIENT_SECRET` paar. Hilisem Activity-plokk oli need nimed uuesti defineerinud ning lõpus olid ka iseendale viitavad kordused.
- Activity kasutab eraldi `DISCORD_ACTIVITY_CLIENT_ID=1563979983582535841` ja `DISCORD_ACTIVITY_ROOM=sfddj`.
- Eemaldatud `VITE_DISCORD_CLIENT_SECRET`. `VITE_` muutujad on veebikoodile avalikud; sellist prefiksit ei tohi salajase võtme puhul kasutada.
- Eemaldatud praeguses koodis kasutamata `DISCORD_TOKEN`, `DISCORD_ACTIVITY_APP_ID`, `VITE_DISCORD_ACTIVITY_APP_ID` ja `VITE_DISCORD_CLIENT_ID`.
- Eemaldatud külalis-Activity jaoks mittevajalik `DISCORD_ACTIVITY_CLIENT_SECRET` koos selle kordusega.
- Tegelik `DISCORD_BOT_TOKEN` jäi muutmata. Seda kasutab olemasolev bot; Activity tokeni ümbernimetamine selle asemele võib teise boti katki teha.
- Kohalikud `APP_ENV=local`, `APP_DEBUG=true` ja `APP_URL=http://localhost:8000` jäid arenduse jaoks alles.

Avaliku `public/build` kataloogi 198 JS/JSON/HTML/map faili kontrollis ei leitud võrreldud kohalikke Discordi salajasi võtmeid. See ei tõenda, et varasemas või Cloudis tehtud build'is neid kunagi polnud.

## Laravel Cloudi production

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://sfd-dj.eu
DISCORD_ACTIVITY_CLIENT_ID=1563979983582535841
DISCORD_ACTIVITY_ROOM=sfddj
```

Hoia veebilehe Discordi sisselogimise õige ID/võtme paar eraldi, kumbki ainult ühe korra. ID ja secret peavad kuuluma samale Discordi rakendusele. Bot kasutab oma tokenit muutujas `DISCORD_BOT_TOKEN`; selle külalisvaate jaoks pole botitokenit vaja.

Eemalda Cloudist samuti aegunud Discordi Activity muutujad ja kõik `VITE_` nimega salajased võtmed. Salvesta ning tee uus deploy ja frontend build, et keskkond ja võimalik konfiguratsiooni vahemälu kasutaksid parandatud väärtusi. Kohaliku .env muutmine ei muuda Cloudi väärtusi. Ära laadi privaatset .env faili GitHubi ega deploy-ZIP-i.

## Pildil avaldatud võtmete uuendamine

Pildil oli botitoken ja client secret nähtaval. Ava neid omav rakendus Developer Portalis ning uuenda vastavad väärtused **Bot → Reset Token** ja **OAuth2 → Reset Secret** kaudu. Kui mõni päriselt kasutatav teenus kasutas neid võtmeid, lisa uued väärtused selle teenuse salajastesse serverimuutujatesse ja taaskäivita/deploy teenus. Neid toiminguid siin sessioonis ei tehtud. Uusi võtmeid ei ole vaja vestlusesse saata.

## Ülejäänud fail

Failis leidub ka teisi korduvaid määratlusi: `BROADCAST_CONNECTION` (sama väärtus kaks korda), `DISCORD_REDIRECT_URI`, `DISCORD_SECOND_REDIRECT_URI`, `SPOTIFY_REDIRECT_URI` ja `STRIPE_SECRET`. Discordi redirect-muutujatel pole praeguses lähtekoodis tarbijat; callback-aadressid loob kontroller route'ide kaudu. Ülejäänud teenuste erinevaid väärtusi selles Discordi paranduses ei valitud ega muudetud. Eriti makseteenuse võtmed tuleb kontrollida vastava teenuse ja tootmiskeskkonna järgi. Vormingu kontroll ei kinnita teenusevõtmete kehtivust; päris välisteenuste sisselogimisi või makseid ei proovitud.

Allikad: [Vite keskkonnamuutujad ja salajaste võtmete kaitse](https://vite.dev/guide/env-and-mode#env-variables), [Discordi võtmete käsitlemine](https://docs.discord.com/developers/quick-start/getting-started#fetching-your-credentials).
