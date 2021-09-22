const Discord = require('discord.js')

let voiceConnection = undefined

// Helper functions

/**
 * Creates a new voice connection if it hasn't already been created
 * @param {Discord.VoiceChannel} channel - Voice channel to join
 * @returns {Promise<Discord.StreamDispatcher>}
 */
exports.start = (channel, stream, streamOptions) => {
    streamOptions = streamOptions || { seek: 0, volume: 0.3 }

    return new Promise((resolve, reject) => {
        if (!channel) {
            // No channel
            reject("You're not connected to a voice channel")
        } else if (voiceConnection && channel == voiceConnection.channel) {
            // Same channel

            if (stream) {
                if (voiceConnection.dispatcher) voiceConnection.dispatcher.emit('finish')

                resolve(voiceConnection.play(stream, streamOptions))
            } else {
                resolve(undefined)
            }
        } else if (voiceConnection) {
            // Different channel
            reject('You have to be in the same voice channel')
        } else {
            // No connection
            channel
                .join()
                .then((connection) => {
                    voiceConnection = connection

                    if (stream) {
                        resolve(voiceConnection.play(stream, streamOptions))
                    } else {
                        resolve(undefined)
                    }
                })
                .catch((err) => {
                    reject('Could not connect to your voice channel')
                })
        }
    })
}

exports.stop = () => {
    if (voiceConnection) {
        if (voiceConnection.dispatcher) voiceConnection.dispatcher.emit('finish')

        voiceConnection.client.user.setPresence({ status: 'online' }).catch(console.error)

        voiceConnection.disconnect()
        voiceConnection = undefined

        return true
    }

    return false
}

// Commands

exports.join = {
    help: 'Joins your voice channel',
    usage: '!join',
    aliases: ['connect'],
    /**
     * Flips a coin for the user
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        exports.start(msg.member.voice.channel).catch(msg.reply)
    },
}

exports.leave = {
    help: 'Disconnects the bot from your voice channel',
    usage: '!disconnect',
    aliases: ['disconnect', 'dc'],
    /**
     * Flips a coin for the user
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        if (!exports.stop()) msg.reply("I'm already disconnected")
    },
}
