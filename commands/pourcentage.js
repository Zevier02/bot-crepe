const fs = require("fs");
const Discord = require("discord.js");

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName("pourcentage"),
    async execute(interaction){
        if(interaction.isCommand){
            const channel = interaction.options.getChannel("salon") || interaction.channel;
            const user = interaction.options.getUser("utilisateur") || interaction.user;
            const top = interaction.options.get("top")? interaction.options.get("top").value == "true" : false;
			let number = interaction.options.getInteger("nombre") || 10;
            if (number < 1) number = 1;
			if (number > 25) number = 25;
            
            let lastId;
            let total = 0;
            let scores = {};

            while (true) {
                const fetched = await channel.messages.fetch({
                    limit: 100,
                    before: lastId,
                });

                if (fetched.size === 0) break;

                fetched.forEach(msg => {
                    if(msg.author && !msg.author.bot){
                        if(!scores[msg.author.id]){
                            scores[msg.author.id] = 1;
                        } else {
                            scores[msg.author.id]++;
                        }
                        total++;
                    }
                });

                lastId = fetched.last().id;
            }
            
            if(top){
                const entries = Object.entries(scores);
                entries.sort((a, b) => b[1] - a[1]);
                const leaders = entries.slice(0, number);
                let fields = []

                leaders.forEach(([userid, score], index) => {
                    const pourcentage = Math.round((score / total) * 1000) / 10;
                    fields.push({name: `#${index + 1}`, value: `<@${userid}> : **${pourcentage}%** (${score}/${total})`})
                });
				const embed = new Discord.EmbedBuilder()
                	.setColor("Yellow")
                	.setTitle(`Classement des ${leaders.length} utilisateurs ayant envoyé le plus de messages dans le salon <#${channel.id}>`)
                	.setFields(fields)
                interaction.editReply({ embeds: [embed] });
            }
            else {
                if(scores[user.id]){
                    const pourcentage = Math.round((scores[user.id] / total) * 1000) / 10;
                    const embed = new Discord.EmbedBuilder()
                    	.setColor("Yellow")
                    	.setDescription("Pourcentage de messages envoyés par <@" + user.id + "> dans le salon <#" + channel.id + "> : **" + pourcentage + "%**." + ` (${scores[user.id]}/${total})`)
                    interaction.editReply({ embeds: [embed] });
                }
                else {
                    interaction.editReply("Aucun message n'a été envoyé par **" + user.tag + "** dans le salon <#" + channel.id + ">.");
                }
            }
        }
    }
}