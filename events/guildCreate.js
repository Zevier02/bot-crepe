const Config = require("../config.json")
const Discord = require(Config.ddiscordjs);
const fs = require("fs");
const Client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers
    ]
});
Client.login(Config.token)
const commands = [
    {
        name: "pseudos",
        description: "Vérifier le pseudo de tout les membres.",
        default_member_permissions: 0x0000000000000008,
        options: [
            {
                name: "modifier",
                description: "Dois-je modifier les pseudos ?",
                required: true,
                type: Discord.ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "non",
                        value: "false"
                    },

                    {
                        name: "oui",
                        value: "true"
                    }
                ]
            }
        ]
    },

    {
        name: "customdrop",
        description: "Drop un truc custom comme DraftBot.",
        default_member_permissions: 0x0000000000000008,
        options: [
            {
                name: "truc",
                description: "Le truc que tu veux donner.",
                type: Discord.ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },

    {
        name: "cardtest",
        description: "Envoie un test de carte de nouveau memebre comme quand quelqu'un rejoint.",
        default_member_permissions: 0x0000000000000008,
        options: [
            {
                name: "pseudo",
                description: "Le pseudo du faux membre.",
                type: Discord.ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    
    {
        name: "pourcentage",
        description: "Compter le pourcentage de message envoyé par une personne dans un salon.",
        default_member_permissions: 0x0000000000000008,
        options: [
            {
                name: "utilisateur",
                description: "utilisateur à vérifier",
                type: Discord.ApplicationCommandOptionType.User,
                required: false
            },

            {
                name: "salon",
                description: "salon à vérifier",
                type: Discord.ApplicationCommandOptionType.Channel,
                required: false
            },

            {
                name: "top",
                description: "Classement ?",
                type: Discord.ApplicationCommandOptionType.String,
                required: false,
                choices: [
                    {
                        name: "oui",
                        value: "true"
                    },
                    {
                        name: "non",
                        value: "false"
                    }
                ]
            },
            
            {
                name: "nombre",
                description: "Si c'est un classement, combien de personnes maximum dedans ? (min 1, max 25)",
                type: Discord.ApplicationCommandOptionType.Integer,
                required: false,
                minValue: 1,
    			maxValue: 25
            }
        ]
    }
]

module.exports = {
    name: "guildCreate",
    once: false,
    async execute(guild){
        if(Config.guilds.indexOf(guild.id) == -1){
            guild.leave()
        }
        else {
            const rest = new Discord.REST({ version: "10" }).setToken(Config.token);
        (async () => {
                try {
                    console.log("Registering slash commands...")
                    const guilds = [guild.id]
                    await rest.put(
                        Discord.Routes.applicationGuildCommands(Client.user.id, guilds),
                        { body: commands }
                    )
                    console.log("Slash commands registered.")
                } catch (error) {
                    console.log(`Error : ${error}`);
                }
            })();
        }
    }
}
