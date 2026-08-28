const { pool, getCaller } = require("./db");
const {
    getGlobal,
    updateGlobal,
    getTopMessageChannel,
    getTopVoiceChannel,
    getTopMessageUser, 
    getTopVoiceUser} = require("./global");

const {
    createChannelIfNotExists,
    updateChannel,
    getChannel,
    channelVoiceRank,
    channelMessageRank,
    getChannelMessageCountFromTo,
    getChannelVoiceTimeFromTo,
    getChannelMessageContributorsFromTo,
    getChannelVoiceContributorsFromTo } = require("./channel");

const {    
    createUserIfNotExists,
    updateUser,
    getUser,
    userMessageRank,
    userVoiceRank,
    getUserMessageCountFromTo,
    getUserVoiceTimeFromTo } = require("./user");

/**
 * Initialise la base de données (créé les tables si elles n'existent pas).
 * 
 * @returns {boolean} success - `true` en cas de succès et `false` en cas d'erreur.
 */
async function initializeDatabase() {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(32) PRIMARY KEY,
            messageCount BIGINT UNSIGNED NOT NULL DEFAULT 0,
            voiceTime BIGINT UNSIGNED NOT NULL DEFAULT 0,
            messageChannels JSON NOT NULL DEFAULT '{}',
            voiceChannels JSON NOT NULL DEFAULT '{}',
            messages JSON NOT NULL DEFAULT '[]',
            voices JSON NOT NULL DEFAULT '[]')
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS channels (
            id VARCHAR(32) PRIMARY KEY,
            boost FLOAT DEFAULT 1,
            textBased BOOLEAN NOT NULL DEFAULT TRUE,
            usersMessage JSON NOT NULL DEFAULT '{}',
            totalMessage BIGINT UNSIGNED NOT NULL DEFAULT 0,
            usersVoice JSON DEFAULT NULL,
            totalVoice BIGINT UNSIGNED DEFAULT NULL,
            messages JSON NOT NULL DEFAULT '[]',
            voices JSON)
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS global (
            id VARCHAR(32) PRIMARY KEY,
            totalMessage BIGINT UNSIGNED NOT NULL DEFAULT 0,
            totalVoice BIGINT UNSIGNED NOT NULL DEFAULT 0,
            connectedUsers JSON NOT NULL DEFAULT '[]')
        `);

        await pool.execute(`
            INSERT IGNORE INTO global (id) VALUES (?);
        `, [process.env.GUILDS]);

        console.log("Database initialized.");

        return true;
    } catch (error) {
        console.error(`Impossible d'initialiser la Base de donnée :\n${error}`);
        return false;
    }
}

/**
 * Vérifie tous les salons vocaux et les personnes marquées comme connectées dans la base de donnée.
 * Appelée automatiquement au démarrage.
 * 
 * @param {import('discord.js').Client} Client- Le client discord du bot.
 */
