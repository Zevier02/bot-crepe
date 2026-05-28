const Config = require("../config.json");
const fs = require("fs");
const Discord = require("discord.js");
class Commands {
    constructor(){
        this.list = new Discord.Collection();
        const commandFiles = fs.readdirSync(Config.commands).filter(file => file.endsWith(".js"));

        for(const file of commandFiles){
            const command = require("../commands/" + file);

            this.list.set(command.data.name, command);
        }
    }
}

module.exports = {
    name: "interactionCreate",
    once: false,
    commands: new Commands(),
    async execute(interaction){
        const command = this.commands.list.get(interaction.commandName)
        if(Config.ephemeral[interaction.commandName] == undefined){
            await interaction.deferReply();
        }
        else if(Config.ephemeral[interaction.commandName]){
            await interaction.deferReply({ flags: Discord.MessageFlags.Ephemeral });
        }
        else {
            await interaction.deferReply();
        }

        if(!command) return;

        try {
            command.execute(interaction);
        } catch(error){
            console.error(error)
            interaction.editReply({ content: "Une erreur est survenue." })
        }
    }
}