const Config = require("../config.json");
const Discord = require(Config.ddiscordjs);

module.exports = {
    name: "messageUpdate",
    once: false,
    async execute(oldMessage, newMessage) {
        if (!oldMessage.guild || oldMessage.author.bot || oldMessage.content === newMessage.content) return;

        const logChannel = oldMessage.guild.channels.cache.get("1371151736559108296");
        if (!logChannel || !logChannel.isTextBased()) return;
        if (!logChannel.permissionsFor(oldMessage.guild.members.me).has("SendMessages")) return;

        const sanitize = (str) => str.replace(/`/g, "'").replace(/@/g, '@\u200b');

        const embed = new Discord.EmbedBuilder()
            .setColor("Yellow")
            .setTitle("✏️ Message modifié")
            .addFields(
                { name: "Auteur", value: `${oldMessage.author.tag} (<@${oldMessage.author.id}>)`, inline: true },
                { name: "Salon", value: `<#${oldMessage.channel.id}>`, inline: true },
                { name: "Avant", value: sanitize(oldMessage.content?.slice(0, 1024) || "*Vide*") },
                { name: "Après", value: sanitize(newMessage.content?.slice(0, 1024) || "*Vide*") },
                { name: "Lien", value: `[Aller au message](https://discord.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.id})` }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    }
};