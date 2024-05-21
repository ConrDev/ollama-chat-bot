import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('test'),
    // async execute(interaction) {
    //     await interaction.deferReply();
    //     await interaction.reply('Pong!');
    // },
};