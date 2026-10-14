// Draws the staff characters in public/Avatars: for every character one looping SVG for each state (Standing, Dancing, DJing).
//   - eight astronauts: Ice, Azure, Sun and Nebula, each in a standard and a slimmer "mini" build
//   - the people: Fedora (with a boombox), Blaze and Echo (DJs with headphones) and their referee-shirt versions Blaze Ref and Echo Ref
//   - the Zoo S02 fox
//   - Rift, the raven mage, and Skully, a skeleton DJ (the Owner only)
//   - for everybody, by level: Milky the milk carton (6), Panda Bear (12), Spooky the jack-o'-lantern scarecrow (14), Ember Dragon (30), Frost Dragon (35)
// The others are for the roles named in AvatarController::ROLE_ONLY. The six simple characters everybody can wear are drawn by make-characters.mjs.
// Run it with `node scripts/make-staff-characters.mjs`, or name the ones to redraw: `node scripts/make-staff-characters.mjs ice fedora`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { astronaut } from './staff-characters/astronaut.mjs';
import { dj } from './staff-characters/djs.mjs';
import { dragon } from './staff-characters/dragon.mjs';
import { fedora } from './staff-characters/fedora.mjs';
import { fox } from './staff-characters/fox.mjs';
import { STATES } from './staff-characters/kit.mjs';
import { milky } from './staff-characters/milky.mjs';
import { panda } from './staff-characters/panda.mjs';
import { rift } from './staff-characters/rift.mjs';
import { skully } from './staff-characters/skully.mjs';
import { spooky } from './staff-characters/spooky.mjs';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'Avatars');

const characters = {
    ice: (state) => astronaut('ice', false, state),
    icemini: (state) => astronaut('ice', true, state),
    azure: (state) => astronaut('azure', false, state),
    azuremini: (state) => astronaut('azure', true, state),
    sun: (state) => astronaut('sun', false, state),
    sunmini: (state) => astronaut('sun', true, state),
    nebula: (state) => astronaut('nebula', false, state),
    nebulamini: (state) => astronaut('nebula', true, state),
    fedora,
    blaze: (state) => dj('blaze', false, state),
    echo: (state) => dj('echo', false, state),
    blazeref: (state) => dj('blaze', true, state),
    echoref: (state) => dj('echo', true, state),
    zoos02: fox,
    rift,
    skully,
    spooky,
    pandabear: panda,
    emberdragon: (state) => dragon('ember', state),
    frostdragon: (state) => dragon('frost', state),
    milky,
};

const only = process.argv.slice(2);
const names = Object.keys(characters).filter((name) => !only.length || only.includes(name));

for (const state of STATES) {
    fs.mkdirSync(path.join(out, state), { recursive: true });
    for (const name of names) fs.writeFileSync(path.join(out, state, `${name}.svg`), characters[name](state));
}

console.log(`wrote ${names.length * STATES.length} pictures to ${out}`);
