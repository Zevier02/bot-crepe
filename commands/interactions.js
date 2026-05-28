const fs = require("fs");
const Discord = require("discord.js");

module.exports = {
    data: new Discord.StringSelectMenuBuilder()
        .setCustomId('get'),
    async execute(interaction){
        if(interaction.customId.startsWith("get")){
            const text = interaction.customId.slice(3, interaction.customId.length)
            const messageURL = `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.message.id}`;
            const embed = new Discord.EmbedBuilder()
                .setColor("Green")
                .setDescription(`<@${interaction.user.id}> vient de gagner le [drop](${messageURL}), il a gagné **${text}** !\n-# Contacte un membre du staff si ta récompense n'a pas encore été donnée.`)
                .setAuthor({name: `${interaction.member.displayName} gagne le drop !`, iconURL: interaction.member.user.displayAvatarURL()})
            const originalEmbed = interaction.message.embeds[0];
            const updatedEmbed = Discord.EmbedBuilder.from(originalEmbed).setColor("Green");
            await interaction.message.edit({embeds: [updatedEmbed],components: []});
            interaction.editReply({ embeds: [embed] })
        }
    }
}