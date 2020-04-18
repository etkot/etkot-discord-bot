const Discord = require('discord.js');
const Voice = require('./voice');

const https = require('https');
const Readable = require('stream').Readable;
const io = require('socket.io-client');


exports.wappu = {
    help: 'Plays wappuradio on your voice channel',
    usage: '!wappu',
    aliases: ['w'],
    /**
     * Plays wappuradio on your voice channel
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        const stream = new Readable();
        stream._read = () => {};

        Voice.start(msg.member.voice.channel, stream)
            .then(dispatcher => {
                https.get('https://stream.wappuradio.fi/wappuradio.opus', (res) => {
                    if (res.headers['content-type'] === 'application/ogg') {
                        const socket = io('https://wappuradio.fi/');
                        socket.on('np', (song => {
                            msg.client.user.setPresence({ activity: { name: song.song, type: 'LISTENING', url: 'https://wappuradio.fi/' }, status: 'online' })
                                .catch(console.error);
                        }));

                        dispatcher.on("finish", () => {
                            res.destroy();
                            socket.close();
                        });

                        res.on('data', (chunk) => {
                            stream.push(chunk);
                        });
        
                        res.on('end', () => {
                            
                        });
                    } else {
                        msg.reply('Wappuradio not found :(');
                        console.log('Wrong wappuradio url');
                    }
                });

                dispatcher.on('error', (err) => {
                    console.error('ERROR:', err);
                });
            })
            .catch(msg.reply);
    }
}
