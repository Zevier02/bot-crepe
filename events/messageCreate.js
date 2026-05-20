const Config = require("../config.json");
const Discord = require(Config.ddiscordjs);

function normalizePseudo(str) {
    return str
        .normalize("NFKD") // Décompose les caractères accentués en leur forme de base
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents combinés (é → e, ñ → n)
        .replace(/[³3€]/g, 'e') // Remplace 3, € par "e"
        .replace(/[«»“”„‟]/g, '"') // Remplace guillemets doubles par "
        .replace(/[‘’‚‛]/g, "'") // Remplace guillemets simples par '
        .replace(/[^a-zA-Z0-9\s"']/g, '') // Supprime les caractères spéciaux sauf lettres, chiffres, espaces et guillemets
        .replace(/\s+/g, ' ') // Remplace les espaces multiples par un seul espace
        .trim() // Supprime les espaces en début et fin de texte
        .toLowerCase() ; // Passe tous les caractères en minuscule
}

module.exports = {
    name: "messageCreate",
    once: false,
    async execute(message) {
        if(message.channel.id == Config.renamechannel){
            message.delete()
            if (message.author.bot) return;
            if(message.member.roles.cache.has("1381407385230245978")){
                const embed = new Discord.EmbedBuilder()
                    .setColor("Red")
                    .setDescription("Tu ne peux pas te renommer, tu possède le rôle <@&1381407385230245978>.")
                message.member.send({ embeds: [embed] })
            }
            else {
                let pseudo = message.content
                    .replace(/https?:\/\/\S+/gi, "")
                    .replace(/<a?:\w+:\d+>/g, "")
                    .replace(/<@!?[0-9]+>/g, "")
                    .replace(/<@&[0-9]+>/g, "")
                    .replace(/<#[0-9]+>/g, "")
                    .replace(/<[^>]*>/g, "")
                    .replace(/\s+/g, " ")
                    .trim();
                if(pseudo == "") pseudo = "Crêpe sans nom";
                if (pseudo !== "Crêpe sans nom") {
                    const targetPseudo = normalizePseudo(pseudo);
					await message.guild.members.fetch();
                    const alreadyTaken = message.guild.members.cache.some(member => {
                        if (member.user.bot) return false;
                        if (member.id === message.member.id) return false; // ⛔ ignorer soi-même
                        const memberPseudo = normalizePseudo(member.displayName || member.user.username);
                        return memberPseudo === targetPseudo;
                    });

                    if (alreadyTaken) {
                        const embed = new Discord.EmbedBuilder()
                            .setColor("Yellow")
                            .setDescription("Ce pseudo est déjà utilisé par une autre crêpe 🥞, essaye-en un autre !");
                        return message.member.send({ embeds: [embed] }).catch(() => {});
                    }
                }
                try {
                    const oldpseudo = message.member.displayName || message.member.user.username;
                    
                    await message.member.setNickname(pseudo);
                    const embed = new Discord.EmbedBuilder()
                        .setColor("Green")
                        .setDescription("Tu as bien été renommé en ``" + pseudo + "``.");
                    await message.member.send({ embeds: [embed] });
                    
                    const logChannel = await message.guild.channels.fetch("1371151736559108296").catch(() => null);
                    if (!logChannel || !logChannel.isTextBased()) return;

                    const logEmbed = new Discord.EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle("📝 Membre renommé")
                        .addFields(
                            { name: "Membre", value: `${message.author.tag} (<@${message.author.id}>)` },
                            { name: "Ancien pseudo", value: oldpseudo },
                            { name: "Nouveau pseudo", value: pseudo }
                        )
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] });
                } catch (error) {
                    const embed = new Discord.EmbedBuilder()
                        .setColor("Red")
                        .setDescription("Je n'ai pas les permissions de te renommer (tu as un rôle au-dessus de moi).");
                    await message.member.send({ embeds: [embed] });
                }
            }
        }
		const msg = message.content.normalize("NFKD") // Décompose les caractères accentués en leur forme de base
			.replace(/[\u0300-\u036f]/g, '') // Supprime les accents combinés (é → e, ñ → n)
			.replace(/[³3€]/g, 'e') // Remplace 3, € par "e"
			.replace(/[«»“”„‟]/g, '"') // Remplace guillemets doubles par "
			.replace(/[‘’‚‛]/g, "'") // Remplace guillemets simples par '
			.replace(/[^a-zA-Z0-9\s"']/g, '') // Supprime les caractères spéciaux sauf lettres, chiffres, espaces et guillemets
			.replace(/[.,?!;:(){}[\]<>%&@#$^*=_+~`|\\/-]/g, '') // Retire la ponctuation
			.replace(/\s+/g, ' ') // Remplace les espaces multiples par un seul espace
			.trim() // Supprime les espaces en début et fin de texte
			.toLowerCase();
		if(msg.startsWith("coubeh") || msg.startsWith("feur") || msg.startsWith("quoicoubeh") || msg.startsWith("koubeh") || msg.startsWith("quoikoubeh")){
			let lastmessagecontent = "";
;			if (message.reference) {
				// Si le message est une réponse, récupérer le message référencé
				try {
					const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
					lastmessagecontent = referencedMessage.content;
				} catch (error) {
					console.error("Erreur lors de la récupération du message référencé :", error);
				}
			} else {
				// Sinon, récupérer le message précédent
				try {
					const messages = await message.channel.messages.fetch({ limit: 2 });
					const previousMessage = messages.last(); // Le message juste avant le message actuel
					if (previousMessage && previousMessage.id !== message.id) {
						lastmessagecontent = previousMessage.content;
					}
				} catch (error) {
					console.error("Erreur lors de la récupération du message précédent :", error);
				}
			}
			const lastmsg = lastmessagecontent.normalize("NFKD") // Décompose les caractères accentués en leur forme de base
			.replace(/[\u0300-\u036f]/g, '') // Supprime les accents combinés (é → e, ñ → n)
			.replace(/[³3€]/g, 'e') // Remplace 3, € par "e"
			.replace(/[«»“”„‟]/g, '"') // Remplace guillemets doubles par "
			.replace(/[‘’‚‛]/g, "'") // Remplace guillemets simples par '
			.replace(/[^a-zA-Z0-9\s"']/g, '') // Supprime les caractères spéciaux sauf lettres, chiffres, espaces et guillemets
			.replace(/[.,?!;:(){}[\]<>%&@#$^*=_+~`|\\/-]/g, '') // Retire la ponctuation
			.replace(/\s+/g, ' ') // Remplace les espaces multiples par un seul espace
			.trim() // Supprime les espaces en début et fin de texte
			.toLowerCase();
			
			if(lastmsg.endsWith("quoi") || lastmsg.endsWith("koi")){
				await message.delete();
			}
		}
    }
}