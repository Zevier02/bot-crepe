const Discord = require("discord.js");
const Stats = require("../statsHandler")

const vocalTimers = new Map();
const soloTimers = new Map();

const TARGET_VOICE_CHANNEL_ID = "1279820094847062087";
const VOICE_CHANNEL_ID = "1274312743372980244";

async function checkSolitude(channel) {
    const members = [...channel.members.values()];
    if (members.length === 1) {
        const member = members[0];

        if (soloTimers.has(member.id)) return;

        const timeout = setTimeout(async () => {
            try {
                if (member.voice.channelId === channel.id && channel.members.size === 1) {
                    await member.voice.setChannel(TARGET_VOICE_CHANNEL_ID);
                    await member.send({embeds: [new Discord.EmbedBuilder()
                        .setColor("Yellow")
                        .setDescription(`Tu es resté seul(e) pendant 1h dans le salon vocal <#${channel.id}>. Tu as été déplacé(e) automatiquement dans <#${TARGET_VOICE_CHANNEL_ID}>.`)]});
                }
            } catch (err) {
                console.error(`Erreur déplacement solo pour ${member.user.tag}`, err);
            } finally {
                soloTimers.delete(member.id);
            }
        }, 60 * 60 * 1000);

        soloTimers.set(member.id, timeout);
    } else {
        // Plusieurs membres dans le salon → annuler timers solo
        for (const member of members) {
            if (soloTimers.has(member.id)) {
                clearTimeout(soloTimers.get(member.id));
                soloTimers.delete(member.id);
            }
        }
    }
}

async function checkAllVoiceChannels(guild) {
    const voiceChannels = guild.channels.cache.filter(c =>
        c.type === 2 &&
        c.id !== TARGET_VOICE_CHANNEL_ID &&
        c.id !== VOICE_CHANNEL_ID
    );

    for (const channel of voiceChannels.values()) {
        await checkSolitude(channel);
    }
}

