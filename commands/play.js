const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const Discord = require("discord.js");

let streams = {};
let connections = {};

let tasks = [];

function sendMessage(channel, message, optionalImage) {
    if (typeof optionalImage == "undefined") optionalImage = null;

    let embed = new Discord.MessageEmbed()
        .setColor("#2e8ae6")
        .setTitle("Music Player")
        .setDescription(message)
        .setThumbnail(optionalImage)
    channel.send(embed);
}

async function handleTask() {
    if (tasks.length === 0) return;
    let task = tasks[0];

    await startPlaying(task.connection, task.vc, task.server, task.pool);

    return;
}

async function handleTasks() {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 1));

        await handleTask();
        tasks.shift();
    }
}
handleTasks();

async function startPlaying(connection, vc, server, pool) {
    pool.query("SELECT * FROM queue WHERE server = ?", [server], (err, res) => {
        pool.query("DELETE FROM queue WHERE server = ? LIMIT 1", [server]);
        if (res.length === 0) {
            vc.leave();
            return;
        }

        const stream = ytdl(res[0].url, {filter: 'audioonly'});
        streams[vc.guild.id] = stream;
        res[0].info = JSON.parse(res[0].info);

        connections[vc.guild.id] = connection.play(stream, {seek: 0, volume: 0.5})
            .on("finish", () => {
                tasks.push({connection, vc, server, pool});
            })

        connection.voice.setSelfDeaf(true);
    })
}

function next(message) {
    if (typeof streams[message.guild.id] == "undefined") return sendMessage(message.channel, "I am not playing music!");
    connections[message.guild.id].end();

    sendMessage(message.channel, "Skipped!");
}

async function play(message, args, pool) {
    let voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return sendMessage(message.channel, "Join the voice channel to play music in first!");
    let permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT')) return sendMessage(message.channel, "I must have permissions to connect to the vc!");
    if (!permissions.has('SPEAK')) return sendMessage(message.channel, "I must have permissions to talk");
    if (!args.length) return sendMessage(message.channel, "Send a keyword or url");

    const validURL = (str) => {
        let regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%\-\/]))?/;
        return regex.test(str);
    }

    let connection = null;
    if (typeof message.guild.voice == "undefined" || message.guild.voice.channelID == null) {
        connection = await voiceChannel.join();
    }

    if(validURL(args[0])) {

        pool.query("INSERT INTO queue SET url = ?, info = ?, server = ?", [args[0], "{'name': 'Your link'}", voiceChannel.guild.id], () => {
            if (connection != null) tasks.push({connection, vc: voiceChannel, server: voiceChannel.guild.id, pool});
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
        pool.query("INSERT INTO queue SET url = ?, info = ?, server = ?", [video.url, JSON.stringify({name: video.title, image: `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`}), voiceChannel.guild.id], () => {
            if (connection != null) tasks.push({connection, vc: voiceChannel, server: voiceChannel.guild.id, pool});
        });

        await sendMessage(message.channel, `Added ***${video.title}*** to queue\n\n*You can stop playing and clear the queue by using !stop*`, `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`);
    } else {
        sendMessage(message.channel, "I couldn't find your video, try using the url");
    }
}

function pause(message) {
    if (typeof streams[message.guild.id] == "undefined") return sendMessage(message.channel, "Not playing music!");
    connections[message.guild.id].pause();
    return sendMessage(message.channel, "Paused music");
}

function resume(message) {
    if (typeof streams[message.guild.id] == "undefined") return sendMessage(message.channel, "Not playing music!");
    connections[message.guild.id].resume();
    return sendMessage(message.channel, "Resumed playing");
}

module.exports = {
    play,
    next,
    pause,
    resume
}