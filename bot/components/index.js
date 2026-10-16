// The buttons and forms (modals) of the bot. A file exports `buttons` and/or `modals`: lists of { id (the whole customId) or prefix (how it starts), execute(interaction) }.
import { buttons as applicationButtons, modals as applicationModals } from './applications.js';
import { buttons as giveawayButtons } from './giveaways.js';
import { modals as infoModals } from './info.js';
import { buttons as ticketButtons, modals as ticketModals } from './tickets.js';

export const buttons = [...ticketButtons, ...giveawayButtons, ...applicationButtons];
export const modals = [...applicationModals, ...ticketModals, ...infoModals];

/** The handler for a customId: the one with exactly that id, else the first whose prefix it starts with. */
export const handlerFor = (list, customId) => list.find((component) => component.id === customId)
    ?? list.find((component) => component.prefix && customId.startsWith(component.prefix));
