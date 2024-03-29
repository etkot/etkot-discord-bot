require('dotenv').config()
require('./mongoUtil').connectToServer(process.env.DB_NAME)

const Discord = require('discord.js')
const client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] })

const commands = require('./commands/_index')

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', (msg) => {
    if (!msg.author.bot && msg.content[0] === '!') {
        let args = msg.content.substr(1).split(' ')
        let cmd = args.shift().toLowerCase()

        if (commands[cmd]) {
            commands[cmd].func(args, msg)
        }
    }
})

client.login(process.env.DC_TOKEN)
