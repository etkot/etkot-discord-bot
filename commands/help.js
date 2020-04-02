const { telegram } = require('../index');

exports.help = {
    usage: '!help [command]',
    aliases: [ 'h' ],
    func: (args, update) => {
        const commands = require('./index');
        let msg = '';

        if (args.length > 0) {
            if (commands[args[0]]) {
                msg = `${commands[args[0]].help}\nUsage: ${commands[args[0]].usage}`;
            } 
            else {
                msg = `Command "${args[0]}" not found\nSend !help to get a list of all commands`;
            }
        }
        else {
            for (let cmd in commands) {
                if (commands[cmd].help) {
                    msg += `!${cmd} - ${commands[cmd].help}\n`;
                }
            }
        }

        telegram.SendMessage(update.chat, msg, { disable_notification: true });
    }
}

exports.usage = {
    usage: '!usage <command>',
    aliases: [ 'u' ],
    func: (args, update) => {
        const commands = require('./index');
        let msg;

        if (args.length === 0) {
            msg = `Usage: !usage <command>`;
        }
        else {
            msg = `Usage: ${commands[args[0]].usage}`;
        }

        telegram.SendMessage(update.chat, msg, { disable_notification: true });
    }
}