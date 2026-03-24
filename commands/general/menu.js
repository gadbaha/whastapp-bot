/**
 * Menu Command - Displays available commands
 */

const config = require("../../config");
const { loadCommands } = require("../../utils/commandLoader");

module.exports = {
  name: "menu",
  aliases: ["help"],
  category: "general",
  description: "Displays the bot's command menu.",
  usage: ".menu",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const allCommands = loadCommands();
      const categories = new Map();

      // Group commands by category
      for (const command of allCommands.values()) {
        if (!categories.has(command.category)) {
          categories.set(command.category, []);
        }
        // Avoid duplicate commands if aliases are also in the map
        if (!categories.get(command.category).some(c => c.name === command.name)) {
            categories.get(command.category).push(command);
        }
      }

      let menuText = `*${config.botName} Command Menu*\n\n`;

      for (const [category, cmds] of categories.entries()) {
        menuText += `*───「 ${category.toUpperCase()} 」───*\n`;
        for (const cmd of cmds) {
          menuText += `*${config.prefix}${cmd.name}* - ${cmd.description}\n`;
        }
        menuText += `\n`;
      }

      menuText += `_Total Commands: ${allCommands.size}_\n\n`;
      menuText += `*Usage: ${config.prefix}command <args>*\n`;
      menuText += `*Example: ${config.prefix}antilink on*\n\n`;
      menuText += `*Powered by ${config.botName}*`;

      await extra.reply(menuText);
    } catch (error) {
      console.error("Error generating menu:", error);
      await extra.reply(config.messages.error);
    }
  },
};
