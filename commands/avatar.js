const { InteractionResponseType } = require('slash-commands');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'avatar',
    description:'get a users avatar',
    guilds: [],
    async execute(client, request) {
        let user = await client.users.fetch(request['member']['user']['id']);
        let userAvatar = await user.avatarURL();
        
        client.api.interactions(request.id, request.token).callback.post({
        data: {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: userAvatar,
            }
        }
        })
    }
}