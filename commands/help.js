const Discord = require("discord.js");

function help(message) {
    let embed = new Discord.MessageEmbed()
        .setColor("#238ae6")
        .setTitle("Help")
        .addField("General", "`!help` Info on how to use commands for the bot\n" +
            "`!about` Info about the bot")
        .addField("Music", "`!play` Add songs or playlists to queue\n" +
            "`!stop` Stop playing music\n" +
            "`!queue` Display the queue\n" +
            "`!radio` Play mp3 radio streams, stream url after command\n" +
            "`!next` Skip the current song\n" +
            "`!pause` Pause the music\n" +
            "`!resume` Resume playing")
        .setThumbnail("https://cdn.discordapp.com/avatars/916672082199326790/71edd3de9b9045606d6065ad3073d271.png?size=256")

    message.channel.send(embed);
}

module.exports = {
    help
}
