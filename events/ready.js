const Discord = require("discord.js");
const fs = require("fs");
const Stats = require("../statsHandler.js");
const Client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers
    ]
});

Client.login(process.env.TOKEN);

function waitUntilReady(client) {
    return new Promise((resolve) => {
        if (client.isReady()) return resolve();
        client.once("ready", () => resolve());
    });
}

const commands = [
    {
        name: "stats",
        description: "Regarder les statistiques.",
        default_member_permissions: 0x0000000000000008,
        options: [
            {
                name: "utilisateur",
                description: "Regarder les statistiques d'un utilisateur.",
                type: Discord.ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "utilisateur",
                        description: "L'utilisateur dont il faut regarder les statistiques.",
                        type: Discord.ApplicationCommandOptionType.User
                    }
                ]
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

        await Stats.initializeDatabase();
        await waitUntilReady(Client);

        let i = 0
        const guilds = Client.guilds.cache.map(g => g.id)
        while(guilds[i] != undefined){
            let guildid = [guilds[i]]
            const rest = new Discord.REST({ version: "10" }).setToken(process.env.TOKEN);
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

        Client.user.setPresence({ activities: [{ name: 'les crêpes cuires', type: Discord.ActivityType.Listening }], status: 'online' });
        const channel = await Client.channels.fetch('1383815098606424235');
        setTimeout(() => {
            clearMessages(channel)
            setInterval(() => {
                clearMessages(channel)
            }, 1000 * 60 * 60 * 24)
        }, msUntilMidnight());

        await Stats.checkAllVoices(Client);
    }
}