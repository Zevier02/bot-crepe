const Discord = require("discord.js");
const Stats = require("../statsHandler");
const Time = require("../timeHandler")

module.exports = {
    name: "messageCreate",
    once: false,

    /**
     * @param {Discord.Message} message
     */
    async execute(message) {
        if (message.author.bot) return;

        const user = message.author;

        await Stats.createUserIfNotExists(user);

        const userData = await Stats.getUser(user);


        userData.messageCount += 1;

        const currentTime = Date.now();

        const Message = {
            channel: message.channelId,
            date: currentTime
        }

        userData.messages.push(Message);

        userData.messageChannels[message.channelId] =
            (userData.messageChannels[message.channelId] ?? 0) + 1;

        Stats.updateUser(user,
            {
                messageCount: userData.messageCount,
                messageChannels: userData.messageChannels,
                messages: userData.messages
            }
        );
    }
}