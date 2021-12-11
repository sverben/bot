var Discord = require("discord.js");

function sendMessage(channel, message, optionalImage) {
    if (typeof optionalImage == "undefined") optionalImage = null;

    var embed = new Discord.MessageEmbed()
        .setColor("#2e8ae6")
        .setTitle("Music Player")
        .setDescription(message);
    channel.send(embed);
}

async function stop(message, args, pool) {
    var voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        var embed = new Discord.MessageEmbed()
            .setColor("#2e8ae6")
            .setTitle("Music Player")
            .setDescription("You must be in the voice channel!")
        return message.channel.send(embed);
    }

    if (typeof message.guild.voice == "undefined" || message.guild.voice.channelID == null) {
        return sendMessage(message.channel, "I am not in that channel!");
    }
    if (voiceChannel.id !== message.guild.voice.channelID) {
        return sendMessage(message.channel, "I am not in that channel!")
    }

    await voiceChannel.leave();
    var embed = new Discord.MessageEmbed()
        .setColor("#2e8ae6")
        .setTitle("Music Player")
        .setThumbnail("https://media.discordapp.net/attachments/862414765300383767/917699238417268776/Rectangle_1.png")
        .setDescription("Left the channel");

    pool.query("DELETE FROM queue WHERE server = ?", [message.guild.id]);
    return message.channel.send(embed);
}

module.exports = {
    stop
}