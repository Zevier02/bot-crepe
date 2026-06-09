const { pool, getCaller } = require("./db");

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
function getUserMessageCountFromTo(userData, fromDate, toDate = new Date()) {
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
function getUserVoiceTimeFromTo(userData, fromDate, toDate = new Date()) {
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

module.exports = {
    createUserIfNotExists,
    updateUser,
    getUser,
    userMessageRank,
    userVoiceRank,
    getUserMessageCountFromTo,
    getUserVoiceTimeFromTo
}