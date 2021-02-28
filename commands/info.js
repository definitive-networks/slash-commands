const { InteractionResponseType } = require('slash-commands');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'info',
    description:'Gets Bot Info.',
    guilds: [],
    async execute(client, request) {
        const embed = new MessageEmbed({
            title: 'Definitive Testing Bot',
            description: 'Testing slash commands since 2021',
            color: 0x375bd2,
            footer: {
                icon_url: 'https://i.imgur.com/KA7T3je.png',
                text: 'DEFN Infrastructure',
            },
        })
        
        client.api.interactions(request.id, request.token).callback.post({
        data: {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed]
            }
        }
        })
    }
}