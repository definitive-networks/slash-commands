const fs = require('fs');
const path = require('path');

const isFile = fileName => { return fs.lstatSync(fileName).isFile() };
const isFolder = folderName => { return fs.lstatSync(folderName).isDirectory() };

class Client {
  constructor(client, config) {
    this.client = client;
    this.config = config;
  }

  async commands(subcategory = false) {
    const dir = path.join(__dirname, '../../../', this.config.commands.directory);
    const files = fs.readdirSync(dir).map(file => { return path.join(dir, file) }).filter(isFile);
    const folders = fs.readdirSync(dir).map(folder => { return path.join(dir, folder) }).filter(isFolder);

    let commands = new Map();

    for (var i = 0; i < files.length; i++) {
      if (!subcategory) {
        if (files[i].endsWith('index.js') || !files[i].endsWith('js')) return;
        let command = require(files[i]);
        commands.set(command.name, command);
      }
    }
    for (var i = 0; i < folders.length; i++) {
      if (!subcategory || (subcategory && folders[i].includes(subcategory))) {
        const subfiles = fs.readdirSync(folders[i]).map(file => { return path.join(folders[i], file) }).filter(isFile);
        for (var x = 0; x < subfiles.length; x++) {
          if (subfiles[x].endsWith('index.js') || !subfiles[x].endsWith('js')) return;
          let command = require(subfiles[x]);
          commands.set(command.name, command);
        }
      }
    }
    return commands;
  };

  async findCommand(command_name) {
    const dir = path.join(__dirname, '../../../', this.config.commands.directory);
    const files = fs.readdirSync(dir).map(file => { return path.join(dir, file) }).filter(isFile);
    const folders = fs.readdirSync(dir).map(folder => { return path.join(dir, folder) }).filter(isFolder);

    let results = [];

    for (var i = 0; i < files.length; i++) {
      if (files[i].endsWith('index.js') || !files[i].endsWith('js')) return;
      let command = require(files[i]);
      let expressionCheck = await command.expressionCheck(command_name);
      if (expressionCheck.pass) results.push(command);
    }
    for (var i = 0; i < folders.length; i++) {
      const subfiles = fs.readdirSync(folders[i]).map(file => { return path.join(folders[i], file) }).filter(isFile);
      for (var x = 0; x < subfiles.length; x++) {
        if (subfiles[x].endsWith('index.js') || !subfiles[x].endsWith('js')) return;
        let command = require(subfiles[x]);
        let expressionCheck = await command.expressionCheck(command_name);
        if (expressionCheck.pass) results.push(command);
      }
    }
    return results[0];
  }

  async matchCommand(interaction){
    const command = await this.findCommand(interaction.request.data.name);
    const securityCheck = await command.securityCheck(interaction);
    switch (securityCheck.pass) {
      case true:
        command.execute(interaction);
        return {...command, securityCheck: "pass"};
        break;
      case false:
        const user = await interaction.author();
        const missingPermissions = (this.permissions || ['SEND_MESSAGES']).filter(p => !user.hasPermission(p));
        interaction.responseType = 3;
        interaction.sendEphemeral(`You are missing permissions to run this command: \`${permissionCheck.missingPermissions.join(' | ').replace(/_/g, ' ')}\``);
        return {...command, securityCheck: "pass"};
    }
  }

  async postCommands() {
    const client = this.client;
    let commands = await this.commands();
    for (let command of commands) {
      command[1].post(client);
    }
    const globalCommands = await client.api.applications(client.user.id).commands.get();
    for (let command of globalCommands){
      const match = await this.findCommand(command.name);
      if (match === undefined) {
        client.api.applications(client.user.id).commands(command.id).delete()
        .catch(console.error)
      };
    }
    const guilds = await client.guilds.cache;
    for (let guild of guilds) {
      const guildCommands = await client.api.applications(client.user.id).guilds(guild[1].id).commands.get().catch(err => {});
      if (guildCommands != undefined) {
        for (let command of guildCommands){
          const match = await this.findCommand(command.name);
          if (match === undefined) {
            client.api.applications(client.user.id).guilds(guild[1].id).commands(command.id).delete().catch(console.error)
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
