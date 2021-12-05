const Discord = require("discord.js");

function execute(message, args) {
    var embed = new Discord.MessageEmbed()
        .setColor("#238ae6")
        .setTitle("Help")
        .addField("General", "`!help` Info on how to use commands for the bot\n`!about` Info about the bot")
        .addField("Music", "`!play` Add music to queue, with song name or url after command\n`!stop` Stop playing music\n`!queue` Display the queue")
        .setThumbnail("https://cdn.discordapp.com/avatars/916672082199326790/71edd3de9b9045606d6065ad3073d271.png?size=256")

    message.channel.send(embed);
}

module.exports = {
    name: "help",
    execute
}
