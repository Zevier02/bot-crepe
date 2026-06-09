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

module.exports = {
    getGlobal,
    updateGlobal
}