const mysql = require('mysql2/promise');
const Time = require("./timeHandler");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    supportBigNumbers: true,
    bigNumberStrings: false
});

function getCaller() {
    const obj = {};
    Error.captureStackTrace(obj, getCaller);

    const line = obj.stack.split("\n")[2] || "";

    return line
        .replace("at ", "")
        .trim();
}

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
            messageCount INTEGER UNSIGNED NOT NULL DEFAULT 0,
            voiceTime INTEGER UNSIGNED NOT NULL DEFAULT 0,
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
            totalMessage INTEGER UNSIGNED NOT NULL DEFAULT 0,
            usersVoice JSON DEFAULT NULL,
            totalVoice INTEGER DEFAULT NULL,
            messages JSON NOT NULL DEFAULT '[]',
            voices JSON)
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS global (
            id VARCHAR(32) PRIMARY KEY,
            totalMessage INTEGER UNSIGNED NOT NULL DEFAULT 0,
            totalVoice INTEGER UNSIGNED NOT NULL DEFAULT 0,
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

function parseUserData(userData) {
    userData.messageChannels = JSON.parse(userData.messageChannels);

    userData.voiceChannels = JSON.parse(userData.voiceChannels);

    userData.messages = JSON.parse(userData.messages);

    userData.voices = JSON.parse(userData.voices);

    return userData;
}

function stringifyUserData(userData) {
    if (userData.messageChannels != null) {
        userData.messageChannels = JSON.stringify(userData.messageChannels);
    }

    if (userData.voiceChannels != null) {
        userData.voiceChannels = JSON.stringify(userData.voiceChannels);
    }

    if (userData.messages != null) {
        userData.messages = JSON.stringify(userData.messages);
    }

    if (userData.voices != null) {
        userData.voices = JSON.stringify(userData.voices);
    }

    return userData;
}

function parseGlobalData(globalData) {
    globalData.connectedUsers = JSON.parse(globalData.connectedUsers);

    return globalData;
}

function stringifyGlobalData(globalData) {
    if (globalData.connectedUsers) {
        globalData.connectedUsers = JSON.stringify(globalData.connectedUsers);
    }

    return globalData;
}

function parseChannelData(channelData) {
    channelData.messages = JSON.parse(channelData.messages);

    channelData.usersMessage = JSON.parse(channelData.usersMessage);

    if (!channelData.textBased) {
        channelData.voices = JSON.parse(channelData.voices);
        channelData.usersVoice = JSON.parse(channelData.usersVoice);
    }

    return channelData;
}

function stringifyChannelData(channelData) {
    if (channelData.messages) {
        channelData.messages = JSON.stringify(channelData.messages);
    }

    if (channelData.usersMessage) {
        channelData.usersMessage = JSON.stringify(channelData.usersMessage);
    }

    if (channelData.voices) {
        channelData.voices = JSON.stringify(channelData.voices);
    }

    if (channelData.usersVoice) {
        channelData.usersVoice = JSON.stringify(channelData.usersVoice);
    }

    return channelData;
}

/**
 * Créé un utilisateur dans la base de données si il n'existe pas.
 * 
 * @param {import('discord.js').User} user - Utilisateur à rajouter.
 * @returns {boolean} success - `true` en cas de succès et `false` en cas d'erreur.
 */
async function createUserIfNotExists(user) {
    try {
        const id = user.id;
        const username = user.tag;
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 1024 });

        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);

        if (rows.length === 0) {
            await pool.execute(
                'INSERT INTO users (id) VALUES (?)',
                [id]
            );
        }

        return true;

    } catch (error) {
        console.error(`Impossible de créer un nouvel utilisateur :\n${error}`);
        return false;
    }
}

/**
 * Modifie les données de l'utilisateur dans la base de donnée.
 * Ne mets a jour que les champs définis dans `fieldsToUpdate`.
 * Remplace les données des champs indiqués.
 * 
 * @param {import('discord.js').User} user - Utilisateur dont les données sont modifiées. 
 * @param {Object} fieldsToUpdate - Les champs de l'utilisateur à modifier.
 * @returns {boolean} success - `true` en cas de succès et `false` en cas d'erreur.
 */
