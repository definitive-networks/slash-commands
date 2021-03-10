const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'info',
    description:'Gets Bot Info.',
    guilds: [ '814534163742064670' ],
    options: {},
    async execute(interaction) {
        const embed = new MessageEmbed({
            title: 'Definitive Testing Bot',
            description: 'Testing slash commands since 2021',
            color: 0x375bd2,
            footer: {
                icon_url: 'https://i.imgur.com/KA7T3je.png',
                text: 'DEFN Infrastructure',
            },
        })
        interaction.sendEmbed(embed);
    }
}