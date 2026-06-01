const Discord = require("discord.js");
const fs = require("fs");
const Client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers
    ]
});
Client.login(process.env.TOKEN);

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

module.exports = {
    name: "guildCreate",
    once: false,
    async execute(guild) {
        if (process.env.GUILDS != guild.id) {
            guild.leave()
        }
        else {
            const rest = new Discord.REST({ version: "10" }).setToken(process.env.TOKEN);
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