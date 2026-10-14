# Avatars

Characters for the Avatar shop: whole people, one picture for each of three states.

| Folder     | When it shows                                                                  |
| ---------- | ------------------------------------------------------------------------------ |
| `Standing` | In a room, until you press Woot or Grab (and again after Meh). Also the face used in chat, lists and profiles. |
| `Dancing`  | In a room, after you press Woot or Grab.                                       |
| `DJing`    | On the stage, at the decks (between the turntables), while it is your song. Draw it **from behind**: the DJ stands with their back to us, looking at the screen. |

## Add your own

1. Draw the three pictures and give them the same name: 2 to 11 lower-case letters or digits (`mycat.svg`, `mycat.png` ...).
2. Put them in `Standing`, `Dancing` and `DJing`. Types: `svg`, `webp`, `gif` or `png` (`gif` and `webp` may be animated).
3. That is all: every picture in `Standing` shows up in the Avatar shop, under the Characters filter. A missing `Dancing` picture falls back to `Standing`, and a missing `DJing` picture to `Dancing`.
4. To make it unlock at a level, add `'char:mycat' => 4` to `AvatarController::UNLOCK['avatar']`. To keep it for a site role, add `'char:mycat' => 'brand_ambassador'` to `AvatarController::ROLE_ONLY` (that role and every role above it may wear it; `'owner'` makes it the Owner's alone). Without either it is free from level 1.

Draw the person standing, feet at the bottom, in a picture about 200 x 276 (a bit more room above the head and at the sides than the body needs, for ears and raised arms). Other shapes are fitted inside that box with the feet at the bottom.

## The built-in ones

| Who | Drawn by | Worn by |
| --- | --- | --- |
| `foxy`, `neko`, `bun`, `panda`, `wolfie`, `robo` | `node scripts/make-characters.mjs` | everybody, unlocked by level |
| `ice`, `azure`, `sun`, `nebula` (astronauts) and their slim `...mini` builds, `fedora`, `blaze`, `echo`, `blazeref`, `echoref` | `node scripts/make-staff-characters.mjs` | Brand Ambassador and above |
| `zoos02` (the Zoo S02 fox) | `node scripts/make-staff-characters.mjs` | the Owner only |
| `spooky` (the jack-o'-lantern scarecrow) | `node scripts/make-staff-characters.mjs` | everybody, from level 14 |
| `skully` (the skeleton DJ) | `node scripts/make-staff-characters.mjs` | everybody, from level 18 |
| `rift` (the raven mage) | `node scripts/make-staff-characters.mjs` | everybody, from level 25 |

Changing a file here by hand is fine, but running its script again writes those files again (`node scripts/make-staff-characters.mjs ice fedora` redraws only the ones named).

An SVG moves by itself (CSS animation). When the computer is set to reduce motion it keeps still, but each state is still a different pose, so you can tell them apart. The site's **Always play animations** setting (Settings, Appearance) asks for the moving version anyway.
