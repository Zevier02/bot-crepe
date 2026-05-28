const Config = require("./config.json");

const Discord = require(Config.discordjs)
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: Config.db.host,
    user: Config.db.user,
    port: Config.db.port,
    password: Config.db.password,
    database: Config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    supportBigNumbers: true,
    bigNumberStrings: false
});

/**
 * Initialise la base de données.
 * @returns {boolean} `true` en cas de succès et `false` en cas d'erreur.
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

        console.log("Database initialized.");

        return true;
    } catch(error) {
        console.error(`Impossible d'initialiser la Base de donnée :\n${error}`);
        return false;
    }
}

/**
 * Créé un utilisateur si il n'existe pas.
 * @param {import('discord.js').User} user - Utilisateur à rajouter.
 * @returns {boolean} `true` en cas de succès et `false` en cas d'erreur.
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

module.exports = {
    initializeDatabase
}