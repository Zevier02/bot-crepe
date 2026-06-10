const { pool, getCaller } = require("./db");

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
 * Renvoie l'identifiant et le temps de vocal de l'utilisateur ayant passé le plus de temps en vocal.
 * 
 * @returns {{
 *   id: string,
 *   voiceTime: Number
 * } | null} user - L'identifiant de l'utilisateur et son temps de vocal ou `null sinon`.
 */
async function getTopVoiceUser() {
    try {
        const [rows] = await pool.execute(`
            SELECT id, voiceTime
            FROM users
            ORDER BY voiceTime DESC
            LIMIT 1
        `);

        return rows[0] || null;
    } catch (error) {
        console.error(`${getCaller()} Impossible de récupérer le top utilisateur vocal :\n${error}`);
        return null;
    }
}

/**
 * Renvoie l'identifiant et le nombre de messages de l'utilisateur ayant envoyé le plus de messages.
 * 
 * @returns {{
 *   id: string,
 *   messageCount: Number
 * } | null} user - L'identifiant de l'utilisateur et le nombre de messages ou `null sinon`.
 */
async function getTopMessageUser() {
    try {
        const [rows] = await pool.execute(`
            SELECT id, messageCount
            FROM users
            ORDER BY messageCount DESC
            LIMIT 1
        `);

        return rows[0] || null;
    } catch (error) {
        console.error(`${getCaller()} Impossible de récupérer le top utilisateur textuel :\n${error}`);
        return null;
    }
}

/**
 * Renvoie l'identifiant et le temps de vocal du salon avec le plus de temps en vocal.
 * 
 * @returns {{
 *   id: string,
 *   totalVoice: Number
 * } | null} user - L'identifiant du salon et son temps de vocal ou `null sinon`.
 */
async function getTopVoiceChannel() {
    try {
        const [rows] = await pool.execute(`
            SELECT id, totalVoice
            FROM channels
            WHERE boost > 0
            ORDER BY totalVoice DESC
            LIMIT 1
        `);

        return rows[0] || null;
    } catch (error) {
        console.error(`${getCaller()} Impossible de récupérer le top salon vocal :\n${error}`);
        return null;
    }
}

/**
 * Renvoie l'identifiant et le nombre de messages du salon avec le plus de messages.
 * 
 * @returns {{
 *   id: string,
 *   totalMessage: Number
 * } | null} user - L'identifiant du salon et son nombre de messages ou `null sinon`.
 */
async function getTopMessageChannel() {
    try {
        const [rows] = await pool.execute(`
            SELECT id, totalMessage
            FROM channels
            WHERE boost > 0
            ORDER BY totalMessage DESC
            LIMIT 1
        `);

        return rows[0] || null;
    } catch (error) {
        console.error(`${getCaller()} Impossible de récupérer le top salon textuel :\n${error}`);
        return null;
    }
}

module.exports = {
    getGlobal,
    updateGlobal,
    getTopMessageUser,
    getTopVoiceUser,
    getTopMessageChannel,
    getTopVoiceChannel
}