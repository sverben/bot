const Discord = require("discord.js");

function queue(message, args, pool) {
    let embed = new Discord.MessageEmbed()
        .setColor("#238ae6")
        .setTitle("Queue")
        .setThumbnail("https://cdn.discordapp.com/avatars/916672082199326790/71edd3de9b9045606d6065ad3073d271.png?size=256")

    pool.query("SELECT * FROM queue WHERE server = ?", [message.guild.id], (err, res) => {
        if (res.length === 0) {
            embed.setDescription("No songs in queue");
        }

        for (let item in res) {
            item = res[item];
            item.info = JSON.parse(item.info);
            if (typeof item.info.name == "undefined") item.info.name = item.url;
            embed.addField(item.info.name, `*${item.url}*`);
        }

        message.channel.send(embed);
    })
}

module.exports = {
    queue
}
