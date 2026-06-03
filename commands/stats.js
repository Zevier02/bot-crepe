const Discord = require("discord.js");
const fs = require('fs');
const path = require('path');
const subcommands = [];

// Charger dynamiquement tous les fichiers de sous-commandes
const files = fs.readdirSync(__dirname + "\/stats");
for (const file of files) {
    const sub = require(path.join(__dirname + "\/stats", file));
    if (sub.data && sub.execute) subcommands.push(sub);
}

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName("stats"),
    async execute(interaction){
        if(!interaction.isCommand()) return;

		const subcommandName = interaction.options.getSubcommand();
        const subcommand = subcommands.find(s => s.data.name === subcommandName);

        // Exécuter la sous-commande
        await subcommand.execute(interaction);
	}
}