const Discord = require('discord.js')
const net = require('net')

let ToVarInt = (value) => {
    let bytes = []

    do {
        let temp = value & 0b01111111
        // Note: >>> means that the sign bit is shifted with the rest of the number rather than being left alone
        value >>>= 7
        if (value != 0) {
            temp |= 0b10000000
        }
        bytes.push(temp)
    } while (value != 0)

    return Buffer.from(bytes)
}

exports.minecraft = {
    help: 'Tells how many player are on the minecraft server',
    usage: '!minecraft',
    aliases: ['mc'],
    /**
     * Flips a coin for the user
     * @param {string[]} args - Command arguments
     * @param {Discord.Message} msg - User's message
     */
    func: (args, msg) => {
        let hosts = process.env.MC_ADDR.split(',')
        let ports = process.env.MC_PORT.split(',')

        let ready = 0
        let texts = []
        const sendResponse = (text, index) => {
            texts[index] = text

            if (++ready == hosts.length) {
                msg.channel.send(texts.join('\n\n')).catch(console.error)
            }
        }

        for (let i in hosts) {
            let host = hosts[i]
            let port = ports[i]

            let client = net.connect({ host, port }, () => {
                let bufPacketId = ToVarInt(0)
                let bufVersion = ToVarInt(-1)
                let bufAddressLen = ToVarInt(host.length)
                let bufAddress = Buffer.from(host)
                let bufPort = Buffer.from([port >> 8, port])
                let bufMode = ToVarInt(1)

                let bufLength = ToVarInt(
                    bufPacketId.length +
                        bufVersion.length +
                        bufAddressLen.length +
                        bufAddress.length +
                        bufPort.length +
                        bufMode.length
                )

                let buf = Buffer.concat([
                    bufLength,
                    bufPacketId,
                    bufVersion,
                    bufAddressLen,
                    bufAddress,
                    bufPort,
                    bufMode,
                ])

                client.write(buf)
                client.write(Buffer.concat([ToVarInt(1), ToVarInt(0)]))
            })

            client.on('data', (data) => {
                data = data.toString()
                while (data[0] !== '{') {
                    data = data.substr(1)
                }

                data = JSON.parse(data)

                let text = `**${data.description.text}** (${data.players.online}/${data.players.max})`

                for (let p in data.players.sample) {
                    text += `\n    ${data.players.sample[p].name}`
                }

                sendResponse(text, i)

                client.end()
            })
        }
    },
}
