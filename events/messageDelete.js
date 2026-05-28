const Config = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "messageDelete",
    once: false,
    async execute(message) {
        // Ignore si le message est d'un bot ou si c'est un DM
        if (!message.guild || message.author.bot) return;

        const logChannel = await message.guild.channels.fetch("1371151736559108296").catch(() => null);
        if (!logChannel || !logChannel.isTextBased() || message.channel.id == Config.renamechannel) return;

        const embed = new Discord.EmbedBuilder()
            .setColor("Yellow")
            .setTitle("🗑️ Message supprimé")
            .addFields(
                { name: "Auteur", value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
                { name: "Salon", value: `<#${message.channel.id}>`, inline: true },
            )
            .setTimestamp();

        const attachments = [];

        if(message.content.length > 1024){
            const buffer = Buffer.from(message.content, "utf-8");

            const fileAttachment = new Discord.AttachmentBuilder(buffer, {
                name: "message.txt"
            });

            attachments.push(fileAttachment)

            embed.addFields({ name: "Contenu", value: "*Contenu en pièce-jointe message.txt .*" });
        }
        else {
            embed.addFields({ name: "Contenu", value: message.content || "*Aucun contenu (probablement un média).*" });
        }

        // S'il y a des pièces jointes
        const files = [];

        // S'il y a des pièces jointes
        if (message.attachments.size > 0) {
            message.attachments.forEach(attachment => {
                // Ajoute le lien du fichier dans l'embed
                embed.addFields({ name: "Fichier", value: `[${attachment.name}](${attachment.url})` });
                files.push(attachment.url); // facultatif : tu peux aussi attacher directement les fichiers
            });
        }

        logChannel.send({ embeds: [embed], files: attachments });
    }
};