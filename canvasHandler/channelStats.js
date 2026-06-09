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
 * Créé le canvas des stats du salon.
 * 
 * @param {Discord.Channel} channel - Salon.
 * @param {Object} channelData - Les données du salon (les récupère automatiquement si non défini).
 * @returns {Buffer} buffer - Le buffer du canvas. 
 */
async function createChannelStats(channel, channelData) {
    if (!channelData || Object.keys(channelData).length === 0) {
        channelData = await Stats.getChannel(channel);
    }
    const textBased = channelData.textBased;

    const canvas = createCanvas(1280, 708);
    const ctx = canvas.getContext("2d");

    let background = await loadImage(path.join(__dirname, "..", "statsTemplates", `${textBased? "text":"voice"}ChannelStatsTemplate.png`));
    ctx.drawImage(background, 0, 0, 1280, 708);


    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Classement
    let rank = null;
    if(textBased){
        rank = await Stats.channelMessageRank(channel);
    }
    else {
        rank = await Stats.channelVoiceRank(channel);
    }
    
    canvasText(ctx, `#${rank.toString()}`, 75, [220, 270], 350);

    // Activité (message ou vocal)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date();
    lastWeek.setHours(0, 0, 0, 0);
    lastWeek.setDate(lastWeek.getDate() - 6);

    if(textBased){
        const todayMessages = Stats.getChannelMessageCountFromTo(channelData, today);

        const lastWeekMessages = Stats.getChannelMessageCountFromTo(channelData, lastWeek);

        canvasText(ctx, `${todayMessages.toString()} messages`, 30, [680, 215], 270);
        canvasText(ctx, `${lastWeekMessages.toString()} messages`, 30, [680, 275], 270);
        canvasText(ctx, `${channelData.totalMessage.toString()} messages`, 30, [680, 335], 270);
    }
    else {
        const todayVoiceTime = Math.floor(Stats.getChannelVoiceTimeFromTo(channelData, today) / 3600000); // Convertir ms en heure

        const lastWeekVoiceTime = Math.floor(Stats.getChannelVoiceTimeFromTo(channelData, lastWeek) / 3600000);

        const allVoiceTime = Math.floor(channelData.totalVoice / 3600000);

        canvasText(ctx, `${todayVoiceTime.toString()} heures`, 30, [680, 215], 270);
        canvasText(ctx, `${lastWeekVoiceTime.toString()} heures`, 30, [680, 275], 270);
        canvasText(ctx, `${allVoiceTime.toString()} heures`, 30, [680, 335], 270);
    }

    // Contributeurs
    if(textBased){
        const todayContributors = Stats.getChannelMessageContributorsFromTo(channelData, today);

        const lastWeekContributors = Stats.getChannelMessageContributorsFromTo(channelData, lastWeek);

        const allContributors = Object.keys(channelData.usersMessage).length;

        canvasText(ctx, `${todayContributors.toString()} contributeurs`, 30, [1100, 215], 270);
        canvasText(ctx, `${lastWeekContributors.toString()} contributeurs`, 30, [1100, 275], 270);
        canvasText(ctx, `${allContributors.toString()} contributeurs`, 30, [1100, 335], 270);
    }
    else {
        const todayContributors = Stats.getChannelVoiceContributorsFromTo(channelData, today);

        const lastWeekContributors = Stats.getChannelVoiceContributorsFromTo(channelData, lastWeek);

        const allContributors = Object.keys(channelData.usersVoice).length;

        canvasText(ctx, `${todayContributors.toString()} contributeurs`, 30, [1100, 215], 270);
        canvasText(ctx, `${lastWeekContributors.toString()} contributeurs`, 30, [1100, 275], 270);
        canvasText(ctx, `${allContributors.toString()} contributeurs`, 30, [1100, 335], 270);
    }

    // Meilleurs utilisateurs
    await waitUntilReady(Client);
    const guild = await Client.guilds.fetch(process.env.GUILDS);

    if(textBased){
        const top = Object.entries(channelData.usersMessage).sort((a, b) => b[1] - a[1]); // Tri décroissant

        // Premier
        if(top.length >= 1){
            const user = await guild.members.fetch(top[0][0]);
            canvasText(ctx, user.displayName, 30, [180, 477], 280);
            canvasText(ctx, `${top[0][1].toString()} messages`, 30, [470, 477], 260);
        } else {
            canvasText(ctx, "Aucun utilisateur", 30, [180, 477], 280);
        }

        // Deuxième
        if(top.length >= 2){
            const user = await guild.members.fetch(top[1][0]);
            canvasText(ctx, user.displayName, 30, [180, 537], 280);
            canvasText(ctx, `${top[1][1].toString()} messages`, 30, [470, 537], 260);
        } else {
            canvasText(ctx, "Aucun utilisateur", 30, [180, 537], 280);
        }

        // Troisième
        if(top.length >= 3){
            const user = await guild.members.fetch(top[2][0]);
            canvasText(ctx, user.displayName, 30, [180, 597], 280);
            canvasText(ctx, `${top[2][1].toString()} messages`, 30, [470, 597], 260);
        } else {
            canvasText(ctx, "Aucun utilisateur", 30, [180, 597], 280);
        }
    }
    else {
        const top = Object.entries(channelData.usersVoice).sort((a, b) => b[1] - a[1]); // Tri décroissant

        // Premier
        if(top.length >= 1){
            const user = await guild.members.fetch(top[0][0]);
            canvasText(ctx, user.displayName, 30, [180, 477], 280);

            const voiceTime = Math.floor(top[0][1] / 3600000);

            canvasText(ctx, `${voiceTime.toString()} heures`, 30, [470, 477], 260);
        } else {
            canvasText(ctx, "Aucun utilisateur", 30, [180, 477], 280);
        }

        // Deuxième
        if(top.length >= 2){
            const user = await guild.members.fetch(top[1][0]);
            canvasText(ctx, user.displayName, 30, [180, 537], 280);

            const voiceTime = Math.floor(top[1][1] / 3600000);

            canvasText(ctx, `${voiceTime.toString()} heures`, 30, [470, 537], 260);
        } else {
            canvasText(ctx, "Aucun utilisateur", 30, [180, 537], 280);
        }

        // Troisième
        if(top.length >= 3){
            const user = await guild.members.fetch(top[2][0]);
            canvasText(ctx, user.displayName, 30, [180, 597], 280);

            const voiceTime = Math.floor(top[2][1] / 3600000);

            canvasText(ctx, `${voiceTime.toString()} heures`, 30, [470, 597], 260);
        } else {
            canvasText(ctx, "Aucun utilisateur", 30, [180, 597], 280);
        }
    }

    // Date de création
    const createdDate = Time.formatDate(channel.createdAt);
    canvasText(ctx, createdDate, 30, [1140, 80], 175);


    // Graphique
    ctx.textAlign = "end";
    ctx.textBaseline = "middle";

    if(textBased){
        let data = [];

        for (let i = 0; i < 14; i++){
            const fromDate = new Date();
            fromDate.setHours(0, 0, 0, 0);
            fromDate.setDate(fromDate.getDate() - i);

            const toDate = new Date(fromDate);
            toDate.setDate(toDate.getDate() + 1);

            const messageCount = Stats.getChannelMessageCountFromTo(channelData, fromDate, toDate);

            data.push(messageCount);
        }

        data.reverse();

        drawLineChart(ctx, data, [], 675, 455, 550, 167);
    }
    else {
        let data = [];

        for (let i = 0; i < 14; i++){
            const fromDate = new Date();
            fromDate.setHours(0, 0, 0, 0);
            fromDate.setDate(fromDate.getDate() - i);

            const toDate = new Date(fromDate);
            toDate.setDate(toDate.getDate() + 1);

            const voiceTime = Stats.getChannelVoiceTimeFromTo(channelData, fromDate, toDate);

            data.push(Math.floor(voiceTime / 3600000));
        }

        data.reverse();

        drawLineChart(ctx, [], data, 675, 455, 550, 167);
    }

    ctx.textAlign = "left";

    // Salon
    canvasText(ctx, channel.name, 50, [250, 65], 450);

    const x = 80;
    const y = 65;
    const radius = 50;

    ctx.save();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    var avatar = await loadImage(guild.iconURL({extension: 'png', size: 1024}));

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
    createChannelStats
}