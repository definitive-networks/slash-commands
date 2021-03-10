
module.exports = {
  name: 'ping',
  description:'Pong!',
  guilds: [ '814534163742064670' ],
  options: {},
  execute(interaction) {
    return interaction.sendMessage('Pong!');
  }
}