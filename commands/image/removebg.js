/**
 * Remove Background Command - Removes background from an image
 */

const config = require("../../config");
const { removeBackground } = require("@imgly/background-removal-node");
const fs = require("fs");
const { getTempFile, cleanupTempFile } = require("../../utils/tempManager");

module.exports = {
  name: "removebg",
  aliases: ["rmbg"],
  category: "image",
  description: "Removes the background from an image.",
  usage: ".removebg (reply to an image)",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const quotedMessage = extra.getQuotedMessage();

      if (!quotedMessage || quotedMessage.type !== "image") {
        return extra.reply("Please reply to an image to remove its background.");
      }

      await extra.reply(config.messages.wait);

      const mediaBuffer = await extra.getMediaBuffer();

      if (!mediaBuffer) {
        return extra.reply("Could not retrieve image from the quoted message.");
      }

      const outputBuffer = await removeBackground(mediaBuffer);

      const outputFilePath = getTempFile(".png");
      fs.writeFileSync(outputFilePath, outputBuffer);

      await sock.sendMessage(extra.from, {
        image: fs.readFileSync(outputFilePath),
        mimetype: "image/png",
        caption: `*Background Removed!*\n${config.footerText}`,
      });

      cleanupTempFile(outputFilePath);
      await extra.reply(config.messages.success);
    } catch (error) {
      console.error("Error in removebg command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
