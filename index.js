require('dotenv').config()

const Discord = require('discord.js')
const client = new Discord.Client()

const commands = require('./commands/_index')

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', (msg) => {
    if (!msg.author.bot && msg.content[0] === '!') {
        let args = msg.content.substr(1).split(' ')
        let cmd = args.shift()

        if (commands[cmd]) {
            commands[cmd].func(args, msg)
        }
    }
})

client.login(process.env.DC_TOKEN)