async function checkAllVoices(Client) {
    const guild = await Client.guilds.fetch(process.env.GUILDS);
    const channels = await guild.channels.fetch();

    const globalData = await getGlobal();

    const globalFieldsToUpdate = {};

    for (const userId of globalData.connectedUsers) { // Vérifie pour toues les membres marqués comme connectés.
        const member = await guild.members.fetch(userId);
        if (!member) {
            console.error("Le membre n'existe pas.");
            continue;
        }

        if (member.voice.channel) continue;

        const now = Date.now();

        const user = member.user;
        await createUserIfNotExists(user);
        const userData = await getUser(user);

        const index = globalData.connectedUsers.indexOf(user.id);

        // On le retire si il n'est plus connecté
        globalData.connectedUsers = globalData.connectedUsers.filter(id => id !== user.id);
        globalFieldsToUpdate.connectedUsers = globalData.connectedUsers;

        if (userData.voices.length > 0) { // Si il a des vocs avant
            const lastVoice = userData.voices[userData.voices.length - 1];
            if (lastVoice.duration === null) { // Si sa dernière voc était encore en cours (pas de duration = pas finie).

                const oldChannel = await guild.channels.fetch(lastVoice.channel);
                await createChannelIfNotExists(oldChannel);
                const oldChannelData = await getChannel(oldChannel); 


                const duration = now - lastVoice.date;
                lastVoice.duration = duration;

                // Users
                userData.voiceChannels[lastVoice.channel] =
                    (userData.voiceChannels[lastVoice.channel] ?? 0) + duration;

                userData.voiceTime += duration;


                // Global
                globalData.totalVoice += duration;


                // Salon
                oldChannelData.totalVoice += duration;

                const channelVoice = {
                    date: lastVoice.date,
                    duration: lastVoice.duration,
                    user: user.id
                }

                oldChannelData.voices.push(channelVoice);
                oldChannelData.usersVoice[user.id] =
                    (oldChannelData.usersVoice[user.id] ?? 0) + duration;

                await updateChannel(oldChannel, {
                    totalvoice: oldChannelData.totalVoice,
                    voices: oldChannelData.voices,
                    usersVoice: oldChannelData.usersVoice
                });

                await updateUser(user, {
                    voices: userData.voices,
                    voiceChannels: userData.voiceChannels,
                    voiceTime: userData.voiceTime
                });
            }
        }
    }

    for (const channel of channels.values()) { // Vérifie les connections dans tous les salons vocaux
        if (!channel.isVoiceBased()) continue;

        await createChannelIfNotExists(channel);
        const oldChannelData = await getChannel(channel); 

        for (const member of channel.members.values()) {
            const userFieldsToUpdate = {};
            const now = Date.now();


            const user = member.user;
            await createUserIfNotExists(user);
            const userData = await getUser(user);


            if (userData.voices.length > 0) { // Si il a des anciennes voc
                const lastVoice = userData.voices[userData.voices.length - 1];

                if (lastVoice.duration === null) { // Si sa dernière voc était encore en cours
                    const duration = now - lastVoice.date;
                    lastVoice.duration = duration;


                    // Users
                    userData.voiceChannels[lastVoice.channel] =
                        (userData.voiceChannels[lastVoice.channel] ?? 0) + duration;

                    userData.voiceTime += duration;

                    userFieldsToUpdate.voiceChannels = userData.voiceChannels;
                    userFieldsToUpdate.voiceTime = userData.voiceTime;


                    // Global
                    globalData.totalVoice += duration;

                    globalFieldsToUpdate.totalVoice = globalData.totalVoice;


                    // Salon
                    oldChannelData.totalVoice += duration;

                    const channelVoice = {
                        date: lastVoice.date,
                        duration: lastVoice.duration,
                        user: user.id
                    }

                    oldChannelData.voices.push(channelVoice);
                    oldChannelData.usersVoice[user.id] =
                        (oldChannelData.usersVoice[user.id] ?? 0) + duration;

                    await updateChannel(channel, {
                        totalvoice: oldChannelData.totalVoice,
                        voices: oldChannelData.voices,
                        usersVoice: oldChannelData.usersVoice
                    });
                }
            }

            const Voice = {
                channel: channel.id,
                date: now,
                duration: null
            }

            if (globalData.connectedUsers.indexOf(user.id) === -1) {
                globalData.connectedUsers.push(user.id); // Push si il n'était pas dans la liste des connectés.
                globalFieldsToUpdate.connectedUsers = globalData.connectedUsers;
            }


            userData.voices.push(Voice);
            userFieldsToUpdate.voices = userData.voices;
            

            await updateUser(user, userFieldsToUpdate);
            await updateGlobal(globalFieldsToUpdate);
        };
    }

    console.log("All checks finished.");
}

module.exports = {
    pool,
    getCaller,
    initializeDatabase,
    createUserIfNotExists,
    updateUser,
    getUser,
    userMessageRank,
    userVoiceRank,
    getUserMessageCountFromTo,
    getUserVoiceTimeFromTo,
    getGlobal,
    updateGlobal,
    createChannelIfNotExists,
    updateChannel,
    getChannel,
    checkAllVoices,
    channelMessageRank,
    channelVoiceRank,
    getChannelMessageCountFromTo,
    getChannelVoiceTimeFromTo,
    getChannelMessageContributorsFromTo,
    getChannelVoiceContributorsFromTo,
    getTopMessageChannel,
    getTopVoiceChannel,
    getTopMessageUser,
    getTopVoiceUser
}