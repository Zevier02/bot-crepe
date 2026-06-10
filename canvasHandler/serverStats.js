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
 * Créé le canvas des stats du serveur.
 * 
 * @returns {Buffer} buffer - Le buffer du canvas. 
 */
async function createServerStats() {
    const globalData = await Stats.getGlobal();

    const canvas = createCanvas(1280, 911);
    const ctx = canvas.getContext("2d");

    let background = await loadImage(path.join(__dirname, "..", "statsTemplates", "serverStatsTemplate.png"));
    ctx.drawImage(background, 0, 0, 1280, 911);


    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    await waitUntilReady(Client);
    const guild = await Client.guilds.fetch(process.env.GUILDS);

    // Messages, vocal, contributeurs
    const channels = await guild.channels.fetch();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date();
    lastWeek.setHours(0, 0, 0, 0);
    lastWeek.setDate(lastWeek.getDate() - 6);

    let totalTodayMessages = 0;
    let totalLastWeekMessages = 0;

    let totalTodayVoiceTime = 0;
    let totalLastWeekVoiceTime = 0;

    let totalTodayContributors = new Set();
    let totalLastWeekContributors = new Set();
    let totalContributors = new Set();

    
    for (const channel of channels.values()) {
        const channelData = await Stats.getChannel(channel);
        if(!channelData) continue;

        totalTodayMessages += Stats.getChannelMessageCountFromTo(channelData, today);
        totalLastWeekMessages += Stats.getChannelMessageCountFromTo(channelData, lastWeek);

        for (const id of Stats.getChannelMessageContributorsFromTo(channelData, today)) {
            totalTodayContributors.add(id);
        }

        for (const id of Stats.getChannelMessageContributorsFromTo(channelData, lastWeek)) {
            totalLastWeekContributors.add(id);
        }

        for (const id of Object.keys(channelData.usersMessage)) {
            totalContributors.add(id);
        }

        if (!channelData.textBased) {
            totalTodayVoiceTime += Stats.getChannelVoiceTimeFromTo(channelData, today);
            totalLastWeekVoiceTime += Stats.getChannelVoiceTimeFromTo(channelData, lastWeek);

            for (const id of Stats.getChannelVoiceContributorsFromTo(channelData, today)) {
                totalTodayContributors.add(id);
            }

            for (const id of Stats.getChannelVoiceContributorsFromTo(channelData, lastWeek)) {
                totalLastWeekContributors.add(id);
            }

            for (const id of Object.keys(channelData.usersVoice)) {
                totalContributors.add(id);
            }
        }
    }

    // Messages
    canvasText(ctx, `${totalTodayMessages.toString()} messages`, 30, [250, 205], 270);
    canvasText(ctx, `${totalLastWeekMessages.toString()} messages`, 30, [250, 260], 270);
    canvasText(ctx, `${globalData.totalMessage.toString()} messages`, 30, [250, 315], 270);

    // Vocal
    const todayVoiceTime = Math.floor(totalTodayVoiceTime / 3600000);
    const lastWeekVoiceTime = Math.floor(totalLastWeekVoiceTime / 3600000);
    const allVoiceTime = Math.floor(globalData.totalVoice / 3600000);

    canvasText(ctx, `${todayVoiceTime.toString()} heures`, 30, [680, 205], 270);
    canvasText(ctx, `${lastWeekVoiceTime.toString()} heures`, 30, [680, 260], 270);
    canvasText(ctx, `${allVoiceTime.toString()} heures`, 30, [680, 315], 270);

    // Contributeurs
    const todayContributors = [...totalTodayContributors].length;
    const lastWeekContributors = [...totalLastWeekContributors].length;
    const allContributors = [...totalContributors].length;

    canvasText(ctx, `${todayContributors.toString()} contributeurs`, 30, [1100, 205], 270);
    canvasText(ctx, `${lastWeekContributors.toString()} contributeurs`, 30, [1100, 260], 270);
    canvasText(ctx, `${allContributors.toString()} contributeurs`, 30, [1100, 315], 270);


    // Top membres

    // Top textuel
    const topMessageUser = await Stats.getTopMessageUser();
    let topMessageMember = await guild.members.fetch(topMessageUser.id);
    if(!topMessageMember){
        topMessageMember = await Client.users.fetch(topMessageUser.id);
    }

    canvasText(ctx, topMessageMember.displayName, 50, [210, 465], 170);
    canvasText(ctx, `${topMessageUser.messageCount.toString()} messages`, 50, [450, 465], 280);

    // Top vocal
    const topVoiceUser = await Stats.getTopVoiceUser();
    let topVoiceMember = await guild.members.fetch(topVoiceUser.id);
    if(!topVoiceMember){
        topVoiceMember = await Client.users.fetch(topVoiceUser.id);
    }


    const topUserVoiceTime = Math.floor(topVoiceUser.voiceTime / 3600000);

    canvasText(ctx, topVoiceMember.displayName, 50, [210, 540], 170);
    canvasText(ctx, `${topUserVoiceTime.toString()} heures`, 50, [450, 540], 280);


    // Top salons

    // Top textuel
    const topMessageChannelData = await Stats.getTopMessageChannel();
    const topMessageChannel = await guild.channels.fetch(topMessageChannelData.id);

    canvasText(ctx, topMessageChannel.name, 50, [870, 465], 220);
    canvasText(ctx, `${topMessageChannelData.totalMessage.toString()} messages`, 50, [1110, 465], 220);

    // Top vocal
    const topVoiceChannelData = await Stats.getTopVoiceChannel();
    const topVoiceChannel = await guild.channels.fetch(topVoiceChannelData.id);

    const topChannelVoiceTime = Math.floor(topVoiceChannelData.totalVoice / 3600000);

    canvasText(ctx, topVoiceChannel.name, 50, [870, 540], 220);
    canvasText(ctx, `${topChannelVoiceTime.toString()} heures`, 50, [1110, 540], 220);

    // Date de création
    const createdDate = Time.formatDate(guild.createdAt);
    canvasText(ctx, createdDate, 30, [890, 80], 175);

    // Date d'activité des stats
    canvasText(ctx, "03/06/2026", 30, [1135, 80], 175);


    // Graphique
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
    
        let messageCount = 0;
        let voiceTime = 0;

        for (const channel of channels.values()) {
            const channelData = await Stats.getChannel(channel);
            if(!channelData) continue;

            messageCount += Stats.getChannelMessageCountFromTo(channelData, fromDate, toDate);

            if(!channelData.textBased){
                voiceTime += Stats.getChannelVoiceTimeFromTo(channelData, fromDate, toDate);
            }
        }
    
        messageData.push(messageCount);
        voiceData.push(Math.floor(voiceTime / 3600000));
    }

    messageData.reverse();
    voiceData.reverse();

    drawLineChart(ctx, messageData, voiceData, 55, 685, 1150, 147);

    ctx.textAlign = "left";

    // Serveur
    canvasText(ctx, guild.name, 50, [150, 65], 450);

    const x = 80;
    const y = 65;
    const radius = 50;

    ctx.save();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    let avatar;
    try {
        avatar = await loadImage(guild.iconURL({forceStatic: true, extension: 'png', size: 1024}));
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
    createServerStats
}