require('dotenv').config();

const fs = require('fs');
const path = require('path');

module.exports.registerCommands = async (guilds, interaction) => {
    var commands = {
        file: getFileCommands(),
        application: {
            guilds: [],
            global: await interaction.getApplicationCommands()
        }
    }

    commands = await getGuildApplicationCommands(commands, guilds, interaction);

    console.log(`[Event START] Updating Commands. . .`)
    try{
        // await deleteAllApplicationCommands(commands, interaction);
        await removeOldGuildCommands(commands, interaction);
        await removeOldGlobalCommands(commands, interaction);
        await loadFromFiles(commands, guilds, interaction);
        console.log(`[Event END] Finished Updating Commands!`);
    }
    catch (error) {
        console.error(interaction, error);
    }
};

const getFileCommands = module.exports.getCommands = () => {
	const commands = [];

	const commandDirectory = path.join(__dirname, '../commands');
	const commandFiles = fs.readdirSync(commandDirectory);

	for (const commandFile of commandFiles) {
		if (!commandFile.endsWith('.js')) continue;

		const commandData = require(path.join(commandDirectory, commandFile));

		if (!('name' in commandData)) continue;
		if (!('execute' in commandData)) continue;

		commands.push(commandData);
	}
	return commands;
};

const getGuildApplicationCommands = module.exports.getGuildApplicationCommands = async (commands, guilds, interaction) => {
    for (const guild of guilds) {
        let guildCommands = await interaction.getApplicationCommands(guild[0]);

        if (!guildCommands || guildCommands.length === 0) continue;
        if (guildCommands['message'] === 'Missing Access') {
            console.error('[ERROR] Missing Slash Access (application.commands)');
            process.exit(50001)
        }

        commands.application.guilds.push({
            id: guild[0],
            commands: guildCommands
        })
    }

    return commands;
}

const removeOldGuildCommands = module.exports.removeOldGuildCommands = async (commands, interaction) => {
    commands.application.guilds.forEach(async (appGuild) => {
        if (appGuild.commands.length === 0) return;

        let oldGuildCommands = appGuild.commands.filter(appGuildCommand => {
            let oldGuildCommand = commands.file.find(fileCommand => fileCommand.name == appGuildCommand.name);
            return !oldGuildCommand.guilds.includes(appGuild.id);
        })
        
        await oldGuildCommands.forEach(async (oldGuildCommand) => {
            let isDeleted = await interaction.deleteApplicationCommand(oldGuildCommand.id, oldGuildCommand.guild_id);
            console.log(`Deleted Guild Command: ${oldGuildCommand.name} (${oldGuildCommand.id}) <${appGuild.id}>: ${await isDeleted}`);
        });
    })
};

const removeOldGlobalCommands = module.exports.removeOldGlobalCommands = async (commands, interaction) => {
	if (commands.application.global.length === 0) return;

    let oldGlobalCommands = commands.application.global.filter(appGlobalCommand => {
        let oldGlobalCommand = commands.file.find(fileCommand => fileCommand.name == appGlobalCommand.name);
        return (oldGlobalCommand === undefined || oldGlobalCommand.guilds.length != 0);
    })
    
    await oldGlobalCommands.forEach(async (oldGlobalCommand) => {
        let isDeleted = await interaction.deleteApplicationCommand(oldGlobalCommand.id);
        console.log(`Deleted Global Command: ${oldGlobalCommand.name} (${oldGlobalCommand.id}): ${await isDeleted}`);
    });
};

const loadFromFiles = module.exports.loadFromFiles = async (commands, guilds, interaction) => {
	await commands.file.forEach(async (fileCommand) => {
		if (fileCommand.guilds && fileCommand.guilds.length > 0) {
			await fileCommand.guilds.forEach(async (fileCommandGuild) => {
				let applicationGuildCommand = await commands.application.guilds.find(appGuildObj => appGuildObj.id == fileCommandGuild);

                if (!applicationGuildCommand) {
                    if (await guilds.get(fileCommandGuild)) {
                        let data = await interaction.createApplicationCommand(fileCommand, fileCommandGuild);
                        console.log(`Added Guild Command: ${await data.name} (${await data.id}) <${fileCommandGuild}>`);
                    } 
                    else {
                        console.error(`[INVALID] Invalid Guild id: ${fileCommand.name} <${fileCommandGuild})>`);
                    }
                } 
                else {
                    let data = await interaction.editApplicationCommand(applicationGuildCommand.application_id, fileCommand, fileCommandGuild);
                    console.log(`Loaded Guild Command: ${await data.name} (${await data.id}) <${fileCommandGuild}>`);
                }
			});
		} else {
            let applicationGlobalCommand = await commands.application.global.find(appGlobalObj => appGlobalObj.name == fileCommand.name);

            if (!await applicationGlobalCommand) {
                let data = await interaction.createApplicationCommand(fileCommand);
                console.log(`Added Global Command: ${await data.name} (${await data.id})`);
            }
            else {
                let data = await interaction.editApplicationCommand(applicationGlobalCommand.id, fileCommand);
                console.log(`Loaded Global Command: ${await data.name} (${await data.id})`);
            }
		}
	});
};

const deleteAllApplicationCommands = module.exports.deleteAllCommands = async (commands, interaction) => {
    await commands.application.global.forEach(async globalCommand => {
        let isDeleted = await interaction.deleteApplicationCommand(globalCommand.id);
        console.log(`Deleted ${globalCommand.name} command: ${await isDeleted}`);
    })

    await commands.application.guilds.forEach(async guild => {
        await guild.commands.forEach(async guildCommand => {
            let isDeleted = await interaction.deleteApplicationCommand(guildCommand.id, guild.id);
            console.log(`Deleted ${guildCommand.name} command from <${guild.id}>: ${await isDeleted}`);
        })
    })
}