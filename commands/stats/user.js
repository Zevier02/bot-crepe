const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName("utilisateur"),
    async execute(interaction){
        const optUser = interaction.options.get("utilisateur")? 
            interaction.options.get("utilisateur").user :
            interaction.user;

        const embed = new Discord.EmbedBuilder()
            .setColor("Yellow")
        //    .setAuthor({name: , iconURL: })
    }
}