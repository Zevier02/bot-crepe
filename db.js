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

module.exports = {
    pool,
    getCaller
}