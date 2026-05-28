const Config = require("../config.json")
const Discord = require(Config.ddiscordjs);
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
        name: "statsconfigsalon",
        description: "Configurer la gestion des stats dans un salon.",
        default_member_permissions: 0x0000000000000008,
        options: [
            {
                name: "salon",
                description: "Le salon à configurer",
                type: Discord.ApplicationCommandOptionType.Channel,
                required: true
            },
            
            {
                name: "boost",
                description: "Le boost de statistiques appliqués à ce salon (défaut 1, 0 pour désactiver le gain de stats dans le salon).",
                type: Discord.ApplicationCommandOptionType.Number,
                required: false,
                minValue: 0,
    			maxValue: 5
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