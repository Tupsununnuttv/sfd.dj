/** Small summary shared by the home page, dashboard and chat; the archive loads separately. */
export type Kind = 'new' | 'improved' | 'fixed';

export const latestRelease: { version: string; title: string; notes: [Kind, string][] } = {
    version: '1.81',
    title: 'A new Dashboard: On air',
    notes: [
        ['new', 'The Dashboard opens with On air: the song of the busiest room, its picture and record, who plays it and how far the song is. It moves on to the next room on air by itself, or pick one from the strip below it.'],
        ['new', 'Right now on SFD shows every room on air as a wall of tiles, each with its song and the time running.'],
        ['new', 'Who is around: your online friends as a row of faces. A coloured ring means they are in a room, and the face takes you there. Friend requests and unread whispers sit at the front of the row.'],
        ['new', 'Your day: your level as a ring round your face, and the goals of the day as three rings that close as you get songs played, woot and chat. Daily coins, your numbers and the room you were last in are in the same place.'],
        ['improved', 'Surprise me rolls the room names like a slot machine before it takes you to one. Press / anywhere on the Dashboard to search rooms, and the Top DJs stand on a podium.'],
        ['improved', 'Where motion is reduced, the record and the stage stand still and the song times keep counting.'],
    ],
};

export const VERSION = latestRelease.version;
