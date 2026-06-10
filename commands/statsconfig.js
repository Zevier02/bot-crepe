const Discord = require("discord.js");
const fs = require('fs');
const path = require('path');
const subcommands = [];

// Charger dynamiquement tous les fichiers de sous-commandes
const files = fs.readdirSync(path.join(__dirname, "statsconfig"));
for (const file of files) {
    const sub = require(path.join(__dirname, "statsconfig", file));
    if (sub.data && sub.execute) subcommands.push(sub);
}

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName("statsconfig"),
    async execute(interaction){
        if(!interaction.isCommand()) return;

        if(!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)){
            const embed = new Discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("Pseudos")
                .setDescription(`Tu n'as pas les permissions d'utiliser cette commande.`)
                .setTimestamp()
                .setFooter({text : `/statsconfig ${interaction.options.getSubcommand()} | Utilisé par : ${interaction.user.tag}`});
            return interaction.editReply({ embeds: [embed] })
        }

		const subcommandName = interaction.options.getSubcommand();
        const subcommand = subcommands.find(s => s.data.name === subcommandName);

        // Exécuter la sous-commande
        await subcommand.execute(interaction);
	}
}