const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const Discord = require("discord.js");
const Lyrics = require('song-lyrics-api');
const lyrics = new Lyrics();
const ytrend = require("yt-trending-scraper")

let streams = {};
let connections = {};
let playing = {};

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
            delete playing[vc.guild.id];
            return;
        }

        const stream = ytdl(res[0].url, {filter: 'audioonly'});
        streams[vc.guild.id] = stream;
        res[0].info = JSON.parse(res[0].info);
        playing[vc.guild.id] = res[0].info.name;

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

    const videoFinder = async (query) => {
        let videoResult = null;
        if (validURL(args[0])) {
            let urlParams = new URL(args[0]);
            if (urlParams.searchParams.get("list") != null) {
                const list = await ytSearch({listId: urlParams.searchParams.get("list")});
                if (!list) return null;

                let items = [];
                for (let video in list.videos ) {
                    video = list.videos[video];
                    items.push([`https://youtube.com/watch?v=${video.videoId}`, JSON.stringify({name: video.title, image: `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`}), voiceChannel.guild.id]);
                }

                return (items.length > 0) ? {title: list.title, items} : null;
            } else {
                if (urlParams.searchParams.get("v") == null) return;
                videoResult = {videos: [await ytSearch({videoId: urlParams.searchParams.get("v")})]};
            }
        } else if (args[0] === "trending") {
            const parameters = {
                geoLocation: typeof args[1] !== "undefined" ? args[1].toUpperCase() : "US",
                parseCreatorOnRise: false,
                page: 'music'
            }

            let trending = await ytrend.scrape_trending_page(parameters);
            let items = [];
            for (let video in trending) {
                video = trending[video];
                items.push([`https://youtube.com/watch?v=${video.videoId}`, JSON.stringify({name: video.title, image: `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`}), voiceChannel.guild.id]);
            }
            return {title: "Trending songs", items};
        }
        else videoResult = await ytSearch(query);

        return (videoResult.videos.length > 0) ? videoResult.videos[0] : null;
    }

    const video = await videoFinder(args.join(' '));

    if(video) {
        if (typeof video.items != "undefined") {
            pool.query("INSERT INTO queue (url, info, server) VALUES ?", [video.items], () => {
                if (connection != null) tasks.push({connection, vc: voiceChannel, server: voiceChannel.guild.id, pool});
            })

            await sendMessage(message.channel, `Added items in ***${video.title}*** to queue\n\n*You can stop playing and clear the queue by using !stop*`);

            return;
        }
        pool.query("INSERT INTO queue SET url = ?, info = ?, server = ?", [video.url, JSON.stringify({name: video.title, image: `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`}), voiceChannel.guild.id], () => {
            if (connection != null) tasks.push({connection, vc: voiceChannel, server: voiceChannel.guild.id, pool});
        });

        await sendMessage(message.channel, `Added ***${video.title}*** to queue\n\n*You can stop playing and clear the queue by using !stop*`, `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`);
    } else {
        sendMessage(message.channel, "I couldn't find your video or playlist");
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

function getLyrics(message, args) {
    if (typeof streams[message.guild.id] == "undefined" && !args.length) return sendMessage(message.channel, "Enter or play a song to search lyrics for!");
    const songName = (args.length > 0) ? args.join(" ") : playing[message.guild.id];

    lyrics.getLyrics(songName).then((response) => {
        return sendMessage(message.channel, `Lyrics for ***${response[0].title}*** by ***${response[0].artist}***\n\n${response[0].lyrics.lyrics}`);
    }).catch((error) => {
        let replyText = `Sorry, no lyrics were found for ***${songName}***.`;
        if (!args.length) replyText += "\nYou can try to get lyrics by using `!lyrics <song name>`";

        return sendMessage(message.channel, replyText);
    });
}

module.exports = {
    play,
    next,
    pause,
    resume,
    lyrics: getLyrics
}