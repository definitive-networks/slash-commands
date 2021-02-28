const { InteractionResponseType } = require('slash-commands');

module.exports = {
  name: 'ping',
  description:'Pong!',
  guilds: [],
  execute(client, request) {
    client.api.interactions(request.id, request.token).callback.post({
        data: {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Pong!'
            }
        }
    })
  }
}