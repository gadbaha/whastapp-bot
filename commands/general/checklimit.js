/**
 * Check Limit Command - Allows users to check their remaining AI and sticker usage.
 */

const config = require("../../config");
const database = require("../../database");

module.exports = {
  name: "checklimit",
  aliases: ["limit", "usage"],
  category: "general",
  description: "Checks your remaining AI and sticker usage.",
  usage: ".checklimit",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const userId = extra.from;
      const isPremiumUser = database.isPremium(userId);

      let replyMessage = `*📊 Your Usage Limits for Today*\n\n`;

      if (isPremiumUser) {
        replyMessage += `✨ You have *unlimited* access to AI and Sticker features as a *Premium User*!\n`;
      } else {
        const userUsage = database.getUserUsage(userId);

        const aiRemaining = Math.max(0, config.aiLimit - userUsage.ai);
        const stickerRemaining = Math.max(0, config.stickerLimit - userUsage.sticker);

        replyMessage += `🤖 AI Questions: ${aiRemaining}/${config.aiLimit} remaining\n`;
        replyMessage += `🖼️ Stickers: ${stickerRemaining}/${config.stickerLimit} remaining\n\n`;
        replyMessage += `Upgrade to Premium for unlimited access! Contact ${config.premiumPaymentNumber} for details.\n`;
      }

      replyMessage += `\n${config.footerText}`;

      await extra.reply(replyMessage);
    } catch (error) {
      console.error("Error in checklimit command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