module.exports = {
    name: Discord.Events.VoiceStateUpdate,
    once: false,

    /**
     * @param {Discord.VoiceState} oldState
     * @param {Discord.VoiceState} newState
     */
    async execute(oldState, newState) {
        const member = newState.member;
        const user = member.user;

        if (!newState.channelId) {
            clearTimeout(vocalTimers.get(member.id));
            clearTimeout(soloTimers.get(member.id));
            vocalTimers.delete(member.id);
            soloTimers.delete(member.id);
        }

        if (oldState.channelId === TARGET_VOICE_CHANNEL_ID && newState.channelId !== TARGET_VOICE_CHANNEL_ID) {
            clearTimeout(vocalTimers.get(member.id));
            vocalTimers.delete(member.id);
        }

        if (newState.channelId === TARGET_VOICE_CHANNEL_ID) {
            const timeout = setTimeout(async () => {
                if (member.voice.channelId === TARGET_VOICE_CHANNEL_ID) {
                    await member.voice.disconnect().catch(() => {});
                    await member.send({embeds: [new Discord.EmbedBuilder()
                        .setColor("Yellow")
                        .setDescription(`Tu es resté trop longtemps (1h) dans le salon vocal <#${TARGET_VOICE_CHANNEL_ID}>. Tu as été déconnecté automatiquement.`)]}).catch(() => {});
                }
                vocalTimers.delete(member.id);
            }, 60 * 60 * 1000);
            vocalTimers.set(member.id, timeout);
        }

        // Cette ligne clé : on check **tous** les salons vocaux à chaque changement
        if (newState.guild) {
            await checkAllVoiceChannels(newState.guild);
        }


        
        // =====================
        //     STATISTIQUES
        // =====================

        await Stats.createUserIfNotExists(user)

        const globalData = await Stats.getGlobal();
        const userData = await Stats.getUser(user);
        const now = Date.now();

        const userFieldsToUpdate = {};
        const globalFieldsToUpdate = {};

        if(!oldState.channel && newState.channel){ // Vient de rejoindre un salon.
            const Voice = {
                channel: newState.channelId,
                date: now,
                duration: null
            }


            // Users
            userData.voices.push(Voice);

            userFieldsToUpdate.voices = userData.voices;


            // Global
            if(globalData.connectedUsers.indexOf(user.id) === -1){
                globalData.connectedUsers.push(user.id);
                globalFieldsToUpdate.connectedUsers = globalData.connectedUsers;
            }
        }
        else if(oldState.channel && newState.channel){ // Déplacement vers un nouveau salon.
            await Stats.createChannelIfNotExists(oldState.channel);
            const oldChannelData = await Stats.getChannel(oldState.channel); 

            const Voice = {
                channel: newState.channelId,
                date: now,
                duration: null
            }

            const lastVoice = userData.voices[userData.voices.length - 1];
            const duration = now - lastVoice.date;


            // Global
            globalData.totalVoice += duration;

            globalFieldsToUpdate.totalVoice = globalData.totalVoice;

            if(globalData.connectedUsers.indexOf(user.id) === -1){
                globalData.connectedUsers.push(user.id);
                globalFieldsToUpdate.connectedUsers = globalData.connectedUsers;
            }


            // Users
            lastVoice.duration = duration;

            userData.voiceTime += duration;

            userData.voiceChannels[lastVoice.channel] =
                (userData.voiceChannels[lastVoice.channel] ?? 0) + duration;

            userData.voices.push(Voice);

            userFieldsToUpdate.voices = userData.voices;
            userFieldsToUpdate.voiceChannels = userData.voiceChannels;
            userFieldsToUpdate.voiceTime = userData.voiceTime;


            // Salons
            oldChannelData.totalVoice += duration;

            const channelVoice = {
                date: lastVoice.date,
                duration: lastVoice.duration,
                user: user.id
            }

            oldChannelData.voices.push(channelVoice);
            oldChannelData.usersVoice[user.id] =
                (oldChannelData.usersVoice[user.id] ?? 0) + duration;

            await Stats.updateChannel(oldState.channel, {
                totalvoice: oldChannelData.totalVoice,
                voices: oldChannelData.voices,
                usersVoice: oldChannelData.usersVoice
            });
        }
        else if(oldState.channel && !newState.channel){ // Déconnection.
            await Stats.createChannelIfNotExists(oldState.channel);
            const oldChannelData = await Stats.getChannel(oldState.channel); 

            const lastVoice = userData.voices[userData.voices.length - 1];
            const duration = now - lastVoice.date;
            lastVoice.duration = duration;

            userData.voiceTime += duration;


            // Global
            const index = globalData.connectedUsers.indexOf(user.id);

            if(index !== -1){
                globalData.connectedUsers.splice(index, 1);
                globalFieldsToUpdate.connectedUsers = globalData.connectedUsers;
            }

            globalData.totalVoice += duration;

            globalFieldsToUpdate.connectedUsers = globalData.connectedUsers;
            globalFieldsToUpdate.totalVoice = globalData.totalVoice;


            // Users
            userData.voiceChannels[lastVoice.channel] =
                (userData.voiceChannels[lastVoice.channel] ?? 0) + duration;

            userFieldsToUpdate.voices = userData.voices;
            userFieldsToUpdate.voiceChannels = userData.voiceChannels;
            userFieldsToUpdate.voiceTime = userData.voiceTime;


            //Salon
            oldChannelData.totalVoice += duration;

            const channelVoice = {
                date: lastVoice.date,
                duration: lastVoice.duration,
                user: user.id
            }

            oldChannelData.voices.push(channelVoice);
            oldChannelData.usersVoice[user.id] =
                (oldChannelData.usersVoice[user.id] ?? 0) + duration;

            await Stats.updateChannel(oldState.channel, {
                totalvoice: oldChannelData.totalVoice,
                voices: oldChannelData.voices,
                usersVoice: oldChannelData.usersVoice
            });
        }

        await Stats.updateUser(user, userFieldsToUpdate);
        await Stats.updateGlobal(globalFieldsToUpdate);
    }
};