async function updateUser(user, fieldsToUpdate) {
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [user.id]);
        if (rows.length === 0) {
            const stack = new Error().stack.split("\n");
            console.error(`${getCaller()} L'utilisateur avec l'id ${user.id} n'existe pas.`);
            return false;
        }

        fieldsToUpdate = stringifyUserData(fieldsToUpdate)
        const fields = Object.keys(fieldsToUpdate);
        const values = [...Object.values(fieldsToUpdate), user.id];

        const setClause = fields.map(f => `${f} = ?`).join(', ');

        await pool.execute(
            `UPDATE users SET ${setClause} WHERE id = ?`,
            values
        );

        return true;
    } catch (error) {
        console.error(`Impossible de mettre à jour les données de l'utilisateur :\n${error}`);
        return false;
    }

}

/**
 * Récupère les données de l'utilisateur dans la base de donnée.
 * 
 * @param {import('discord.js').User} user - Utilisateur dont les données sont récupérées.
 * @returns {{
 *   id: string,
 *   messageCount: Number,
 *   voiceTime: Number,
 *   messageChannels: Object.<string, Number>,
 *   voiceChannels: Object.<string, Number>,
 *   messages: Array,
 *   voices: Array
 * } | null} userData - Les données de l'utilisateur ou `null` si il n'exsite pas. 
 */
async function getUser(user) {
    const id = user.id;
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);

    if (rows.length === 0) return null;

    const userData = parseUserData(rows[0]);

    return userData;
}

/**
 * Donne le classement de l'utilisateur dans le nombre de messages (en partant de 1).
 * 
 * @param {import('discord.js').User} user - Utilisateur dont le classement est à récupérer.
 * @returns {Number | null} rank - Le classement de l'utilisateur ou `null` en cas d'erreur. 
 */
async function userMessageRank(user) {
    const id = user.id;
    try {
        const [[result]] = await pool.execute(`
            SELECT COUNT(*) + 1 AS position
            FROM users
            WHERE messageCount > (
                SELECT messageCount FROM users WHERE id = ?
            )
        `, [id]);

        return result.position;
    } catch (error) {
        console.error(`${getCaller()} Impossible de récupérer le classement de l'utilisateur :\n${error}`);
        return null;
    }
}

/**
 * Donne le classement de l'utilisateur dans le temps de vocal (en partant de 1).
 * 
 * @param {import('discord.js').User} user - Utilisateur dont le classement est à récupérer.
 * @returns {Number | null} rank - Le classement de l'utilisateur ou `null` en cas d'erreur. 
 */
async function userVoiceRank(user) {
    const id = user.id;
    try {
        const [[result]] = await pool.execute(`
            SELECT COUNT(*) + 1 AS position
            FROM users
            WHERE voiceTime > (
                SELECT voiceTime FROM users WHERE id = ?
            )
        `, [id]);

        return result.position;
    } catch (error) {
        console.error(`${getCaller()} Impossible de récupérer le classement de l'utilisateur :\n${error}`);
        return null;
    }
}

/**
 * Renvoie le nombre de messages envoyés de `fromDate` à `toDate`.
 * 
 * @param {Object} userData - Les données de l'utilisateur.
 * @param {Date} fromDate - La date de départ.
 * @param {Date} toDate - La date d'arrivée.
 * @returns {Number} Count - Le nombre de messages envoyés.
 */
function getMessageCountFromTo(userData, fromDate, toDate = new Date()) {
    fromDate = fromDate.getTime();
    toDate = toDate.getTime();

    const messages = userData.messages;

    let count = 0
    for (const message of [...messages].reverse()) { // Parcourt messages du plus récent au plus ancien.
        if (message.date < fromDate) { // Si la date est avant fromDate
            break;
        }

        if (message.date > toDate) { // Si la date est après toDate
            continue;
        }

        count += 1;
    };

    return count;
}

/**
 * Renvoie le temps de vocal de `fromDate` à `toDate` en ms.
 * 
 * @param {Object} userData - Les données de l'utilisateur.
 * @param {Date} fromDate - La date de départ.
 * @param {Date} toDate - La date d'arrivée.
 * @returns {Number} Timestamp - Le temps de vocal.
 */
