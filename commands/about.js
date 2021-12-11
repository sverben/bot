const Discord = require("discord.js");

function about(message) {
    var embed = new Discord.MessageEmbed()
        .setColor("#238ae6")
        .setTitle("About")
        .setDescription("Discord music bot created as alternative to Groovy")
        .addField("Open source", "View the source code on https://github.com/sverben/bot")
        .setThumbnail("https://cdn.discordapp.com/avatars/916672082199326790/71edd3de9b9045606d6065ad3073d271.png?size=256")

    message.channel.send(embed);
}

module.exports = {
    about
}
