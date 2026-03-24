/**
 * Antilink Command - Toggle antilink protection with delete/kick options
 */

const database = require("../../database");
const config = require("../../config");

module.exports = {
  name: "antilink",
  aliases: [],
  category: "admin",
  description: "Configure antilink protection (delete/kick)",
  usage: ".antilink <on/off/set/get>",
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        const settings = database.getGroupSettings(extra.from);
        const status = settings.antilink ? "ON" : "OFF";
        const action = settings.antilinkAction || "delete";
        return extra.reply(
          `🔗 *Antilink Status*\n\n` +
            `Status: *${status}*\n` +
            `Action: *${action}*\n\n` +
            `Usage:\n` +
            `  ${config.prefix}antilink on\n` +
            `  ${config.prefix}antilink off\n` +
            `  ${config.prefix}antilink set delete | kick\n` +
            `  ${config.prefix}antilink get`
        );
      }

      const opt = args[0].toLowerCase();

      if (opt === "on") {
        if (database.getGroupSettings(extra.from).antilink) {
          return extra.reply("*Antilink is already on*");
        }
        database.updateGroupSettings(extra.from, { antilink: true });
        return extra.reply("*Antilink has been turned ON*");
      }

      if (opt === "off") {
        database.updateGroupSettings(extra.from, { antilink: false });
        return extra.reply("*Antilink has been turned OFF*");
      }

      if (opt === "set") {
        if (args.length < 2) {
          return extra.reply(
            `*Please specify an action: ${config.prefix}antilink set delete | kick*`
          );
        }

        const setAction = args[1].toLowerCase();
        if (!["delete", "kick"].includes(setAction)) {
          return extra.reply("*Invalid action. Choose delete or kick.*");
        }

        database.updateGroupSettings(extra.from, {
          antilinkAction: setAction,
          antilink: true, // Auto-enable when setting action
        });
        return extra.reply(`*Antilink action set to ${setAction}*`);
      }

      if (opt === "get") {
        const settings = database.getGroupSettings(extra.from);
        const status = settings.antilink ? "ON" : "OFF";
        const action = settings.antilinkAction || "delete";
        return extra.reply(
          `*Antilink Configuration:*\nStatus: ${status}\nAction: ${action}`
        );
      }

      return extra.reply(`*Use ${config.prefix}antilink for usage.*`);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
