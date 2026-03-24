/**
 * TikTok Downloader Command - Downloads TikTok videos
 */

const config = require("../../config");
const { tiktokdl } = require("@mrnimax/tiktok_downloader");
const fs = require("fs");
const { getTempFile, cleanupTempFile } = require("../../utils/tempManager");

module.exports = {
  name: "tiktok",
  aliases: ["tt", "tiktokdl"],
  category: "media",
  description: "Downloads TikTok video without watermark.",
  usage: ".tiktok <video_url>",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const url = args[0];
      if (!url || !url.includes("tiktok.com")) {
        return extra.reply("Please provide a valid TikTok video URL.");
      }

      await extra.reply(config.messages.wait);

      const result = await tiktokdl(url);

      if (result && result.result && result.result.length > 0) {
        const videoUrl = result.result[0].url;
        const videoBuffer = await extra.getBuffer(videoUrl);
        const outputFilePath = getTempFile(".mp4");
        fs.writeFileSync(outputFilePath, videoBuffer);

        await sock.sendMessage(extra.from, {
          video: fs.readFileSync(outputFilePath),
          mimetype: "video/mp4",
          caption: `*TikTok Video*\nTitle: ${result.result[0].title || "N/A"}\n${config.footerText}`,
        });

        cleanupTempFile(outputFilePath);
        await extra.reply(config.messages.success);
      } else {
        await extra.reply("Failed to download TikTok video. Please try again or check the URL.");
      }
    } catch (error) {
      console.error("Error in TikTok command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
