const { createUserStats } = require("./userStats");
const { createChannelStats } = require("./channelStats");
const { createServerStats } = require("./serverStats")

module.exports = {
    createUserStats,
    createChannelStats,
    createServerStats
}