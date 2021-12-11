const Discord = require("discord.js");
const {readdirSync} = require("fs");
const mysql = require("mysql2");

var PREFIX = "!";
var TOKEN = process.env.token;

var client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_VOICE_STATES"]});

client.commands = new Discord.Collection();

const commandFiles = readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const commandFile = require(`./commands/${file}`);

    for (let command in commandFile) {
        client.commands.set(command, commandFile[command]);
    }
}

var pool  = mysql.createPool({
    connectionLimit : 10,
    host            : process.env["mysqlhost"] || 'localhost',
    user            : process.env["mysqluser"],
    password        : process.env["mysqlpassword"],
    database        : process.env["mysqldatabase"]
});
pool.query("DELETE FROM queue");

client.once("ready", () => {
    console.log("Bot online!");
    client.user.setActivity("music!", {
        type: "LISTENING"
    })
})

client.on("message", message => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    var args = message.content.slice(PREFIX.length).split(/ +/);
    var command = args.shift().toLowerCase();

    if (client.commands.has(command)) {
        client.commands.get(command)(message, args, pool, client);
    }
})

client.on('voiceStateUpdate', (oldState) => {
    var channel = oldState.channel;
    if (channel == null) return;

    if(oldState.channel.members.size === 1) {
        oldState.channel.leave();
    }
});

client.login(TOKEN);