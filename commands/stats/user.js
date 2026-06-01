const Discord = require("discord.js");
const fs = require("fs");
const Stats = require("../../statsHandler");
const Time = require("../../timeHandler");

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

        const messageChannelsText =
            "- " +
            Object.entries(userData.messageChannels)
                .map(([id, value]) => `<#${id}> : ${value.toString()}`)
                .join("\n- ");

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const Count = Time.getMessageCountFromTo(userData, yesterday);

        const embed = new Discord.EmbedBuilder()
            .setColor("Yellow")
            .setAuthor({name: userData.username, iconURL: userData.avatarURL})
            .setDescription("Nombre total de messages envoyés : " + userData.messageCount.toString())
            .setFields(
                {name: "Messages envoyés par salon", value: `${messageChannelsText}`},
                {name: "Messages envoyés depuis les 24 dernières heures", value: Count.toString()}
            )
        interaction.editReply({ embeds: [embed] });
    }
}