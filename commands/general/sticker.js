/**
 * Sticker Command - Converts images/videos to stickers
 */

const { MessageType } = require("@whiskeysockets/baileys");
const { convertImageToWebp, convertVideoToWebp } = require("../../utils/stickerConverter");
const config = require("../../config");

module.exports = {
  name: "sticker",
  aliases: ["s", "stiker"],
  category: "general",
  description: "Converts an image or video to a sticker.",
  usage: ".sticker (reply to image/video)",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const quotedMessage = extra.getQuotedMessage();

      if (!quotedMessage) {
        return extra.reply("Please reply to an image or video to make a sticker.");
      }

      const mediaBuffer = await extra.getMediaBuffer();

      if (!mediaBuffer) {
        return extra.reply("Could not retrieve media from the quoted message.");
      }

      let stickerBuffer;
      if (quotedMessage.type === "image") {
        stickerBuffer = await convertImageToWebp(mediaBuffer);
      } else if (quotedMessage.type === "video") {
        stickerBuffer = await convertVideoToWebp(mediaBuffer);
      } else {
        return extra.reply("Unsupported media type for sticker conversion. Please reply to an image or video.");
      }

      if (stickerBuffer) {
        await sock.sendMessage(extra.from, {
          sticker: stickerBuffer,
          mimetype: "image/webp",
          fileName: "sticker.webp",
          contextInfo: {
            mentionedJid: [extra.from],
            externalAdReply: {
              title: config.packname,
              body: config.botName,
              thumbnail: stickerBuffer, // Use the sticker itself as thumbnail
              sourceUrl: config.social.github || "https://github.com/yourusername",
              mediaType: 1,
              renderLargerThumbnail: true,
            },
          },
        });
      } else {
        await extra.reply("Failed to convert media to sticker.");
      }
    } catch (error) {
      console.error("Error in sticker command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