function getVoiceTimeFromTo(userData, fromDate, toDate = new Date()) {
    const from = fromDate.getTime();
    const to = toDate.getTime();

    let total = 0;

    for (const voice of [...userData.voices].reverse()) { // Parcours voices à l'envers.
        const start = voice.date; // Début du vocal.
        let end;

        if (voice.duration !== null) {
            end = start + voice.duration; // Fin du vocal.
        }
        else {
            end = Date.now();
        }

        // Pas d'intersection
        if (end <= from) break;

        if (start >= to) continue;

        // Intersection
        const overlapStart = start < from ? from : start;
        const overlapEnd = end > to ? to : end;

        total += overlapEnd - overlapStart;
    }

    return total;
}

/**
 * Créé un salon dans la base de données si il n'existe pas.
 * 
 * @param {import('discord.js').Channel} channel - Salon à rajouter.
 * @returns {boolean} success - `true` en cas de succès et `false` en cas d'erreur.
 */
async function createChannelIfNotExists(channel) {
    try {
        const id = channel.id;

        const [rows] = await pool.execute('SELECT * FROM channels WHERE id = ?', [id]);

        if (rows.length === 0) {
            if (!channel.isVoiceBased()) {
                await pool.execute(
                    'INSERT INTO channels (id) VALUES (?)',
                    [id]
                );
            }
            else {
                await pool.execute(
                    'INSERT INTO channels (id, textBased, totalVoice, usersVoice, voices) VALUES (?, ?, ?, ?, ?)',
                    [id, false, 0, '{}', '[]']
                );
            }
        }

        return true;

    } catch (error) {
        console.error(`Impossible de créer un nouveau salon :\n${error}`);
        return false;
    }
}

/**
 * Modifie les données du salon dans la base de donnée.
 * Ne mets a jour que les champs définis dans `fieldsToUpdate`.
 * Remplace les données des champs indiqués.
 * 
 * @param {import('discord.js').Channel} channel - Salon dont les données sont modifiées. 
 * @param {Object} fieldsToUpdate - Les champs du salon à modifier.
 * @returns {boolean} success - `true` en cas de succès et `false` en cas d'erreur.
 */
async function updateChannel(channel, fieldsToUpdate) {
    try {
        const [rows] = await pool.execute('SELECT * FROM channels WHERE id = ?', [channel.id]);
        if (rows.length === 0) {
            const stack = new Error().stack.split("\n");
            console.error(`${getCaller()} Le salon avec l'id ${channel.id} n'existe pas.`);
            return false;
        }

        fieldsToUpdate = stringifyChannelData(fieldsToUpdate)
        const fields = Object.keys(fieldsToUpdate);
        const values = [...Object.values(fieldsToUpdate), channel.id];

        const setClause = fields.map(f => `${f} = ?`).join(', ');

        await pool.execute(
            `UPDATE channels SET ${setClause} WHERE id = ?`,
            values
        );

        return true;
    } catch (error) {
        console.error(`${getCaller()} Impossible de mettre à jour les données du salon :\n${error}`);
        return false;
    }

}

/**
 * Récupère les données du salon dans la base de donnée.
 * 
 * @param {import('discord.js').Channel} channel - Salon dont les données sont récupérées.
 * @returns {{
 *   id: string,
 *   boost: Number,
 *   textBased: boolean,
 *   usersMessage: Object.<string, Number>,
 *   totalMessage: Number,
 *   usersVoice: Object.<string, Number> | null,
 *   totalVoice: Number | null,
 *   messages: Array,
 *   voices: Array | null
 * } | null} channelData - Les données du salon ou `null` si il n'exsite pas. 
 */
async function getChannel(channel) {
    const id = channel.id;
    const [rows] = await pool.execute("SELECT * FROM channels WHERE id = ?", [id]);

    if (rows.length === 0) return null;

    const channelData = parseChannelData(rows[0]);

    return channelData;
}

/**
 * Renvoie les données globales du serveur ou `null` en cas d'erreur.
 * 
 * @returns {{
 *   id: string,
 *   totalMessage: Number,
 *   totalVoice: Number,
 *   connectedUsers: Array
 * } | null} globalData - Les données globales du serveur. 
 */
async function getGlobal() {
    const [rows] = await pool.execute("SELECT * FROM global WHERE id = ?", [process.env.GUILDS]);

    if (rows.length === 0) {
        return null;
    }

    const globalData = parseGlobalData(rows[0]);

    return globalData;
}

