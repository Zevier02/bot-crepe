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
                { name: "Lien", value: `[Aller au message](https://discord.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.id})` }
            )
            .setTimestamp();

        const files = [];

        if(oldMessage.content.length > 1024){
            const buffer = Buffer.from(oldMessage.content, "utf-8");

            const fileAttachment = new Discord.AttachmentBuilder(buffer, {
                name: "old_message.txt"
            });

            files.push(fileAttachment);

            embed.addFields({ name: "Avant", value: "*Voir la pièce-jointe old_message.txt .*" });
        }
        else {
            embed.addFields({ name: "Avant", value: sanitize(oldMessage.content || "*Voir la pièce-jointe new_message.txt .*") });
        }

        if(newMessage.content.length > 1024){
            const buffer = Buffer.from(newMessage.content, "utf-8");

            const fileAttachment = new Discord.AttachmentBuilder(buffer, {
                name: "new_message.txt"
            });

            files.push(fileAttachment);

            embed.addFields({ name: "Après", value: "*Voir la pièce-jointe new_message.txt .*" });
        }
        else {
            embed.addFields({ name: "Après", value: sanitize(newMessage.content || "*Vide*") });
        }

        logChannel.send({ embeds: [embed], files });
    }
};