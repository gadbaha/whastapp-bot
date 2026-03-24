/**
 * Add Premium Command - Adds a user to the premium list
 */

const config = require("../../config");
const database = require("../../database");

module.exports = {
  name: "addpremium",
  aliases: ["addprem"],
  category: "owner",
  description: "Adds a user to the premium list for a specified duration.",
  usage: ".addpremium <mention/reply> <duration_days>",
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
        return extra.reply("Please mention or reply to a user, or provide their number, and specify the premium duration in days.");
      }

      const durationDays = parseInt(args[1]);
      if (isNaN(durationDays) || durationDays <= 0) {
        return extra.reply("Please provide a valid number of days for the premium duration.");
      }

      const success = database.addPremiumUser(targetJid, durationDays);

      if (success) {
        await extra.reply(`User ${targetJid.split("@")[0]} has been granted premium access for ${durationDays} days.`);
      } else {
        await extra.reply("Failed to add premium user. An error occurred.");
      }
    } catch (error) {
      console.error("Error in addpremium command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
