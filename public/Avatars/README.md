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

The imported `dragone01`, `dragone02`, `dragone03` and `dragone04` GIFs appear as Green Dragon, Red Dragon, Golden Dragon and Blue Dragon. Each has its original Standing, Dancing and DJing animation and is Legendary, unlocked at level 25 with the standard level-based coin price. Their filenames omit the source's hyphen to fit the character name format; no generator redraws these files.

| Who | Drawn by | Worn by |
| --- | --- | --- |
| `foxy`, `neko`, `bun`, `panda`, `wolfie`, `robo` | `node scripts/make-characters.mjs` | everybody, unlocked by level |
| `ice`, `azure`, `sun`, `nebula` (astronauts) and their slim `...mini` builds, `fedora`, `blaze`, `echo`, `blazeref`, `echoref`, `pandabear`, `adammochi` (a bearded DJ in a black robe and his panda) | `node scripts/make-staff-characters.mjs` | Brand Ambassador and above |
| `admin01` to `admin09`, `ba01` to `ba04` | imported original Standing, Dancing and DJing GIFs; no generator redraws them; source canvas ratios keep their room size comparable to the imported dragons | Brand Ambassador and above, free for those roles |
| `skelly` (a retrowave skeleton developer and his SFD ghost) | drawn elsewhere and dropped in as files: no script redraws it (the whole picture sits in one scaled group, and Dancing and DJing carry their still pose as extra CSS rules) | Brand Ambassador and above |
| `zoos02` (the Zoo S02 fox) | `node scripts/make-staff-characters.mjs` | the Owner only |
| `wilmer` (a friend in a varsity jacket), `milky` (the milk carton), `pip` (a penguin DJ), `elementaar` ("Elementary": a red pixel-art figure in a cap with the Cancer sign, goggles and a gas mask), `spooky` (the jack-o'-lantern scarecrow), `kikomochi` (a girl and her Shiba), `boomer` (a turtle with a boombox shell), `emberdragon`, `frostdragon` | `node scripts/make-staff-characters.mjs` | everybody, from level 4, 6, 7, 12, 14, 16, 20, 30 and 35 |
| `skully` (the skeleton DJ), `rift` (the raven mage), `fox` (the street fox) | `node scripts/make-staff-characters.mjs` | the Owner only |

Changing a file here by hand is fine, but running its script again writes those files again (`node scripts/make-staff-characters.mjs ice fedora` redraws only the ones named).

Run `npm run build` after changing source art. It regenerates the static PNG/GIF posters in `Previews` and the pre-rendered Aether, Kaida, Solstice and Veyra dance/DJ loops in `Animations`; deploy both directories with the frontend bundle. Small avatar icons and idle room characters use still posters to save memory. Characters on the dance floor and the active DJ retain their animations.

An SVG moves by itself (CSS animation). When the computer is set to reduce motion it keeps still, but each state is still a different pose, so you can tell them apart. The site's **Always play animations** setting (Settings, Appearance) asks for the moving version anyway.
