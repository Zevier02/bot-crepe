const Config = require("../config.json");
const Discord = require(Config.ddiscordjs);

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
                { name: "Contenu", value: message.content?.slice(0, 1024) || "*Aucun texte (probablement un média)*" }
            )
            .setTimestamp();

        // S'il y a des pièces jointes
        const files = [];
        if (message.attachments.size > 0) {
            message.attachments.forEach(attachment => {
                // Ajoute le lien du fichier dans l'embed
                embed.addFields({ name: "Fichier", value: `[${attachment.name}](${attachment.url})` });
                files.push(attachment.url); // facultatif : tu peux aussi attacher directement les fichiers
            });
        }

        logChannel.send({ embeds: [embed] });
    }
};