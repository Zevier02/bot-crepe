const Config = require("../config.json");
const Discord = require("discord.js");
const Stats = require("../statsHandler")

module.exports = {
    name: "messageCreate",
    once: false,

    /**
     * @param {import('discord.js').Message} message
     */
    async execute(message) {
        if (message.author.bot) return;
        
        const user = message.author;

        await Stats.createUserIfNotExists(user);

        const userData = await Stats.getUser(user);

        userData.messageCount += 1n

        userData.messageChannels[message.channelId] =
            (userData.messageChannels[message.channelId] ?? 0) + 1;

        Stats.updateUser(user,
            {
                messageCount: userData.messageCount,
                messageChannels: userData.messageChannels
            }
        );
    }
}