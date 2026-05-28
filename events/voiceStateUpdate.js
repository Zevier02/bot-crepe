const Discord = require("discord.js");

const vocalTimers = new Map();
const soloTimers = new Map();

const TARGET_VOICE_CHANNEL_ID = "1279820094847062087";
const VOICE_CHANNEL_ID = "1274312743372980244";

async function checkSolitude(channel) {
    const members = [...channel.members.values()];
    if (members.length === 1) {
        const member = members[0];

        if (soloTimers.has(member.id)) return;

        const timeout = setTimeout(async () => {
            try {
                if (member.voice.channelId === channel.id && channel.members.size === 1) {
                    await member.voice.setChannel(TARGET_VOICE_CHANNEL_ID);
                    await member.send({embeds: [new Discord.EmbedBuilder()
                        .setColor("Yellow")
                        .setDescription(`Tu es resté seul(e) pendant 1h dans le salon vocal <#${channel.id}>. Tu as été déplacé(e) automatiquement dans <#${TARGET_VOICE_CHANNEL_ID}>.`)]});
                }
            } catch (err) {
                console.error(`Erreur déplacement solo pour ${member.user.tag}`, err);
            } finally {
                soloTimers.delete(member.id);
            }
        }, 60 * 60 * 1000);

        soloTimers.set(member.id, timeout);
    } else {
        // Plusieurs membres dans le salon → annuler timers solo
        for (const member of members) {
            if (soloTimers.has(member.id)) {
                clearTimeout(soloTimers.get(member.id));
                soloTimers.delete(member.id);
            }
        }
    }
}

async function checkAllVoiceChannels(guild) {
    const voiceChannels = guild.channels.cache.filter(c =>
        c.type === 2 &&
        c.id !== TARGET_VOICE_CHANNEL_ID &&
        c.id !== VOICE_CHANNEL_ID
    );

    for (const channel of voiceChannels.values()) {
        await checkSolitude(channel);
    }
}

module.exports = {
    name: Discord.Events.VoiceStateUpdate,
    once: false,
    async execute(oldState, newState) {
        const member = newState.member;

        if (!newState.channelId) {
            clearTimeout(vocalTimers.get(member.id));
            clearTimeout(soloTimers.get(member.id));
            vocalTimers.delete(member.id);
            soloTimers.delete(member.id);
        }

        if (oldState.channelId === TARGET_VOICE_CHANNEL_ID && newState.channelId !== TARGET_VOICE_CHANNEL_ID) {
            clearTimeout(vocalTimers.get(member.id));
            vocalTimers.delete(member.id);
        }

        if (newState.channelId === TARGET_VOICE_CHANNEL_ID) {
            const timeout = setTimeout(async () => {
                if (member.voice.channelId === TARGET_VOICE_CHANNEL_ID) {
                    await member.voice.disconnect().catch(() => {});
                    await member.send({embeds: [new Discord.EmbedBuilder()
                        .setColor("Yellow")
                        .setDescription(`Tu es resté trop longtemps (1h) dans le salon vocal <#${TARGET_VOICE_CHANNEL_ID}>. Tu as été déconnecté automatiquement.`)]}).catch(() => {});
                }
                vocalTimers.delete(member.id);
            }, 60 * 60 * 1000);
            vocalTimers.set(member.id, timeout);
        }

        // Cette ligne clé : on check **tous** les salons vocaux à chaque changement
        if (newState.guild) {
            await checkAllVoiceChannels(newState.guild);
        }
    }
};