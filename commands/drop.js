const Config = require("../config.json")
const fs = require("fs")
const Discord = require(Config.ddiscordjs);

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName("customdrop"),
    async execute(interaction){
        if(interaction.isCommand){
            const drop = interaction.options.get("truc").value
            const embed = new Discord.EmbedBuilder()
                .setColor("Yellow")
                .setTitle("Soyez le premier à réagir pour gagner le drop !")
                .setDescription(`Gagnez **${drop}** en cliquant sur le bouton ci-dessous !`)
            const get = new Discord.ButtonBuilder()
                .setCustomId('get' + drop)
                .setLabel('Récupérer !')
                .setStyle(Discord.ButtonStyle.Secondary);
            const row = new Discord.ActionRowBuilder()
                .addComponents(get);
            interaction.channel.send({ embeds: [embed], components: [row]})
            const embed2 = new Discord.EmbedBuilder()
                .setColor("Yellow")
                .setDescription(`✅Le drop customisé a bien été lancé dans le salon <#${interaction.channel.id}> !`)
            interaction.editReply({ embeds: [embed2] })
        }
    }
}