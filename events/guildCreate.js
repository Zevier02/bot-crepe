const Config = require("../config.json")
const Discord = require("discord.js");
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
        name: "statssalon",
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