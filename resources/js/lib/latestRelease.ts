/** Small summary shared by the home page, dashboard and chat; the archive loads separately. */
export type Kind = 'new' | 'improved' | 'fixed';

export const latestRelease: { version: string; title: string; notes: [Kind, string][] } = {
    version: '1.71',
    title: 'Legendary characters: Veyra and Kaida',
    notes: [
        ['new', 'Veyra joins the Avatar Shop at level 28 with a phoenix mask, glowing heart, feather fan, trailing tail and floating embers.'],
        ['improved', 'Veyra has separate standing, dancing and DJ performances. The dance uses 60 articulated poses over 2.4 seconds, with planted feet and delayed feather movement. Reduced-motion settings show a still pose.'],
        ['new', 'Kaida, a nine-tailed celestial kitsune, joins the Avatar Shop at level 32 with an aurora silk costume, foxfire details and nine animated tails.'],
        ['improved', 'Kaida has 60 articulated poses across standing, dancing and DJ performances. The dance moves at a relaxed 2.8-second loop, with planted steps and individually staggered tails that follow each turn.'],
    ],
};

export const VERSION = latestRelease.version;
