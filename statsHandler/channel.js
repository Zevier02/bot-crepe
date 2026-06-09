const { pool, getCaller } = require("./db");

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
 * Donne le classement du salon selon son temps de vocal (en partant de 1).
 * 
 * @param {import('discord.js').Channel} channel - Salon dont le classement est à récupérer.
 * @returns {Number | null} rank - Le classement du salon ou `null` en cas d'erreur. 
 */
async function channelVoiceRank(channel) {
    const id = channel.id;
    try {
        if(!channel.isVoiceBased()){
            console.error(`${getCaller()} Impossible de récupérer le classement vocal d'un salon textuel`);
            return null;
        }

        const [[result]] = await pool.execute(`
            SELECT COUNT(*) + 1 AS position
            FROM channels
            WHERE totalVoice > (
                SELECT totalVoice FROM channels WHERE id = ?
            )
        `, [id]);

        return result.position;
    } catch (error) {
        console.error(`${getCaller()} Impossible de récupérer le classement vocal du salon :\n${error}`);
        return null;
    }
}

/**
 * Donne le classement du salon selon son nombre de messages (en partant de 1).
 * 
 * @param {import('discord.js').Channel} channel - Salon dont le classement est à récupérer.
 * @returns {Number | null} rank - Le classement du salon ou `null` en cas d'erreur. 
 */
async function channelMessageRank(channel) {
    const id = channel.id;
    try {
        const [[result]] = await pool.execute(`
            SELECT COUNT(*) + 1 AS position
            FROM channels
            WHERE totalMessage > (
                SELECT totalMessage FROM channels WHERE id = ?
            )
        `, [id]);

        return result.position;
    } catch (error) {
        console.error(`${getCaller()} Impossible de récupérer le classement textuel du salon :\n${error}`);
        return null;
    }
}

/**
 * Renvoie le nombre de messages envoyés de `fromDate` à `toDate`.
 * 
 * @param {Object} channelData - Les données du salon.
 * @param {Date} fromDate - La date de départ.
 * @param {Date} toDate - La date d'arrivée.
 * @returns {Number} Count - Le nombre de messages envoyés.
 */
function getChannelMessageCountFromTo(channelData, fromDate, toDate = new Date()) {
    fromDate = fromDate.getTime();
    toDate = toDate.getTime();

    const messages = channelData.messages;

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
 * Renvoie le temps de vocal de `fromDate` à `toDate` en ms (ne compte pas les appels en cours).
 * 
 * @param {Object} channelData - Les données du salon.
 * @param {Date} fromDate - La date de départ.
 * @param {Date} toDate - La date d'arrivée.
 * @returns {Number} Timestamp - Le temps de vocal.
 */
function getChannelVoiceTimeFromTo(channelData, fromDate, toDate = new Date()) {
    if(channelData.textBased){
        throw new Error(`${getCaller()} Impossible de récupérer le temps de vocal d'un salon textuel.`);
    }

    const from = fromDate.getTime();
    const to = toDate.getTime();

    let total = 0;

    for (const voice of [...channelData.voices].reverse()) { // Parcours voices à l'envers.
        const start = voice.date; // Début du vocal.
        let end = start + voice.duration; // Fin du vocal.

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
 * Renvoie le nombre d'utilisateurs ayant envoyé des messages dans le salon de `fromDate` à `toDate`.
 * 
 * @param {Object} channelData - Les données du salon.
 * @param {Date} fromDate - La date de départ.
 * @param {Date} toDate - La date d'arrivée.
 * @returns {Number} Count - Le nombre de contributeurs.
 */
function getChannelMessageContributorsFromTo(channelData, fromDate, toDate = new Date()) {
    fromDate = fromDate.getTime();
    toDate = toDate.getTime();

    const messages = channelData.messages;

    let count = 0;
    const contributors = {};

    for (const message of [...messages].reverse()) { // Parcourt messages du plus récent au plus ancien.
        if (message.date < fromDate) { // Si la date est avant fromDate
            break;
        }

        if (message.date > toDate) { // Si la date est après toDate
            continue;
        }

        if(!contributors[message.user]){
            contributors[message.user] = true;
            count += 1;
        }
    };

    return count;
}

/**
 * Renvoie le nombre d'utilisateurs ayant participé à un vocal de `fromDate` à `toDate` (ne compte pas les appels en cours).
 * 
 * @param {Object} channelData - Les données du salon.
 * @param {Date} fromDate - La date de départ.
 * @param {Date} toDate - La date d'arrivée.
 * @returns {Number} Count - Le nombre de contributeurs.
 */
function getChannelVoiceContributorsFromTo(channelData, fromDate, toDate = new Date()) {
    const from = fromDate.getTime();
    const to = toDate.getTime();

    let count = 0;
    const contributors = {};

    for (const voice of [...channelData.voices].reverse()) { // Parcours voices à l'envers.
        const start = voice.date; // Début du vocal.
        let end = start + voice.duration; // Fin du vocal.

        // Pas d'intersection
        if (end <= from) break;

        if (start >= to) continue;

        // Intersection
        if(!contributors[voice.user]){
            contributors[voice.user] = true;
            count += 1;
        }
    }

    return count;
}

module.exports = {
    createChannelIfNotExists,
    updateChannel,
    getChannel,
    channelVoiceRank,
    channelMessageRank,
    getChannelMessageCountFromTo,
    getChannelVoiceTimeFromTo,
    getChannelMessageContributorsFromTo,
    getChannelVoiceContributorsFromTo
}