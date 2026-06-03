const { registerFont, createCanvas, loadImage } = require("canvas");
const Stats = require("./statsHandler");
const Time = require("./timeHandler");
const Discord = require("discord.js");
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

function canvasText(ctx, text, fontSize, position, maxWidth){
    do {
        ctx.font = `${fontSize}px sans-serif`;
        fontSize--;
    } while (ctx.measureText(text).width > maxWidth && fontSize > 10);

    ctx.fillText(text, position[0], position[1]);
}

function drawLineChart(ctx, messageData, voiceData, x, y, width, height) {
    if (messageData.length < 2 || voiceData < 2) return;
    if(messageData.length !== voiceData.length)
        return console.error("messageData et voiceData doivent être de même longueur.");

    const dataLength = messageData.length;

    const maxMessage = Math.max(...messageData);
    const minMessage = 0;
    const rangeMessage = Math.max(maxMessage - minMessage, 1);

    const maxVoice = Math.max(...voiceData);
    const minVoice = 0;
    const rangeVoice = Math.max(maxVoice - minVoice, 1);

    const lastfillStyle = ctx.fillStyle;

    if(maxMessage !== maxVoice){
        if(maxMessage !== minMessage){
            ctx.fillStyle = "#3CB44BFF";
            canvasText(ctx, maxMessage.toString(), 20, [x,y-12.5], 25);
        }
        
        if(maxVoice !== minVoice){
            ctx.fillStyle = "#D45087FF";
            canvasText(ctx, maxVoice.toString(), 20, [x,y+12.5], 25);
        }
    }
    else if(maxMessage !== 0){
        ctx.fillStyle = "#ffffff";
        canvasText(ctx, maxMessage.toString(), 20, [x, y], 25);
    }

    ctx.fillStyle = "#ffffff";
    canvasText(ctx, minMessage.toString(), 20, [x, y+height], 25);
    canvasText(ctx, `${dataLength}j`, 20, [x+width+25, y+height], 25);
    

    const lastStrokeStyle = ctx.strokeStyle;
    ctx.strokeStyle = "#ffffff";

    x+=5
    width-=5

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();

    // Messages
    ctx.fillStyle = "#3CB44BFF";
    ctx.strokeStyle = "#3CB44BFF";

    const stepXMessage = width / (messageData.length - 1);

    // Courbe
    ctx.beginPath();

    messageData.forEach((value, i) => {
        const px = x + i * stepXMessage;
        const py = y + height - ((value - minMessage) / rangeMessage) * height;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    });

    ctx.stroke();

    // Points
    messageData.forEach((value, i) => {
        const px = x + i * stepXMessage;
        const py = y + height - ((value - minMessage) / rangeMessage) * height;

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    const stepXVoice = width / (voiceData.length - 1);

    // Vocal

    ctx.fillStyle = "#D45087FF";
    ctx.strokeStyle = "#D45087FF";
    // Courbe
    ctx.beginPath();

    voiceData.forEach((value, i) => {
        const px = x + i * stepXVoice;
        const py = y + height - ((value - minVoice) / rangeVoice) * height;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    });

    ctx.stroke();

    // Points
    voiceData.forEach((value, i) => {
        const px = x + i * stepXVoice;
        const py = y + height - ((value - minVoice) / rangeVoice) * height;

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = lastfillStyle;
    ctx.strokeStyle = lastStrokeStyle;
}

/**
 * Créé le canvas des stats de l'utilisateur.
 * 
 * @param {Discord.User} user - Utilisateur dont le classement est à récupérer.
 * @param {Object} userData - Les données de l'utilisateur (les récupère automatiquement si non défini).
 * @returns {Buffer} buffer - Le buffer du canvas. 
 */
async function createUserStats(user, userData) {
    if (!userData || Object.keys(userData).length === 0) {
        userData = await Stats.getUser(user);
    }

    const canvas = createCanvas(1280, 708);
    const ctx = canvas.getContext("2d");

    var background = await loadImage(process.env.USER_STATS_TEMPLATE);
    ctx.drawImage(background, 0, 0, 1280, 708);


    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const messageRank = await Stats.userMessageRank(user);
    const voiceRank = await Stats.userVoiceRank(user);

    // Classement
    canvasText(ctx, `#${messageRank.toString()}`, 50, [305, 230], 180);
    canvasText(ctx, `#${voiceRank.toString()}`, 50, [305, 325], 180);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayMessages = Stats.getMessageCountFromTo(userData, yesterday);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastWeekMessages = Stats.getMessageCountFromTo(userData, lastWeek);

    // Messages
    canvasText(ctx, `${yesterdayMessages.toString()} messages`, 30, [680, 215], 270);
    canvasText(ctx, `${lastWeekMessages.toString()} messages`, 30, [680, 275], 270);
    canvasText(ctx, `${userData.messageCount.toString()} messages`, 30, [680, 335], 270);


    const yesterdayVoiceTime = Math.floor(Stats.getVoiceTimeFromTo(userData, yesterday) / 3600000); // Convertir ms en heure

    const lastWeekVoiceTime = Math.floor(Stats.getVoiceTimeFromTo(userData, lastWeek) / 3600000);

    const allVoiceTime = Math.floor(userData.voiceTime / 3600000);

    // Vocal
    canvasText(ctx, `${yesterdayVoiceTime.toString()} heures`, 30, [1100, 215], 270);
    canvasText(ctx, `${lastWeekVoiceTime.toString()} heures`, 30, [1100, 275], 270);
    canvasText(ctx, `${allVoiceTime.toString()} heures`, 30, [1100, 335], 270);

    const topMessageChannels = Object.entries(userData.messageChannels).sort((a, b) => b[1] - a[1]); // Tri décroissant
    const topVoiceChannels = Object.entries(userData.voiceChannels).sort((a, b) => b[1] - a[1]); // Tri décroissant

    await waitUntilReady(Client);

    if(topMessageChannels.length !== 0){
        const topMessageChannel = await Client.channels.fetch(topMessageChannels[0][0]);
        canvasText(ctx, topMessageChannel.name, 30, [230, 477], 245);
        canvasText(ctx, `${topMessageChannels[0][1].toString()} messages`, 30, [487, 477], 250);
    }
    else {
        canvasText(ctx, "Aucun salon", 30, [230, 477], 245);
    }

    if(topVoiceChannels.length !== 0){
        const topVoiceChannel = await Client.channels.fetch(topVoiceChannels[0][0]);
        const topVoiceHours = Math.floor(topVoiceChannels[0][1] / 3600000);
        canvasText(ctx, topVoiceChannel.name, 30, [230, 537], 245);
        canvasText(ctx, `${topVoiceHours.toString()} heures`, 30, [487, 537], 250);
    }
    else {
        canvasText(ctx, "Aucun salon", 30, [230, 537], 245);
    }

    // Salons
    canvasText(ctx, "Pas encore implémenté...", 30, [230, 597], 245);
    canvasText(ctx, "⁶🤷⁷", 30, [487, 597], 250);

    const guild = await Client.guilds.fetch(process.env.GUILDS);

    const member = await guild.members.fetch(user.id);

    let joinedDate;
    if(member){
        joinedDate = Time.formatDate(member.joinedAt);
    }
    else {
        joinedDate = "Membre non trouvé."
    }

    const createdDate = Time.formatDate(user.createdAt);

    // DatesCompte
    canvasText(ctx, createdDate, 30, [860, 80], 275);
    canvasText(ctx, joinedDate, 30, [1150, 80], 180);

    ctx.textAlign = "end";
    ctx.textBaseline = "middle";

    let messageData = [];
    let voiceData = [];

    let toDate = new Date();
    let fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 1);

    for (let i = 0; i < 14; i++){
        const toDate = new Date();
        toDate.setDate(toDate.getDate() - i);

        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - (i + 1));

        const messageCount = Stats.getMessageCountFromTo(userData, fromDate, toDate);
        const voiceTime = Stats.getVoiceTimeFromTo(userData, fromDate, toDate);

        messageData.push(messageCount);
        voiceData.push(voiceTime);

        toDate.setDate(toDate.getDate() - 1);
        fromDate.setDate(fromDate.getDate() - 1);
    }

    messageData.reverse();
    voiceData.reverse();

    drawLineChart(ctx, messageData, voiceData, 675, 455, 550, 167);

    ctx.textAlign = "left";
    // Compte


    canvasText(ctx, member.displayName, 50, [150, 65], 450);

    const x = 80;
    const y = 65;
    const radius = 50;

    ctx.save();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    var avatar = await loadImage(member.displayAvatarURL({extension: 'png', size: 1024}));

    ctx.drawImage(
        avatar,
        x - radius,
        y - radius,
        radius * 2,
        radius * 2
    );

    return canvas.toBuffer();
}

module.exports = {
    createUserStats
}