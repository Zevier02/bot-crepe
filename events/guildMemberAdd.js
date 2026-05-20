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
const Canvas = require("canvas")
function waitUntilReady(client) {
    return new Promise((resolve) => {
        if (client.isReady()) return resolve();
        client.once("ready", () => resolve());
    });
}

module.exports = {
    name: "guildMemberAdd",
    once: false,
    async execute(member){
        if (member.user.bot) return;

        // Ajout de await ici
        await member.setNickname("Crêpe sans nom")

        const color = `${Math.floor(Math.random() * 10) == 0 ? "#ffff00" : "#ffffff"}`;
        var canvas = Canvas.createCanvas(1000, 300);
                    
        const ctx = canvas.getContext("2d");
                    
        var background = await Canvas.loadImage(Config.background);
        ctx.drawImage(background, 0, 0, 1000, 300);

        const pseudotext = member.user.displayName.length > 12? member.user.displayName.substring(0, 11) + "..." : member.user.displayName;
        
        ctx.font = "50px Rubik";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText("Bienvenue à", 400, 100);
        ctx.fillText("la nouvelle crêpe", 400, 150);
        ctx.font = "75px Rubik";
        ctx.fillStyle = color
        ctx.textAlign = "left";
        ctx.fillText(pseudotext, 400, 225);
        
        ctx.beginPath();
        ctx.arc(230, 150, 100, 0, Math.PI * 2)
        ctx.closePath();
        ctx.clip();
        
        var avatar = await Canvas.loadImage(member.user.avatarURL({ extension: 'png', size: 1024 }));
        
        ctx.drawImage(avatar, 130, 50, 200, 200);
                    
        var attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
        const embed = new Discord.EmbedBuilder()
            .setTitle("Une nouvelle crêpe est arrivée !")
            .setDescription("🥞Bienvenue à la nouvelle Crêpe !🥞")
            .setColor(color)
            .setImage('attachment://welcome.png')

        // Fetch et envoi avec await
        await waitUntilReady(Client);
        const channel = await Client.channels.fetch("1287103804055097374").catch(() => null);
        if(channel){
            await channel.send({ content: `<@${member.user.id}>`, embeds: [embed], files: [attachment] });
        }
    }
}