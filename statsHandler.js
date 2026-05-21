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

async function initializeDatabase() {
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
        id VARCHAR(32) PRIMARY KEY
        totalMessages BIGINT UNSIGNED NOT NULL DEFAULT 0,
        totalVoice BIGINT UNSIGNED NOT NULL DEFAULT 0)
    `);

    console.log("Database initialized.");
}

module.exports = {
    initializeDatabase
}