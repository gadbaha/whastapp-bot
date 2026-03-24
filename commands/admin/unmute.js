/**
 * Unmute Command - Unmutes a group
 */

const config = require("../../config");
const database = require("../../database");

module.exports = {
  name: "unmute",
  aliases: [],
  category: "admin",
  description: "Unmutes the group, allowing all members to send messages.",
  usage: ".unmute",
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const groupId = extra.from;

      await sock.groupSettingUpdate(groupId, "not_announcement"); // Set to 'not_announcement' to unmute
      await extra.reply("Group has been unmuted. All members can now send messages.");

    } catch (error) {
      console.error("Error in unmute command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
