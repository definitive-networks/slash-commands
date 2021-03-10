require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const daSlash = require('da-slash');

const slashClient = new daSlash.Client(client, {
    commands: {
        directory: "/commands"
    }
})

client.on('ready', async () => {
    console.log(`[Event] Logged in as ${client.user.tag}!`);

    try {
        //await deleteAllCommands();
        await postCommands();
    }
    catch (err) {
        console.error(`[ERROR] Uncaught Exception:`);
        console.group();
        console.error(err);
        console.groupEnd();
    }
})

client.ws.on('INTERACTION_CREATE', async (request) => {
    const interaction = new daSlash.Interaction(client, request);

    try {
        await slashClient.matchCommand(interaction)
    }
    catch(err) { 
        console.error(`[ERROR] Uncaught Exception:`);
        console.group();
        console.error(err);
        console.groupEnd();
    }
})

client.login(process.env.DISCORD_BOT_TOKEN).catch(console.warn(`[WARNING] Failed to login`));

async function deleteAllCommands() {
    console.log(`[Event START] Deleting all commands:`)
    console.group();
    console.group();
    await new Promise(async (resolve) => {
        let guild_ids = await getGuildIds();
        let deletedCommands = await slashClient.deleteCommands(guild_ids, true);
        for (const guild of deletedCommands[0].guilds) {
            for (const command of guild.commands) {
                console.log(`Deleted guild command ${command.name} for ${guild.guild}.`);
            }
        }
        for (const command of deletedCommands[1].global) {
            console.log(`Deleted global command ${command.name}.`);
        }
        resolve();
    })
    console.groupEnd();
    console.groupEnd();
    return console.log(`[Event END] Finished deleting all commands!`)
}

async function getGuildIds() {
    return new Promise(async (resolve) => {
        let guild_ids = [];
        client.guilds.cache.forEach(guild => {
            guild_ids.push(guild.id);
        });
        resolve(guild_ids);
    })
}

async function postCommands() {
    console.log(`[Event START] Posting commands:`)
    console.group();
    console.group();
    await new Promise(async (resolve) => {
        for (const [key] of await slashClient.postCommands()) {
            console.log(`Posted ${key}.`);
        }
        resolve();
    })
    console.groupEnd();
    console.groupEnd();
    return console.log(`[Event END] Finished posting commands!`)
}