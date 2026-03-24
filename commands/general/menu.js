/**
 * Menu Command - Displays available commands
 */

const config = require("../../config");
const { loadCommands } = require("../../utils/commandLoader");
const fs = require("fs");
const path = require("path");

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
        // Filter out commands that are no longer available or are high-risk
        if (["broadcast"].includes(command.name)) continue;
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
          // Only display commands that are not ownerOnly unless the sender is the owner
          if (cmd.ownerOnly && !extra.isOwner) continue;
          menuText += `*${config.prefix}${cmd.name}* - ${cmd.description}\n`;
        }
        menuText += `\n`;
      }

      menuText += `_Total Commands: ${allCommands.size}_\n\n`;
      menuText += `*Usage: ${config.prefix}command <args>*\n`;
      menuText += `*Example: ${config.prefix}antilink on*\n\n`;
      menuText += config.footerText; // Add the footer text

      // Send the menu with the logo if available
      const logoPath = path.join(__dirname, "..", config.menuImage);
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        await sock.sendMessage(extra.from, {
          image: logoBuffer,
          caption: menuText,
          contextInfo: {
            mentionedJid: [extra.from],
            externalAdReply: {
              title: config.botName,
              body: config.footerText,
              thumbnail: logoBuffer,
              sourceUrl: config.social.github || "https://github.com/yourusername",
              mediaType: 1,
              renderLargerThumbnail: true,
            },
          },
        });
      } else {
        await extra.reply(menuText);
      }

    } catch (error) {
      console.error("Error generating menu:", error);
      await extra.reply(config.messages.error);
    }
  },
};
