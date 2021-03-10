const fs = require('fs');
const path = require('path');
const GlobalCommand = require('./global-command');
const GuildCommand = require('./guild-command');

const isFile = fileName => { return fs.lstatSync(fileName).isFile() };
const isFolder = folderName => { return fs.lstatSync(folderName).isDirectory() };

class Client {
  constructor(client, config) {
    this.client = client;
    this.config = config;
  }

  async getCommands(category = false) {
    const dir = path.join(path.resolve(), this.config.commands.directory);
    const files = fs.readdirSync(dir).map(file => { return path.join(dir, file) }).filter(isFile);
    const folders = fs.readdirSync(dir).map(folder => { return path.join(dir, folder) }).filter(isFolder);

    let commands = new Map();

    for (var i = 0; i < files.length; i++) {
      if (!category || (category && category == 'base')) {
        if (files[i].endsWith('index.js') || !files[i].endsWith('js')) return;
        let command = require(files[i]);
        let commandObj = !command.guilds || command.guilds == [] ? new GlobalCommand(command) : new GuildCommand(command);
        commands.set(command.name, { category: 'base', commandObj });
      }
    }
    for (var i = 0; i < folders.length; i++) {
      if (!category || (category && folders[i].includes(category))) {
        const subfiles = fs.readdirSync(folders[i]).map(file => { return path.join(folders[i], file) }).filter(isFile);
        for (var x = 0; x < subfiles.length; x++) {
          if (subfiles[x].endsWith('index.js') || !subfiles[x].endsWith('js')) return;
          let command = require(subfiles[x]);
          let commandObj = !command.guilds || command.guilds == [] ? new GlobalCommand(command) : new GuildCommand(command);
          commands.set(command.name, { category: path.basename(folders[i]), commandObj });
        }
      }
    }
    return commands;
  };

  async categories() {
    const commands = await this.getCommands();
    const categories = [];
    for (let command of commands) {
      categories.push(command[1].category);
    }
    return [...new Set(categories)];
  }

  async findCommand(command_name) {
    const commands = await this.getCommands();
    const command = await commands.get(command_name);
    
    return command;
  }

  async matchCommand(interaction){
    const command = await this.findCommand(interaction.request.data.name);
    const securityCheck = await command.commandObj.securityCheck(interaction);
    switch (securityCheck.pass) {
      case true:
        command.commandObj.execute(interaction);
        return {...command, securityCheck: "pass"};
      case false:
        interaction.responseType = 3;
        interaction.sendEphemeral(`You are missing permissions to run this command: \`${permissionCheck.missingPermissions.join(' | ').replace(/_/g, ' ')}\``);
        return {...command, securityCheck: "pass"};
    }
  }

  async postCommands() {
    const client = this.client;
    let commands = await this.getCommands();
    for (let command of commands) {
      command[1].commandObj.post(client);
    }
    const globalCommands = await client.api.applications(client.user.id).commands.get();
    for (let command of globalCommands){
      const match = await this.findCommand(command.name);
      if (match === undefined) {
        client.api.applications(client.user.id).commands(command.id).delete();
      };
    }
    const guilds = await client.guilds.cache;
    for (let guild of guilds) {
      const guildCommands = await client.api.applications(client.user.id).guilds(guild[1].id).commands.get().catch(err => {});
      if (guildCommands != undefined) {
        for (let command of guildCommands){
          const match = await this.findCommand(command.name);
          if (match === undefined) {
            client.api.applications(client.user.id).guilds(guild[1].id).commands(command.id).delete();
          };
        }
      };
    }
    return commands;
  }

  async deleteCommands(guild_ids = false, del_global = false) {
    let deletedCommands = [];
    if (guild_ids) {
      let postedGuildCommands = [];
      for (let guild_id of guild_ids) {
        const guildCommands = await this.client.api.applications(this.client.user.id).guilds(guild_id).commands.get();
        for (let i = 0; i < guildCommands.length; i++) {
          this.client.api.applications(this.client.user.id).guilds(guild_id).commands(guildCommands[i].id).delete();
        }
        postedGuildCommands.push({ guild: guild_id, commands: guildCommands });
      }
      deletedCommands.push({ guilds: postedGuildCommands });
    }
    if (del_global) {
      const postedGlobalCommands = await this.client.api.applications(this.client.user.id).commands.get();
      for (let i = 0; i < postedGlobalCommands.length; i++) {
        this.client.api.applications(this.client.user.id).commands(postedGlobalCommands[i].id).delete();
      }
      deletedCommands.push({ global: postedGlobalCommands });
    }
    return deletedCommands;
  }
}

module.exports = Client;
