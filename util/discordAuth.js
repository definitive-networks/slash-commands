require('dotenv').config();
const btoa = require('btoa');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { ApplicationCommandOptionType, DiscordInteractions } = require('slash-commands');

module.exports.authDiscordClient = async () => {
    var clientCredentials = require('./discordClientCredentials.json');

    var interaction = new DiscordInteractions({
		applicationId: process.env.DISCORD_CLIENT_ID,
        publicKey: process.env.DISCORD_PUBLIC_KEY,
        authToken: clientCredentials['access_token'],
        tokenPrefix: clientCredentials['token_type']
	});

    let doesNeedRefresh = await doesTokenNeedToBeRefreshed(interaction);
    if (clientCredentials === {} || doesNeedRefresh) {
        console.log('[Event] Refreshing client credentials. . .')
        const newClientCredentials = await generateClientCredentials();
        updateClientCredentialsFile(await newClientCredentials);

        interaction['authToken'] = newClientCredentials['access_token'];
        interaction['tokenPrefix'] = newClientCredentials['token_type'];
    }

    return interaction;
}

async function doesTokenNeedToBeRefreshed(interaction) {
    const command = {
        name: "test",
        description: "test the token",
        options: [
            {
                name: "valid",
                description: "this should not be seen",
                type: ApplicationCommandOptionType.BOOLEAN
            }
        ]
    }

    let testingCommand = await interaction.createApplicationCommand(command);
    if (testingCommand['message'] === '401: Unauthorized' || testingCommand['code'] === 0) {
        return true;
    }

    let testingToken = await interaction.deleteApplicationCommand(testingCommand['id']);
    if (await testingToken) {
        return false;
    }
    return true;
}

const generateClientCredentials = module.exports.generateClientCredentials = async () => {
    const obj = {
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'applications.commands.update'
    }

    const creds = btoa(`${obj.client_id}:${obj.client_secret}`);
    const headers = {
        'User-Agent': 'Discord-OAuth2',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${creds}`
    }

    const encodedBody = uriEncode(obj);
    const encodedUrl = `https://discord.com/api/oauth2/token?${encodedBody}`;

    let generatedCredentials;

    await fetch(encodedUrl,{
        method: 'POST',
        headers: headers,
    })
    .then(async res => {
        const credentials = await res.json();
        if (await credentials['access_token']) {
            console.log('[Event] Sucessfully generated client credentials.');
            generatedCredentials = await credentials;
        }
        else {
            console.error('[ERROR] Recieved client credentials without an access token.')
        }
    })

    return generatedCredentials;
}

function uriEncode(obj) {
    let string = "";

    for (const [key, value] of Object.entries(obj)) {
        if (!value) continue;
        string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }

    return string.substring(1);
}

function updateClientCredentialsFile(credentials) {
    let filePath = path.resolve('./util/discordClientCredentials.json');

	fs.writeFile(filePath, JSON.stringify(credentials, null, 2), function writeJSON(err) {
		if (err) {
			console.error(`[ERROR] There was a problem saving the client credentials to file: ${err}`);
		}
        else {
            console.log('[Event] Sucessfully updated the client credentials file.');
        }
	})
}