const Config = require("../config.json")
const Discord = require("discord.js");
const fs = require("fs");
const statsHandler = require("../statsHandler.js")
const Client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers
    ]
});

Client.login(Config.token);

function waitUntilReady(client) {
    return new Promise((resolve) => {
        if (client.isReady()) return resolve();
        client.once("ready", () => resolve());
    });
}
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

function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date();

  // Passer à demain, minuit
  midnight.setHours(24, 0, 0, 0);

  return midnight - now;
}

async function clearMessages(channel) {
  let fetched;
  do {
    fetched = await channel.messages.fetch({ limit: 100 });
    const deletable = fetched.filter(m => (Date.now() - m.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
    await channel.bulkDelete(deletable, true);
  } while (fetched.size >= 2);
}

module.exports = {
    name: "ready",
    once: true,
    async execute(){
        console.log("Bot ready.");
        var i = 0
        const guilds = Client.guilds.cache.map(g => g.id)
        while(guilds[i] != undefined){
            var guildid = [guilds[i]]
            const rest = new Discord.REST({ version: "10" }).setToken(Config.token);
            (async () => {
                try {
                    console.log("Registering slash commands...")
                    await rest.put(
                        Discord.Routes.applicationGuildCommands(Client.user.id, guildid),
                        { body: commands }
                    )
                    console.log("Slash commands registered.")
                } catch (error) {
                    console.log(`Error : ${error}`);
                }
            })();
            i += 1
        }

        statsHandler.initializeDatabase();

        await waitUntilReady(Client)
        Client.user.setPresence({ activities: [{ name: 'les crêpes cuires', type: Discord.ActivityType.Listening }], status: 'online' });
        const channel = await Client.channels.fetch('1383815098606424235');
        setTimeout(() => {
            clearMessages(channel)
            setInterval(() => {
                clearMessages(channel)
            }, 1000 * 60 * 60 * 24)
        }, msUntilMidnight())
    }
}