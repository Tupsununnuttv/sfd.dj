import { closeTicket, openTicket, ticketModal } from '../services/tickets.js';

export const buttons = [
    { id: 'ticket:open', execute: (interaction) => interaction.showModal(ticketModal()) },
    { prefix: 'ticket:close:', execute: (interaction) => closeTicket(interaction) },
];

export const modals = [
    {
        id: 'ticket:submit',
        execute: (interaction) => openTicket(
            interaction,
            interaction.fields.getTextInputValue('subject'),
            interaction.fields.getTextInputValue('details'),
        ),
    },
];
