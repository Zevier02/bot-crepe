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
        await Stats.createChannelIfNotExists(message.channel);

        const globalData = await Stats.getGlobal();
        const channelData = await Stats.getChannel(message.channel);
        const userData = await Stats.getUser(user);
        

        globalData.totalMessage += 1;
        channelData.totalMessage += 1;
        userData.messageCount += 1;

        channelData.usersMessage[user.id] =
            (channelData.usersMessage[user.id] ?? 0) + 1;

        const currentTime = Date.now();

        const Message = {
            channel: message.channelId,
            date: currentTime
        }

        const ChannelMessage = {
            user: message.member.user,
            date: currentTime
        }

        channelData.messages.push(ChannelMessage);

        userData.messages.push(Message);

        userData.messageChannels[message.channelId] =
            (userData.messageChannels[message.channelId] ?? 0) + 1;

        await Stats.updateGlobal({totalMessage: globalData.totalMessage});

        await Stats.updateChannel(message.channel, {
            messages: channelData.messages,
            usersMessage: channelData.usersMessage,
            totalMessage: channelData.totalMessage
        });

        await Stats.updateUser(user,
            {
                messageCount: userData.messageCount,
                messageChannels: userData.messageChannels,
                messages: userData.messages
            }
        );
    }
}