const Discord = require("discord.js");
const Stats = require("../statsHandler")

module.exports = {
    name: Discord.Events.VoiceStateUpdate,
    once: false,

    /**
     * @param {import('discord.js').VoiceState} oldState
     * @param {import('discord.js').VoiceState} newState
     */
    async execute(oldState, newState) {
        const member = newState.member;
        const user = member.user;

        await Stats.createUserIfNotExists(user)

        if(!oldState.channel && newState.channel){ // Vient de rejoindre un salon.
            const userData = await Stats.getUser(user);
        }
    }
};