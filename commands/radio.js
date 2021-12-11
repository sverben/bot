const Discord = require("discord.js");

function sendMessage(channel, message) {
    var embed = new Discord.MessageEmbed()
        .setColor("#2e8ae6")
        .setTitle("Radio Player")
        .setDescription(message)
        .setThumbnail("https://media.discordapp.net/attachments/862414765300383767/917482294451785778/Rectangle_1.png")
    channel.send(embed);
}

async function radio(message, args) {
    var voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return sendMessage(message.channel, "Join the voice channel to play radio in first!");
    var permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT')) return sendMessage(message.channel, "I must have permissions to connect to the vc!");
    if (!permissions.has('SPEAK')) return sendMessage(message.channel, "I must have permissions to talk");
    if (!args.length) return sendMessage(message.channel, "Send a stream url");

    const validURL = (str) => {
        var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%\-\/]))?/;
        return regex.test(str);
    }

    if (!validURL(args[0])) return sendMessage(message.channel, "Invalid url, please provide a stream url!");

    var connection = await voiceChannel.join();
    connection.play(args[0]);

    sendMessage(message.channel, "Listening to radio!\n\n*Stop playing by using !stop*");
}

module.exports = {
    radio
}