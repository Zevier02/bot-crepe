const { createCanvas, loadImage } = require("canvas");
const { drawLineChart } = require("./graph");
const { canvasText } = require("./text");
const Stats = require("../statsHandler");
const Time = require("../timeHandler");
const Discord = require("discord.js");
const path = require("path");
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

/**
 * Créé le canvas des stats de l'utilisateur.
 * 
 * @param {Discord.User} user - Utilisateur.
 * @param {Object} userData - Les données de l'utilisateur (les récupère automatiquement si non défini).
 * @returns {Buffer} buffer - Le buffer du canvas. 
 */
async function createUserStats(user, userData) {
    if (!userData || Object.keys(userData).length === 0) {
        userData = await Stats.getUser(user);
    }

    const canvas = createCanvas(1280, 708);
    const ctx = canvas.getContext("2d");

    let background = await loadImage(path.join(__dirname, "..", "statsTemplates", "userStatsTemplate.png"));
    ctx.drawImage(background, 0, 0, 1280, 708);


    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const messageRank = await Stats.userMessageRank(user);
    const voiceRank = await Stats.userVoiceRank(user);

    // Classement
    canvasText(ctx, `#${messageRank.toString()}`, 50, [305, 230], 180);
    canvasText(ctx, `#${voiceRank.toString()}`, 50, [305, 325], 180);

    // Messages
    await waitUntilReady(Client);

    const guild = await Client.guilds.fetch(process.env.GUILDS);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMessages = await Stats.getUserMessageCountFromTo(userData, today);

    const lastWeek = new Date();
    lastWeek.setHours(0, 0, 0, 0);
    lastWeek.setDate(lastWeek.getDate() - 6);

    const lastWeekMessages = await Stats.getUserMessageCountFromTo(userData, lastWeek);

    let allMessages = userData.messageCount;

    for (const channelId of Object.keys(userData.messageChannels)) {
        const channel = await guild.channels.fetch(channelId);
        if(!channel){
            allMessages -= userData.messageChannels[channelId];
            continue;
        }

        const channelData = await Stats.getChannel(channel);

        if(channelData.boost === 0){
            allMessages -= userData.messageChannels[channelId];
        }
    }

    // Messages
    canvasText(ctx, `${todayMessages.toString()} messages`, 30, [680, 215], 270);
    canvasText(ctx, `${lastWeekMessages.toString()} messages`, 30, [680, 275], 270);
    canvasText(ctx, `${allMessages.toString()} messages`, 30, [680, 335], 270);


    const todayVoiceTime = Math.floor(await Stats.getUserVoiceTimeFromTo(userData, today) / 3600000); // Convertir ms en heure

    const lastWeekVoiceTime = Math.floor(await Stats.getUserVoiceTimeFromTo(userData, lastWeek) / 3600000);

    let allVoiceTime = userData.voiceTime;

    for (const channelId of Object.keys(userData.voiceChannels)) {
        const channel = await guild.channels.fetch(channelId);
        if(!channel){
            allVoiceTime -= userData.voiceChannels[channelId];
            continue;
        }

        const channelData = await Stats.getChannel(channel);

        if(channelData.boost === 0){
            allVoiceTime -= userData.voiceChannels[channelId];
        }
    }

    allVoiceTime = Math.floor(allVoiceTime / 3600000);

    // Vocal
    canvasText(ctx, `${todayVoiceTime.toString()} heures`, 30, [1100, 215], 270);
    canvasText(ctx, `${lastWeekVoiceTime.toString()} heures`, 30, [1100, 275], 270);
    canvasText(ctx, `${allVoiceTime.toString()} heures`, 30, [1100, 335], 270);

    const topMessageChannels = [];

    for (const entry of Object.entries(userData.messageChannels)) {
        const channel = await guild.channels.fetch(entry[0]);
        if (!channel) continue;

        const channelData = await Stats.getChannel(channel);

        if (channelData.boost !== 0) {
            topMessageChannels.push(entry);
        }
    }

    topMessageChannels.sort((a, b) => b[1] - a[1]);


    const topVoiceChannels = [];

    for (const entry of Object.entries(userData.voiceChannels)) {
        const channel = await guild.channels.fetch(entry[0]);
        if (!channel) continue;

        const channelData = await Stats.getChannel(channel);

        if (channelData.boost !== 0) {
            topVoiceChannels.push(entry);
        }
    }

    topVoiceChannels.sort((a, b) => b[1] - a[1]);

    if(topMessageChannels.length !== 0){
        const topMessageChannel = await guild.channels.fetch(topMessageChannels[0][0]);
        canvasText(ctx, topMessageChannel.name, 30, [230, 477], 245);
        canvasText(ctx, `${topMessageChannels[0][1].toString()} messages`, 30, [487, 477], 250);
    }
    else {
        canvasText(ctx, "Aucun salon", 30, [230, 477], 245);
    }

    if(topVoiceChannels.length !== 0){
        const topVoiceChannel = await guild.channels.fetch(topVoiceChannels[0][0]);
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

    for (let i = 0; i < 14; i++){
        const fromDate = new Date();
        fromDate.setHours(0, 0, 0, 0);
        fromDate.setDate(fromDate.getDate() - i);

        const toDate = new Date(fromDate);
        toDate.setDate(toDate.getDate() + 1);

        const messageCount = await Stats.getUserMessageCountFromTo(userData, fromDate, toDate);
        const voiceTime = await Stats.getUserVoiceTimeFromTo(userData, fromDate, toDate);

        messageData.push(messageCount);
        voiceData.push(Math.floor(voiceTime / 3600000));
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

    let avatar;
    try {
        avatar = await loadImage(member.displayAvatarURL({forceStatic: true, extension: 'png', size: 1024}));
    } catch {
        avatar = await loadImage(path.join(__dirname, "..", "statsTemplates", "baseavatar.png"));
    }

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