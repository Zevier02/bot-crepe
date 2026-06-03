const Discord = require("discord.js");
const fs = require("fs");
const Stats = require("../../statsHandler");
const Time = require("../../timeHandler");
const StatsCanvas = require("../../canvasHandler");

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName("utilisateur"),
    /**
     * @param {Discord.Interaction} interaction 
     */
    async execute(interaction){
        const optUser = interaction.options.get("utilisateur")? 
            interaction.options.get("utilisateur").user :
            interaction.user;

        await Stats.createUserIfNotExists(optUser);
        const userData = await Stats.getUser(optUser);

        const canvasBuffer = await StatsCanvas.createUserStats(optUser, userData);

        const attachment = new Discord.AttachmentBuilder(canvasBuffer, { name: 'userStats.png' });

        interaction.editReply({files: [attachment]});
    }
}