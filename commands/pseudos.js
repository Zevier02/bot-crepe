const Config = require("../config.json")
const fs = require("fs")
const Discord = require(Config.ddiscordjs);

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName("pseudos"),
    async execute(interaction){
        if(interaction.isCommand){
            var members
            var users
            try {
                await interaction.guild.members.fetch(); // Assure-toi d'avoir tous les membres en cache
                members = interaction.guild.members.cache.map(member => {
                    const pseudo = member.nickname || member.user.username;
                    return pseudo
                    .normalize("NFKD") // Décompose les caractères accentués en leur forme de base
                    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents combinés (é → e, ñ → n)
                    .replace(/[³3€]/g, 'e') // Remplace 3, € par "e"
                    .replace(/[«»“”„‟]/g, '"') // Remplace guillemets doubles par "
                    .replace(/[‘’‚‛]/g, "'") // Remplace guillemets simples par '
                    .replace(/[^a-zA-Z0-9\s"']/g, '') // Supprime les caractères spéciaux sauf lettres, chiffres, espaces et guillemets
                    .replace(/\s+/g, ' ') // Remplace les espaces multiples par un seul espace
                    .trim() // Supprime les espaces en début et fin de texte
                    .toLowerCase() ; // Passe tous les caractères en minuscule
                });
                users = interaction.guild.members.cache.map(member => {
                    return member
                });

            } catch (error) {
                console.error(error);
            }
            var i = 0
            var pseudos = []
            var criminels = []
            while(members[i] != undefined){
                if((pseudos.indexOf(members[i]) != -1) && members[i] != "crepe sans nom"){
                    criminels.push({user: users[i], nickname: members[i]})
                    if(criminels.some(criminel => criminel.user == users[pseudos.indexOf(members[i])]) == false){
                        criminels.push({user: users[pseudos.indexOf(members[i])], nickname: members[pseudos.indexOf(members[i])]})
                    }
                }
                pseudos.push(members[i])
                i++
            }
            i = 0
            var erreurs = []
            var noms = {}
            while(criminels[i] != undefined){
                if(noms[criminels[i].nickname] == undefined){
                    noms[criminels[i].nickname] = {users: []}
                }
                noms[criminels[i].nickname]["users"].push(criminels[i].user)
                if(interaction.options.get("modifier").value == "true"){
                    try {
                        criminels[i].user.setNickname("Crêpe sans nom")
                    } catch (err){
                        erreurs.push(criminels[i])
                    }
                }
                i++
            }
            i = 0
            var text = ""
            while(Object.keys(noms)[i] != undefined){
                text = text + "**" + Object.keys(noms)[i] + "**, " + noms[Object.keys(noms)[i]].users.length + " utilisateurs :\n"
                f = 0
                while(noms[Object.keys(noms)[i]].users[f] != undefined){
                    text = text + "- " + noms[Object.keys(noms)[i]].users[f].user.displayName + ` (${noms[Object.keys(noms)[i]].users[f].user.username}, <@${noms[Object.keys(noms)[i]].users[f].id}>)\n`
                    f++
                }
                text = text + "\n"
                i++
            }
            var texte = "Impossible de renommer :\n"
            i = 0
            while(erreurs[i] != undefined){
                texte = texte + "- " + erreurs[i].user.user.displayName + ` (${erreurs[i].nickname}, <@${erreurs[i].user.user.id}>)`
                i++
            }
            if(Object.keys(noms).length != 0){
                if(erreurs == 0){
                    const embed = new Discord.EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle("Pseudos")
                        .setDescription(`**${Object.keys(noms).length}** pseudo${Object.keys(noms).length > 1? "s":""} identique${Object.keys(noms).length > 1? "s":""} ${Object.keys(noms).length > 1? "ont":"a"} été détécté${Object.keys(noms).length > 1? "s":""} (**${criminels.length}** utilisateurs).`)
                        .setFields({name: "Rapport", value: `${text}`})
                        .setTimestamp()
                        .setFooter({text : `Modifier les pseudos : ${interaction.options.get("modifier").value == "true"? "Oui" : "Non"}`})
                    interaction.editReply({ embeds: [embed] })
                }
                else {
                    const embed = new Discord.EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle("Pseudos")
                        .setDescription(`**${Object.keys(noms).length}** pseudo${Object.keys(noms).length > 1? "s":""} identique${Object.keys(noms).length > 1? "s":""} ${Object.keys(noms).length > 1? "ont":"a"} été détécté${Object.keys(noms).length > 1? "s":""} (**${criminels.length}** utilisateurs).`)
                        .setFields({name: "Rapport", value: `${text}`}, {name: "Erreurs", value: texte})
                        .setTimestamp()
                        .setFooter({text : `Modifier les pseudos : ${interaction.options.get("modifier").value == "true"? "Oui" : "Non"}`})
                    interaction.editReply({ embeds: [embed] })
                }
                
            }
            else {
                const embed = new Discord.EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle("Pseudos")
                    .setDescription(`Aucun pseudos identiques trouvés.`)
                    .setTimestamp()
                    .setFooter({text : `Modifier les pseudos : ${interaction.options.get("modifier").value == "true"? "Oui" : "Non"}`})
                interaction.editReply({ embeds: [embed] })
            }
        }
    }
}