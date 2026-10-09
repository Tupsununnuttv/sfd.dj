/** The class names of the room page that a room's own CSS can use (as `.sfd-<name>`). The same list is in App\Support\RoomCss::HOOKS, and a test checks that they agree. */
export const CSS_HOOKS: [string, string][] = [
    ['room', 'The whole room page (body and :root mean this too)'],
    ['main', 'Everything left of the chat: the top bar, the room and the bottom bar'],
    ['navbar', 'The bar at the top of the room'],
    ['stage', 'The room itself, with the video, the booth and the crowd'],
    ['footbar', 'The bar at the bottom of the room'],
    ['panel', 'The whole right side: the tabs and what is under them'],
    ['tabs', 'The Chat, Waitlist and Users tabs'],
    ['chat', 'The chat: its messages and the box you type in'],
    ['message', 'One line of chat'],
    ['users', 'The list of people in the room'],
    ['user', 'One person in that list'],
    ['waitlist', 'The waitlist'],
    ['votes', 'The Woot, Meh and Grab buttons'],
    ['join', 'The Join Waitlist button'],
    ['avatar', 'Anybody\'s picture'],
];
