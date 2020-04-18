const Discord = require('discord.js');
const Voice = require('./voice');

const ytdl = require('ytdl-core');
const fs = require('fs');


let voiceChannel = undefined;
let stream = undefined;
let currentDispatcher = undefined;

let playing = undefined;
let playingTimeout = undefined;
let paused = false;
let queue = [];
let loop = false;

const SecToTime = totalSeconds => {
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    return `${hours > 0 ? (hours < 10 ? `0${hours}:` : `${hours}:`) : ''}${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}


const SetPresence = song => {
    song.text_channel.client.user.setPresence({ activity: { name: song.title, type: 'LISTENING' }, status: 'online' })
        .catch(console.error);
}


const SendNowPlaying = (song, channel) => {
    channel = channel || song.text_channel;

    channel.send(
        new Discord.MessageEmbed()
            .setColor('#00cc00')
            .setTitle(song.title)
            .setURL(song.url)
            .setAuthor('Now playing', song.member_avatar)
            .setThumbnail(song.thumbnail_url)
            .addFields(
                { name: 'Channel', value: song.author, inline: true },
                { name: 'Song Duration', value: SecToTime(song.length), inline: true },
            )
    ).catch(console.error);
}

const SendAddedToQueue = (song, channel) => {
    channel = channel || song.text_channel;
    
    channel.send(
        new Discord.MessageEmbed()
            .setColor('#00cc00')
            .setTitle(song.title)
            .setURL(song.url)
            .setAuthor('Queued', song.member_avatar)
            .setThumbnail(song.thumbnail_url)
            .addFields(
                { name: 'Channel', value: song.author, inline: true },
                { name: 'Song Duration', value: SecToTime(song.length), inline: true },
            )
    ).catch(console.error);
}

const SendQueue = channel => {
    let str = `Now Playing:\n`;
    if (playing) {
        str += `[${playing.title}](${playing.url})`;
    }
    else {
        str += 'Nothing'
    }

    str += '\n\nQueue:\n';

    let totalLenght = 0;
    for (let i in queue)
    {
        if (i < 10)
            str += `${Number(i) + 1}. [${queue[i].title}](${queue[i].url})\n`;
        
        totalLenght += queue[i].length;
    }

    str += '\n';
    str += `${queue.length} songs in queue (${SecToTime(totalLenght)})`;

    channel.send(
        new Discord.MessageEmbed()
            .setColor('#00cc00')
            .setTitle('Queue')
            .setDescription(str)
    ).catch(console.error);
}



const GetLink = search => {
    if (ytdl.validateURL(search)) {
        return search;
    }
}

const GetSong = search => {
    return new Promise((resolve, reject) => {
        let link = GetLink(search);

        ytdl.getInfo(link, (err, info) => {
            if (err) reject(err);
            
            resolve({
                url: info.video_url,
                title: info.title,
                author: info.author.name,
                thumbnail_url: info.player_response.videoDetails.thumbnail.thumbnails.pop().url,
                length: info.length_seconds
            });
        });
    });
}

const AddQueue = (newSong) => {
    if (playing)
        SendAddedToQueue(newSong);
    else
        SendNowPlaying(newSong);

    queue.push(newSong);
    TryPlayNext();
}

const TryPlayNext = () => {
    if (playing === undefined && queue.length > 0) {
        let nextSong = queue.shift()
        Play(nextSong);

        if (loop)
            queue.push(nextSong);
    }
}

const Play = song => {
    paused = false;
    //SendNowPlaying(song);

    if (stream)
        stream.destroy();

    // For some reason the 'highestaudio' quality setting messes up the stream about half way through
    let newStream = ytdl(song.url, { quality: 'lowestaudio' });
    stream = newStream;

    //stream.on('progress', (chunk, downloaded, total) => {
    //    console.log(chunk, downloaded / total * 100);
    //});

    Voice.start(voiceChannel, stream)
        .then(dispatcher => {
            currentDispatcher = dispatcher;

            dispatcher.on('finish', () => {
                newStream.destroy();
                clearTimeout(playingTimeout);
                playing = undefined;
            });

            dispatcher.on('error', console.error);
        })
        .catch(song.text_channel.send);

    SetPresence(song);

    playing = song;
    playingTimeout = setTimeout(() => {
        playing = undefined;
        TryPlayNext();
    }, song.length * 1000 + 500);
}

const Pause = () => {
    paused = true;
    if (currentDispatcher)
        currentDispatcher.pause();
}
const Unpause = () => {
    paused = false;
    if (currentDispatcher)
        currentDispatcher.resume();
}

const Skip = () => {
    clearTimeout(playingTimeout);
    playing = undefined;
    TryPlayNext();
}


exports.play = {
    help: 'Plays a song from YouTube',
    usage: '!play <link>',
    aliases: ['p'],
    /**
     * Plays a song from YouTube
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        let userChannel = msg.member.voice.channel;

        if (!userChannel || userChannel.guild !== msg.guild) {
            msg.channel.send("You aren't connected to a voice channel on this server")
                .catch(console.error);
            return;
        }

        if (!voiceChannel)
            voiceChannel = userChannel;

        if (voiceChannel !== userChannel) {
            msg.channel.send("You have to be on the same voice channel")
                .catch(console.error);
        }
        else {
            if (args[0]) {
                GetSong(args[0])
                    .then(song => {
                        song.member_name = msg.author.displayName,
                        song.member_avatar = msg.author.avatarURL(),
                        song.text_channel = msg.channel,
        
                        AddQueue(song);
                    });
            }
            else {
                // Unpause
                if (paused) {
                    Unpause();
                    msg.channel.send('Unpaused');
                }
            }
        }
    }
}

exports.pause = {
    help: 'Plauses the currently playing song',
    usage: '!pause',
    /**
     * Plauses the currently playing song
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        if (!voiceChannel || !playing) {
            msg.channel.send("I'm not playing anything right now")
                .catch(console.error);
        }
        else if (voiceChannel !== msg.member.voice.channel) {
            msg.channel.send("You have to be on the same voice channel")
                .catch(console.error);
        }
        else {
            if (paused) {
                Unpause();
                msg.channel.send('Unpaused');
            }
            else {
                Pause();
                msg.channel.send('Paused');
            }
        }
    }
}

exports.skip = {
    help: 'Skips a song',
    usage: '!skip',
    /**
     * Skips a song
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        if (!voiceChannel || (!playing && queue.length === 0)) {
            msg.channel.send("I'm not playing anything right now")
                .catch(console.error);
        }
        else if (voiceChannel !== msg.member.voice.channel) {
            msg.channel.send("You have to be on the same voice channel")
                .catch(console.error);
        }
        else {
            Skip();
        }
    }
}

exports.loop = {
    help: 'Loops the song queue',
    usage: '!loop',
    /**
     * Skips a song
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        if (!voiceChannel) {
            msg.channel.send("I'm not playing anything right now")
                .catch(console.error);
        }
        else if (voiceChannel !== msg.member.voice.channel) {
            msg.channel.send("You have to be on the same voice channel")
                .catch(console.error);
        }
        else {
            loop = !loop;

            msg.channel.send(
                new Discord.MessageEmbed()
                    .setColor('#00cc00')
                    .setTitle(`${loop ? 'Enabled' : 'Disabled'} looping`)
                    .setAuthor('Looping', msg.author.avatarURL())
            ).catch(console.error);
        }
    }
}

exports.nowplaying = {
    help: 'Sends info of the currently playing song',
    usage: '!nowplaying',
    aliases: ['np'],
    /**
     * Sends info of the currently playing song
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        if (!voiceChannel || !playing) {
            msg.channel.send("I'm not playing anything right now")
                .catch(console.error);
        }
        else {
            SendNowPlaying(playing);
        }
    }
}

exports.queue = {
    help: 'Sends the song queue',
    usage: '!queue',
    /**
     * Sends the song queue
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        if (!voiceChannel || (!playing && queue.length === 0)) {
            msg.channel.send("I'm not playing anything right now")
                .catch(console.error);
        }
        else {
            SendQueue(msg.channel);
        }
    }
}

