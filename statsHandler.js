const mysql = require('mysql2/promise');

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
            username VARCHAR(100) NOT NULL,
            avatarURL TEXT NOT NULL,
            messageCount BIGINT UNSIGNED NOT NULL DEFAULT 0,
            voiceTime BIGINT UNSIGNED NOT NULL DEFAULT 0,
            messageChannels JSON NOT NULL DEFAULT '{}',
            voiceChannels JSON NOT NULL DEFAULT '{}')
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS channels (
            id VARCHAR(32) PRIMARY KEY,
            boost FLOAT DEFAULT 1,
            textBased BOOLEAN NOT NULL DEFAULT FALSE,
            usersMessages JSON NOT NULL DEFAULT '{}',
            totalMessages BIGINT UNSIGNED NOT NULL DEFAULT 0,
            usersVoice JSON DEFAULT NULL,
            totalVoice BIGINT DEFAULT NULL)
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS global (
            id VARCHAR(32) PRIMARY KEY,
            totalMessages BIGINT UNSIGNED NOT NULL DEFAULT 0,
            totalVoice BIGINT UNSIGNED NOT NULL DEFAULT 0),
            connectedUsers JSON NOT NULL DEFAULT '[]')
        `);

        console.log(getCaller() + " Database initialized.");

        return true;
    } catch(error) {
        console.error(`Impossible d'initialiser la Base de donnée :\n${error}`);
        return false;
    }
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

        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);

        if (rows.length === 0) {
            const username = user.tag;
            const avatarURL = user.displayAvatarURL({ extension: 'png', size: 1024 });

            await pool.execute(
                'INSERT INTO users (id, username, avatarURL) VALUES (?, ?, ?)',
                [id, username, avatarURL]
            );

            return true;
        }
    } catch(error) {
        console.error(`Impossible de créer un nouvel utilisateur :\n${error}`);
        return false;
    }
}

function parseStringToBigint(object) {
    for (const key in object) {
        const value = object[key];

        if (typeof value === "string" && /^\d+$/.test(value)) {
            object[key] = BigInt(value);
        }
    }

    return object;
}

function parseBigintToString(object) {
    for (const key in object) {
        const value = object[key];

        if (typeof value === "bigint") {
            object[key] = value.toString();
        }
    }

    return object;
}

function parseUserData(userData){
    let messageChannels = JSON.parse(userData.messageChannels);
    messageChannels = parseStringToBigint(messageChannels);
    userData.messageChannels = messageChannels;

    let voiceChannels = JSON.parse(userData.voiceChannels);
    voiceChannels = parseStringToBigint(voiceChannels);
    userData.voiceChannels = voiceChannels;

    userData.messageCount = BigInt(userData.messageCount);
    userData.voiceTime = BigInt(userData.voiceTime);

    return userData;
}

function stringifyUserData(userData){
    if(userData.messageChannels != null){
        let messageChannels = parseBigintToString(userData.messageChannels);
        messageChannels = JSON.stringify(messageChannels);
        userData.messageChannels = messageChannels;
    }
    
    if(userData.voiceChannels != null){
        let voiceChannels = parseBigintToString(userData.voiceChannels);
        voiceChannels = JSON.stringify(voiceChannels);
        userData.voiceChannels = voiceChannels;
    }

    if(userData.messageCount != null)
        userData.messageCount = userData.messageCount.toString()

    if(userData.voiceTime != null)
        userData.voiceTime = userData.voiceTime.toString()

    return userData;
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
async function updateUser(user, fieldsToUpdate){
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

        await pool.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return true;
    } catch(error) {
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
 *   messageCount: bigint,
 *   voiceTime: bigint,
 *   username: string,
 *   avatarURL: string,
 *   messageChannels: Object.<string, bigint>,
 *   voiceChannels: Object.<string, bigint>
 * } | null} userData - Les données de l'utilisateur ou `null` si il n'exsite pas. 
 */
async function getUser(user){
    const id = user.id;
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);

    if(rows.length === 0) return null;

    const userData = parseUserData(rows[0]);

    return userData;
}

module.exports = {
    initializeDatabase,
    createUserIfNotExists,
    updateUser,
    getUser
}