const Discord = require("discord.js");
const Stats = require("../statsHandler")

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