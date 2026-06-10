const Discord = require("discord.js");
const fs = require("fs");
const Stats = require("../../statsHandler");
const Time = require("../../timeHandler");
const StatsCanvas = require("../../canvasHandler");

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName("serveur"),
    /**
     * @param {Discord.Interaction} interaction 
     */
    async execute(interaction){
        const canvasBuffer = await StatsCanvas.createServerStats();

        const attachment = new Discord.AttachmentBuilder(canvasBuffer, { name: 'globalStats.png' });

        interaction.editReply({files: [attachment]});
    }
}