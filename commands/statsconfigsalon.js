const fs = require("fs");
const Discord = require("discord.js");

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName("statsconfigsalon"),

    /**
     * @param {Discord.Interaction} interaction 
     */
    async execute(interaction){
        if(!interaction.isCommand) return;

        if(!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)){
            const embed = new Discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("Statsconfigsalon")
                .setDescription(`Tu n'as pas les permissions d'utiliser cette commande.`)
                .setTimestamp()
                .setFooter({text : `Utilisé par : ${interaction.user.tag}`});
            return interaction.editReply({ embeds: [embed] })
        }


        const configChannel = interaction.options.get("salon").value;
        const boost = interaction.options.get("boost")? Number(interaction.options.get("boost").value) : null;
    }
}