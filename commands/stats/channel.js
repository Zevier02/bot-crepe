const Discord = require("discord.js");
const fs = require("fs");
const Stats = require("../../statsHandler");
const Time = require("../../timeHandler");
const StatsCanvas = require("../../canvasHandler");

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName("salon"),
    /**
     * @param {Discord.Interaction} interaction 
     */
    async execute(interaction){
        const optChannel = interaction.options.get("salon")? 
            interaction.options.get("salon").channel :
            interaction.channel;

        await Stats.createChannelIfNotExists(optChannel);
        const channelData = await Stats.getChannel(optChannel);

        const canvasBuffer = await StatsCanvas.createChannelStats(optChannel, channelData);

        const attachment = new Discord.AttachmentBuilder(canvasBuffer, { name: 'channelStats.png' });

        interaction.editReply({files: [attachment]});
    }
}