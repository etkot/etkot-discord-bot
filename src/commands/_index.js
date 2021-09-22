const fs = require('fs')

let commands = {}

// Load commands
let files = fs.readdirSync(__dirname)
for (let file of files) {
    if (file[0] !== '_') {
        let moduleCommands = require(`./${file}`)

        for (let c in moduleCommands) {
            if (moduleCommands[c].func) {
                commands[c] = moduleCommands[c]
            }
        }
    }
}

let aliases = {}

// Get aliases from commands
for (let cmd in commands) {
    if (commands[cmd].aliases) {
        for (let alias of commands[cmd].aliases) {
            if (aliases[alias]) {
                console.error(`Cannot create alias: Alias "${alias}" already exists`)
            } else {
                aliases[alias] = Object.assign({}, commands[cmd])
                aliases[alias].help = undefined
            }
        }
    }
}

// Put aliases in the commands object
for (let alias in aliases) {
    if (commands[alias]) {
        console.error(`Cannot create alias: Command "${alias}" already exists`)
    } else {
        commands[alias] = aliases[alias]
    }
}

module.exports = commands
