const { pool, getCaller } = require("../db");

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

module.exports = {
    createChannelIfNotExists,
    updateChannel,
    getChannel
}