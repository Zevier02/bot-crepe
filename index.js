//Charger l'env
require("dotenv").config()

//Requirements
const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const Client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.MessageContent
    ]
});

const eventFiles = fs.readdirSync(path.join(__dirname, "events")).filter(file => file.endsWith(".js"));

//Event handler
for (const file of eventFiles){
    const event =  require("./events/" + file);
    if(event.once){
        Client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        Client.on(event.name, (...args) => event.execute(...args));
    }
}

Client.login(process.env.TOKEN);