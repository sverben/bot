const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const Discord = require("discord.js");
const {MessageAttachment} = require("discord.js");

function sendMessage(channel, message, optionalImage) {
    if (typeof optionalImage == "undefined") optionalImage = null;

    var embed = new Discord.MessageEmbed()
        .setColor("#2e8ae6")
        .setTitle("Radio Player")
        .setDescription(message)
        .setThumbnail(optionalImage)
    channel.send(embed);
}

async function execute(message, args, pool) {
    var voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return sendMessage(message.channel, "Join the voice channel to play radio in first!");
    var permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT')) return sendMessage(message.channel("I must have permissions to connect to the vc!"));
    if (!permissions.has('SPEAK')) return sendMessage(message.channel("I must have permissions to talk"));
    if (!args.length) return sendMessage(message.channel("Send a stream url"));

    const validURL = (str) => {
        var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        if(!regex.test(str)) {
            return false;
        } else {
            return true;
        }
    }

    if (!validURL(args[0])) return sendMessage(message.channel, "Invalid url, please provide a stream url!");

    var connection = await voiceChannel.join();
    connection.play(args[0]);

    sendMessage(message.channel, "Listening to radio!\n\n*Stop playing by using !stop*");
}

module.exports = {
    name: 'radio',
    execute
}