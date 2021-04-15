const Discord = require('discord.js')

let coinFlips = {}

exports.flip = {
    help: 'Flips a coin for you',
    usage: '!flip <heads/tails>',
    aliases: ['f', '(╯°□°）╯︵ ┻━┻'],
    /**
     * Flips a coin for the user
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        if (coinFlips[msg.author] && new Date() - coinFlips[msg.author].time < 30 * 60 * 1000) {
            let diff = 30 * 60 * 1000 - (new Date() - coinFlips[msg.author].time)
            let min = Math.floor(diff / (60 * 1000))
            let sec = Math.floor((diff - min * 60 * 1000) / 1000)

            msg.reply(
                `You already flipped a coin and have to wait ${min} minutes and ${sec} seconds\nYou guessed **${
                    coinFlips[msg.author].guess === 0 ? 'heads' : 'tails'
                }** and got **${coinFlips[msg.author].result === 0 ? 'heads' : 'tails'}**`
            ).catch(console.error)

            return
        }

        if (args[0] !== undefined) args[0] = args[0].toLocaleLowerCase()
        if (args[0] === 'h' || args[0] === '0') args[0] = 'heads'
        if (args[0] === 't' || args[0] === '1') args[0] = 'tails'

        if (args[0] === undefined || (args[0] !== 'heads' && args[0] !== 'tails')) {
            msg.reply(`You have to also guess **heads** or **tails**\n!flip <heads/tails>`).catch(console.error)

            return
        }

        let guess = args[0] === 'heads' ? 0 : 1

        coinFlips[msg.author] = {
            time: new Date(),
            guess: guess,
            result: -1,
        }

        msg.reply('Flipping coin...')
            .then((message) => {
                setTimeout(() => {
                    let rnd = Math.floor(Math.random() * 2)
                    message.edit(
                        `${msg.author}, You got **${rnd === 0 ? 'heads' : 'tails'}**! ${
                            rnd === guess
                                ? 'You can leave if you want to'
                                : 'You have to spend another 30 minutes on the computer'
                        }`
                    )

                    coinFlips[msg.author].result = rnd
                }, 1000)
            })
            .catch(console.error)
    },
}
