require('dotenv').config();

const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
const { registerCommands } = require('./util/slashCommands.js');
const { authDiscordClient } = require('./util/discordAuth.js');

var interaction;

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('ready', async () => {
    console.log(`[Event] Logged in as ${client.user.tag}!`);

    interaction = await authDiscordClient();
    await registerCommands(client.guilds.cache, interaction);
})

client.ws.on('INTERACTION_CREATE', async (request) => {
    var command = client.commands.get(request['data']['name']);

    try {
        await command.execute(client, request)
    }
    catch(err) { 
        console.error(err);
    }
})

client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error(`[ERROR] Failed to login`));