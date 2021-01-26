const fs = require('fs');
const path = require('path');

class Client {
  constructor(client, config) {
    this.client = client;
    this.config = config;
  }

  async commands() {
    const dir = path.join(__dirname, '../../../', this.config.commands.directory);
    const folder = fs.readdirSync(dir);
    const subcategories = this.config.commands.subcategories;
    let commands = new Map();
    switch (subcategories) {

      case "true":
        for (let subfolderRef of folder) {
          const subfolder = fs.readdirSync(`${dir}/${subfolderRef}`);
          for (let file of subfolder) {
            if (file === "index.js") return;
            let command = require.main.require(`${dir}/${folder}/${file}`);
            commands.set(command.name, command);
          }
        }
        return commands;
        break;

      case "false":
        for (let file of folder) {
          let command = require.main.require(`${dir}/${file}`);
          commands.set(command.name, command);
        }
        return commands;
    }
  };
  
  async findCommand(command_name) {
    const dir = path.join(__dirname, '../../../', this.config.commands.directory);
    const folder = fs.readdirSync(dir);
    const subcategories = this.config.commands.subcategories;
    let map = new Array();
    switch (subcategories) {

      case "true":
        for(let subfolderRef of folder) {
          const subfolder = fs.readdirSync(`${dir}/${subfolderRef}`);
          for (let file of subfolder) {
            if (file === "index.js") return;
            let command = require.main.require(`${dir}/${subfolderRef}/${file}`);
            let expressionCheck = await command.expressionCheck(command_name);
            if (expressionCheck.pass){
              map.push(command)
            }
          }
        }
        break;

      case "false":
        for (let file of folder) {
          if (file === "index.js") return;
          let command = require.main.require(`${dir}/${file}`);
          let expressionCheck = await command.expressionCheck(command_name);
          if (expressionCheck.pass){
            map.push(command)
          }
        }
    }
    return map[0];
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
    let commands = await this.commands();
    for (let command of commands) {
      command[1].post(this.client)
    }
    return commands;
  }
  
  async deleteCommands(guild_ids = false, del_global = false) {
    let deletedCommands = new Array();
    if (guild_ids) {
      let postedGuildCommands = new Array();
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
