const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const Discord = require("discord.js");
const {MessageAttachment} = require("discord.js");

function sendMessage(channel, message, optionalImage) {
    if (typeof optionalImage == "undefined") optionalImage = null;

    var embed = new Discord.MessageEmbed()
        .setColor("#2e8ae6")
        .setTitle("Music Player")
        .setDescription(message)
        .setThumbnail(optionalImage)
    channel.send(embed);
}

async function startPlaying(connection, vc, server, pool) {
    pool.query("SELECT * FROM queue WHERE server = ?", [server], (err, res) => {
        pool.query("DELETE FROM queue WHERE server = ? LIMIT 1", [server]);
        if (res.length == 0) {
            vc.leave();
            return;
        }

        var stream = ytdl(res[0].url, {filter: 'audioonly'});
        res[0].info = JSON.parse(res[0].info);

        connection.play(stream, {seek: 0, volume: 0.5})
            .on("finish", () => {
                startPlaying(connection, vc, server, pool);
            })

        connection.voice.setSelfDeaf(true);
    })
}

async function execute(message, args, pool) {
    var voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return sendMessage(message.channel, "Join the voice channel to play music in first!");
    var permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT')) return sendMessage(message.channel("I must have permissions to connect to the vc!"));
    if (!permissions.has('SPEAK')) return sendMessage(message.channel("I must have permissions to talk"));
    if (!args.length) return sendMessage(message.channel("Send a keyword or url"));

    const validURL = (str) => {
        var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        if(!regex.test(str)) {
            return false;
        } else {
            return true;
        }
    }

    var connection = null;
    if (typeof message.guild.voice == "undefined") {
        connection = await voiceChannel.join();
    }

    if(validURL(args[0])) {

        pool.query("INSERT INTO queue SET url = ?, info = ?, server = ?", [args[0], "{'name': 'Your link'}", voiceChannel.guild.id], (err, res) => {
            if (connection != null) startPlaying(connection, voiceChannel, voiceChannel.guild.id, pool);
        });

        await sendMessage(message.channel, "Added ***Your Link*** to queue\n\n*You can stop playing and clear the queue by using !stop*");

        return
    }

    const videoFinder = async (query) => {
        const videoResult = await ytSearch(query);

        return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
    }

    const video = await videoFinder(args.join(' '));

    if(video) {
        pool.query("INSERT INTO queue SET url = ?, info = ?, server = ?", [video.url, JSON.stringify({name: video.title, image: `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`}), voiceChannel.guild.id], (err, res) => {
            if (connection != null) startPlaying(connection, voiceChannel, voiceChannel.guild.id, pool);
        });

        await sendMessage(message.channel, `Added ***${video.title}*** to queue\n\n*You can stop playing and clear the queue by using !stop*`, `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`);
    } else {
        sendMessage(message.channel, "I couldn't find your video, try using the url");
    }
}

module.exports = {
    name: 'play',
    execute
}