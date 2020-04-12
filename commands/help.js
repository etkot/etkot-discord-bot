exports.help = {
    usage: '!help [command]',
    aliases: [ 'h' ],
    func: (args, msg) => {
        const commands = require('./index');
        let text = '';

        if (args.length > 0) {
            if (commands[args[0]]) {
                text = `${commands[args[0]].help}\nUsage: ${commands[args[0]].usage}`;
            } 
            else {
                text = `Command "${args[0]}" not found\nSend !help to get a list of all commands`;
            }
        }
        else {
            for (let cmd in commands) {
                if (commands[cmd].help) {
                    text += `**!${cmd}** - ${commands[cmd].help}\n`;
                }
            }
        }

        msg.channel.send(text)
            .catch(console.error);
    }
}

exports.usage = {
    usage: '!usage <command>',
    aliases: [ 'u' ],
    func: (args, msg) => {
        const commands = require('./index');
        let text;

        if (args.length === 0) {
            text = `Usage: !usage <command>`;
        }
        else {
            text = `Usage: ${commands[args[0]].usage}`;
        }

        msg.channel.send(text)
            .catch(console.error);
    }
}