/**
 * Met à jour les données du serveur.
 * 
 * @param {fieldsToUpdate} fieldsToUpdate - Les champs à mettre à jour (remplace les valeurs).
 * 
 * @returns {boolean} success - `true` en cas de succès et `false` en cas d'erreur.  
 */
async function updateGlobal(fieldsToUpdate) {
    try {
        fieldsToUpdate = stringifyGlobalData(fieldsToUpdate);
        const fields = Object.keys(fieldsToUpdate);
        const values = [...Object.values(fieldsToUpdate), process.env.GUILDS];

        const setClause = fields.map(f => `${f} = ?`).join(', ');

        await pool.execute(
            `UPDATE global SET ${setClause} WHERE id = ?`,
            values
        );

        return true;
    } catch (error) {
        console.error(`${getCaller()} Impossible de mettre a jour les données globales :\n${error}`);
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

    for (const userId of globalData.connectedUsers) {
        const member = await guild.members.fetch(userId);
        if (!member) {
            console.error("Le membre n'existe pas.");
            continue;
        }

        if (member.voice.channel) continue;
        const user = member.user;
        await createUserIfNotExists(user);

        const index = globalData.connectedUsers.indexOf(user.id);

        if (index !== -1) {
            globalFieldsToUpdate.connectedUsers = [...globalData.connectedUsers]
            globalFieldsToUpdate.connectedUsers.splice(index, 1);
        }

        const userData = await getUser(user);

        const now = Date.now();

        if (userData.voices.length > 0) {
            const lastVoice = userData.voices[userData.voices.length - 1];
            if (lastVoice.duration === null) {
                const oldChannel = await guild.channels.fetch(lastVoice.channel);

                await createChannelIfNotExists(oldChannel);
                const oldChannelData = await getChannel(oldChannel); 
                const duration = now - lastVoice.date;

                lastVoice.duration = duration;

                userData.voiceChannels[lastVoice.channel] =
                    (userData.voiceChannels[lastVoice.channel] ?? 0) + duration;

                userData.voiceTime += duration;

                globalData.totalVoice += duration;

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

    if (globalFieldsToUpdate.connectedUsers) {
        globalData.connectedUsers = [...globalFieldsToUpdate.connectedUsers];
    }

    for (const channel of channels.values()) {
        if (!channel.isVoiceBased()) continue;
        await createChannelIfNotExists(channel);
        const oldChannelData = await getChannel(channel); 
        for (const member of channel.members.values()) {
            const userFieldsToUpdate = {};

            const user = member.user;
            await createUserIfNotExists(user);

            const userData = await getUser(user);

            const now = Date.now();

            if (userData.voices.length > 0) {
                const lastVoice = userData.voices[userData.voices.length - 1];

                if (lastVoice.duration === null) {
                    const duration = now - lastVoice.date;

                    lastVoice.duration = duration;

                    userData.voiceChannels[lastVoice.channel] =
                        (userData.voiceChannels[lastVoice.channel] ?? 0) + duration;

                    userData.voiceTime += duration;

                    globalData.totalVoice += duration;

                    globalFieldsToUpdate.totalVoice = globalData.totalVoice;

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

                    userFieldsToUpdate.voiceChannels = userData.voiceChannels;
                    userFieldsToUpdate.voiceTime = userData.voiceTime;
                }
            }

            const Voice = {
                channel: channel.id,
                date: now,
                duration: null
            }

            if (globalData.connectedUsers.indexOf(user.id) === -1) {
                globalData.connectedUsers.push(user.id);
                globalFieldsToUpdate.connectedUsers = globalData.connectedUsers;
            }

            userData.voices.push(Voice);

            userFieldsToUpdate.voices = userData.voices;

            await updateUser(user, userFieldsToUpdate);
            await updateGlobal(globalFieldsToUpdate);
        };
    }
}

module.exports = {
    initializeDatabase,
    createUserIfNotExists,
    updateUser,
    getUser,
    userMessageRank,
    userVoiceRank,
    getMessageCountFromTo,
    getVoiceTimeFromTo,
    getGlobal,
    updateGlobal,
    createChannelIfNotExists,
    updateChannel,
    getChannel,
    checkAllVoices
}