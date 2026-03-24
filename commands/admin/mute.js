/**
 * Mute Command - Mutes a group
 */

const config = require("../../config");
const database = require("../../database");

module.exports = {
  name: "mute",
  aliases: [],
  category: "admin",
  description: "Mutes the group, only admins can send messages.",
  usage: ".mute",
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const groupId = extra.from;

      await sock.groupSettingUpdate(groupId, "announcement"); // Set to 'announcement' to mute
      await extra.reply("Group has been muted. Only admins can send messages.");

    } catch (error) {
      console.error("Error in mute command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
