var Discord = require("discord.js");

async function execute(message, args, pool) {
    var voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        var embed = new Discord.MessageEmbed()
            .setColor("#2e8ae6")
            .setTitle("Music Player")
            .setDescription("You must be in the voice channel!")
        return message.channel.send(embed);
    }

    await voiceChannel.leave();
    var embed = new Discord.MessageEmbed()
        .setColor("#2e8ae6")
        .setTitle("Music Player")
        .setDescription("Left the channel");

    pool.query("DELETE FROM queue WHERE server = ?", [message.guild.id]);
    return message.channel.send(embed);
}

module.exports = {
    name: "stop",
    execute
}