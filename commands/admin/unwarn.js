/**
 * Unwarn Command - Removes a warning from a user in a group
 */

const config = require("../../config");
const database = require("../../database");

module.exports = {
  name: "unwarn",
  aliases: [],
  category: "admin",
  description: "Removes the latest warning from a user in a group.",
  usage: ".unwarn <mention/reply>",
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const groupId = extra.from;
      let targetJid;
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const quotedJid = msg.message?.extendedTextMessage?.contextInfo?.participant;

      if (mentionedJid) {
        targetJid = mentionedJid;
      } else if (quotedJid) {
        targetJid = quotedJid;
      } else {
        return extra.reply("Please mention or reply to the user you want to unwarn.");
      }

      const success = database.removeWarning(groupId, targetJid);

      if (success) {
        const warnings = database.getWarnings(groupId, targetJid);
        await extra.reply(`Latest warning removed for @${targetJid.split("@")[0]}. (Current warnings: ${warnings.count}/${config.maxWarnings})`, { mentions: [targetJid] });
      } else {
        await extra.reply(`@${targetJid.split("@")[0]} has no warnings to remove.`, { mentions: [targetJid] });
      }

    } catch (error) {
      console.error("Error in unwarn command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
