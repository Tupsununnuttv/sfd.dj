import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { applicationsChannelId, staffApplicationQuestions, staffApplicationRequirements } from '../config/index.js';
import { client } from '../lib/client.js';

/** The button under /apply that opens the form. */
export const applicationStartButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('staff-application:start').setLabel('Start application').setStyle(ButtonStyle.Primary),
);

/** Approve / Reject, under an application in the staff channel. */
export const applicationButtons = (applicationId, discordId) => new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId(`staff-application:approve:${applicationId}:${discordId}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
        .setCustomId(`staff-application:reject:${applicationId}:${discordId}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger),
);

export const applicationModal = () => new ModalBuilder()
    .setCustomId('staff-application:submit')
    .setTitle('SFD-DJ.EU staff application')
    .addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder()
            .setCustomId('motivation')
            .setLabel(staffApplicationQuestions.motivation.slice(0, 45))
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(900)
            .setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder()
            .setCustomId('experience')
            .setLabel(staffApplicationQuestions.experience.slice(0, 45))
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(900)
            .setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder()
            .setCustomId('availability')
            .setLabel(staffApplicationQuestions.availability.slice(0, 45))
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(900)
            .setRequired(true)),
    );

/** An application, as one message with Approve / Reject buttons in the staff applications channel. */
export const sendApplication = async (interaction, answers, source) => {
    if (!applicationsChannelId) {
        await interaction.reply({ content: 'Staff applications are not configured yet.', flags: MessageFlags.Ephemeral });

        return;
    }

    const channel = await client.channels.fetch(applicationsChannelId);
    if (!channel?.isTextBased() || !channel.isSendable()) {
        await interaction.reply({ content: 'The staff applications channel could not be reached.', flags: MessageFlags.Ephemeral });

        return;
    }

    const applicationId = interaction.id;
    const requirements = staffApplicationRequirements.length ? `\n\nRequirements: ${staffApplicationRequirements.join('; ')}` : '';
    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Staff application')
        .setDescription(`Submitted via ${source}.${requirements}`)
        .addFields(
            { name: 'Applicant', value: `${interaction.user} (${interaction.user.username})`, inline: true },
            { name: 'Discord ID', value: interaction.user.id, inline: true },
            { name: staffApplicationQuestions.motivation, value: answers.motivation },
            { name: staffApplicationQuestions.experience, value: answers.experience },
            { name: staffApplicationQuestions.availability, value: answers.availability },
        )
        .setTimestamp();

    await channel.send({ embeds: [embed], components: [applicationButtons(applicationId, interaction.user.id)] });
    await interaction.reply({ content: 'Your application has been sent to the staff team.', flags: MessageFlags.Ephemeral });
};
