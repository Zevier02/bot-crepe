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
        const channel = interaction.options.get("salon")? 
            interaction.options.get("salon").channel :
            interaction.channel;


        const desactivate = interaction.options.get("desactiver").value == "true"? true : false;

        await Stats.createChannelIfNotExists(channel);
        const channelData = await Stats.getChannel(channel);

        if(channelData.boost === 1 && !desactivate){
            const embed = new Discord.EmbedBuilder()
                .setColor("Yellow")
                .setDescription(`Le salon <#${channelData.id}> est déjà activé.`)
            return interaction.editReply({ embeds: [embed] });
        }
        else if(channelData.boost == 0 && desactivate) {
            const embed = new Discord.EmbedBuilder()
                .setColor("Yellow")
                .setDescription(`Le salon <#${channelData.id}> est déjà désactivé.`)
            return interaction.editReply({ embeds: [embed] });
        }

        const success = await Stats.updateChannel(channel, {boost: desactivate? 0 : 1});

        if(!success){
            const embed = new Discord.EmbedBuilder()
                .setColor("Red")
                .setDescription(`Une erreur est survenue et le salon <#${channelData.id}> n'a pas pu être ${desactivate? "désactivé":"activé"}.`)
            return interaction.editReply({ embeds: [embed] });
        }

        if(desactivate){
            const embed = new Discord.EmbedBuilder()
                .setColor("Yellow")
                .setDescription(`Le salon <#${channelData.id}> a été désactivé.`)
            return interaction.editReply({ embeds: [embed] });
        }
        else {
            const embed = new Discord.EmbedBuilder()
                .setColor("Yellow")
                .setDescription(`Le salon <#${channelData.id}> a été activé.`)
            return interaction.editReply({ embeds: [embed] });
        }
    }
}