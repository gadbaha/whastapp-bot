/**
 * Warn Command - Warns a user in a group
 */

const config = require("../../config");
const database = require("../../database");

module.exports = {
  name: "warn",
  aliases: [],
  category: "admin",
  description: "Warns a user in a group. After config.maxWarnings, the user will be kicked.",
  usage: ".warn <mention/reply> [reason]",
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,
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
        return extra.reply("Please mention or reply to the user you want to warn.");
      }

      const reason = args.join(" ") || "No reason provided.";

      const warnings = database.addWarning(groupId, targetJid, reason);
      const currentWarnings = warnings.count;

      let replyMessage = `*⚠️ Warning!*\n@${targetJid.split("@")[0]} has been warned. (Current warnings: ${currentWarnings}/${config.maxWarnings})\nReason: ${reason}\n\n`;

      if (currentWarnings >= config.maxWarnings) {
        await extra.kickParticipant(groupId, targetJid);
        database.clearWarnings(groupId, targetJid);
        replyMessage += `*🚨 User Kicked!*\n@${targetJid.split("@")[0]} reached ${config.maxWarnings} warnings and has been kicked from the group.`;
      }

      await extra.reply(replyMessage, { mentions: [targetJid] });

    } catch (error) {
      console.error("Error in warn command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
