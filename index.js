require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

const commands = require('./commands');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setStatus('Playing **Ur mom**')
        .then(console.log)
        .catch(console.error);
});

client.on('message', msg => {
    if (!msg.author.bot && msg.content[0] === '!') {
        let args = msg.content.substr(1).split(' ');
        let cmd = args.shift();

        if (commands[cmd]) {
            commands[cmd].func(args, msg);
        }
    }
});

client.login(process.env.DC_TOKEN);
