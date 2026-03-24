/**
 * Broadcast Command - Sends a message to all users who have interacted with the bot.
 */

const config = require("../../config");
const database = require("../../database");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "broadcast",
  aliases: ["bc"],
  category: "owner",
  description: "Sends a message to all users who have interacted with the bot.",
  usage: ".broadcast <message>",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      const broadcastMessage = args.join(" ");
      if (!broadcastMessage) {
        return extra.reply("Please provide a message to broadcast.");
      }

      const usersDbPath = path.join(__dirname, "..", "..", "database", "users.json");
      const users = JSON.parse(fs.readFileSync(usersDbPath, "utf-8"));
      const userJids = Object.keys(users);

      let successCount = 0;
      let failCount = 0;

      await extra.reply(`Starting broadcast to ${userJids.length} users...`);

      for (const jid of userJids) {
        try {
          await sock.sendMessage(jid, { text: broadcastMessage });
          successCount++;
        } catch (error) {
          console.error(`Failed to send broadcast to ${jid}:`, error);
          failCount++;
        }
      }

      await extra.reply(`Broadcast complete!\nSuccessfully sent to ${successCount} users.\nFailed to send to ${failCount} users.`);

    } catch (error) {
      console.error("Error in broadcast command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
