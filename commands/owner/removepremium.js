/**
 * Remove Premium Command - Removes a user from the premium list
 */

const config = require("../../config");
const database = require("../../database");

module.exports = {
  name: "removepremium",
  aliases: ["remprem"],
  category: "owner",
  description: "Removes a user from the premium list.",
  usage: ".removepremium <mention/reply>",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      let targetJid;
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const quotedJid = msg.message?.extendedTextMessage?.contextInfo?.participant;

      if (mentionedJid) {
        targetJid = mentionedJid;
      } else if (quotedJid) {
        targetJid = quotedJid;
      } else if (args[0]) {
        // If a number is provided directly, assume it's a JID without @s.whatsapp.net
        targetJid = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      } else {
        return extra.reply("Please mention or reply to a user, or provide their number, to remove them from premium.");
      }

      const success = database.removePremiumUser(targetJid);

      if (success) {
        await extra.reply(`User ${targetJid.split("@")[0]} has been removed from premium access.`);
      } else {
        await extra.reply("Failed to remove premium user. An error occurred or user was not premium.");
      }
    } catch (error) {
      console.error("Error in removepremium command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
