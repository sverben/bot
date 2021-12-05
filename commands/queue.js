const Discord = require("discord.js");

function execute(message, args, pool) {
    var embed = new Discord.MessageEmbed()
        .setColor("#238ae6")
        .setTitle("Queue")
        .setThumbnail("https://cdn.discordapp.com/avatars/916672082199326790/71edd3de9b9045606d6065ad3073d271.png?size=256")

    pool.query("SELECT * FROM queue WHERE server = ?", [message.guild.id], (err, res) => {
        for (var item in res) {
            item = res[item];
            item.info = JSON.parse(item.info);
            if (typeof item.info.name == "undefined") item.info.name = item.url;
            embed.addField(item.info.name, `*${item.url}*`);
        }

        message.channel.send(embed);
    })
}

module.exports = {
    name: "queue",
    execute
}
