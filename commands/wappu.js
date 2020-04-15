const https = require('https');
const Readable = require('stream').Readable;

exports.wappu = {
    help: 'Plays wappuradio on your voice channel',
    usage: '!wappu',
    aliases: ['w'],
    /**
     * Flips a coin for the user
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        if (msg.client.voiceConnection && client.voiceConnections.get(msg.guild.id) !== undefined) {
            msg.reply("I'm already playing wappuradio");
        } else if (msg.member.voice.channel === undefined) {
            msg.reply("You aren't on a voice channel");
        } else {
            msg.member.voice.channel.join()
            .then(connection => {			
                https.get('https://stream.wappuradio.fi/wappuradio.opus', (res) => {
                    if (res.headers['content-type'] === 'application/ogg') {
                        const stream = new Readable();
                        stream._read = () => {};
    
                        const streamOptions = { seek: 0, volume: 0.1 };
                        const dispatcher = connection.play(stream, streamOptions);
    
                        res.on('data', (chunk) => {
                            stream.push(chunk);
                        });
    
                        res.on('end', () => {
                            console.log('Connection closed');
                            connection.disconnect();
                        });
                    } else {
                        msg.reply('Wappuradio not found :(');
                        console.log('Wrong wappuradio url');
                    }
                });
            })
            .catch(console.error);
        }
    }
}

exports.disconnect = {
    help: 'Disconnects the bot from your voice channel',
    usage: '!disconnect',
    aliases: ['dc'],
    /**
     * Flips a coin for the user
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        if (!msg.client.voiceConnections || msg.client.voiceConnections.get(msg.guild.id) === undefined) {
            msg.reply("I'm not in a voice channel");
        } else {
            client.voiceConnections.get(msg.guild.id).disconnect();
        }
    }
}
