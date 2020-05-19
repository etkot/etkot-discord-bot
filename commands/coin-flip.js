const Discord = require("discord.js");
const mongoUtil = require("../mongoUtil");

let collection = undefined;
let GetCollection = () => {
  if (!collection) {
    collection = mongoUtil.getDb().collection("flipstats");
  }
  return collection;
};

let coinFlips = {};

exports.flip = {
  help: "Flips a coin for you",
  usage: "!flip <heads/tails>",
  aliases: ["f", "(╯°□°）╯︵ ┻━┻"],
  /**
   * Flips a coin for the user
   * @param {string[]} args - Command arguments
   * @param {Discord.Message} msg - User's message
   */
  func: (args, msg) => {
    if (
      coinFlips[msg.author] &&
      new Date() - coinFlips[msg.author].time < 30 * 60 * 1000
    ) {
      let diff = 30 * 60 * 1000 - (new Date() - coinFlips[msg.author].time);
      let min = Math.floor(diff / (60 * 1000));
      let sec = Math.floor((diff - min * 60 * 1000) / 1000);

      msg
        .reply(
          `You already flipped a coin and have to wait ${min} minutes and ${sec} seconds\nYou guessed **${
            coinFlips[msg.author].guess === 0 ? "heads" : "tails"
          }** and got **${
            coinFlips[msg.author].result === 0 ? "heads" : "tails"
          }**`
        )
        .catch(console.error);

      return;
    }

    if (args[0] !== undefined) args[0] = args[0].toLocaleLowerCase();
    if (args[0] === "h" || args[0] === "0") args[0] = "heads";
    if (args[0] === "t" || args[0] === "1") args[0] = "tails";

    if (args[0] === undefined || (args[0] !== "heads" && args[0] !== "tails")) {
      msg
        .reply(
          `You have to also guess **heads** or **tails**\n!flip <heads/tails>`
        )
        .catch(console.error);

      return;
    }

    let guess = args[0] === "heads" ? 0 : 1;

    coinFlips[msg.author] = {
      time: new Date(),
      guess: guess,
      result: -1,
    };

    msg
      .reply("Flipping coin...")
      .then((message) => {
        setTimeout(() => {
          let rnd = Math.floor(Math.random() * 2);
          message.edit(
            `${msg.author}, You got **${rnd === 0 ? "heads" : "tails"}**! ${
              rnd === guess
                ? "You can leave if you want to"
                : "You have to spend another 30 minutes on the computer"
            }`
          );

          coinFlips[msg.author].result = rnd;

          GetCollection().findOne({ id: msg.author.id }, (err, result) => {
            if (result === null) {
              GetCollection().insertOne({
                id: msg.author.id,
                total: 1,
                wins: rnd === guess ? 1 : 0,
                heads: guess === 0 ? 1 : 0,
                tails: guess === 1 ? 1 : 0,
              });
            } else {
              GetCollection().updateOne(
                { id: msg.author.id },
                {
                  $inc: {
                    total: 1,
                    wins: rnd === guess ? 1 : 0,
                    heads: guess === 0 ? 1 : 0,
                    tails: guess === 1 ? 1 : 0,
                  },
                }
              );
            }
          });
        }, 1000);
      })
      .catch(console.error);
  },
};

exports.flipstats = {
  help: "Gives flips stats",
  usage: "!flipstats [username]",
  aliases: ["fs", "fstats", "fstatz"],
  /**
   * Flips a coin for the user
   * @param {string[]} args - Command arguments
   * @param {Discord.Message} msg - User's message
   */
  func: (args, msg) => {
    GetCollection()
      .find({})
      .toArray(async (err, result) => {
        result.sort((a, b) => b.total - a.total);

        let str = "**Flip stats:**\n";
        for (let i = 0; i < result.length; i++) {
          const user = result[i];
          str += `\t${i + 1}. ${msg.guild.member(user.id).displayName}: ${
            user.total
          } flips, ${Math.round((user.wins / user.total) * 100)}%, ${
            user.tails < user.heads
              ? "mains heads"
              : user.heads < user.tails
              ? "mains tails"
              : "indecisive cunt"
          }\n`;
        }

        msg.channel.send(str);
      });
  },
};
