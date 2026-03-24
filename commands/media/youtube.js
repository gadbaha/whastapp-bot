/**
 * YouTube Downloader Command - Downloads YouTube videos/audio
 */

const config = require("../../config");
const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");
const { getTempFile, cleanupTempFile } = require("../../utils/tempManager");

module.exports = {
  name: "yt",
  aliases: ["youtube"],
  category: "media",
  description: "Downloads YouTube video or audio.",
  usage: ".yt <video_url> [audio/video]",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const url = args[0];
      if (!url || !ytdl.validateURL(url)) {
        return extra.reply("Please provide a valid YouTube video URL.");
      }

      const type = args[1]?.toLowerCase() || "video"; // Default to video

      await extra.reply(config.messages.wait);

      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title.replace(/[^a-zA-Z0-9 ]/g, ""); // Sanitize title

      let outputFilePath;
      let stream;

      if (type === "audio") {
        outputFilePath = getTempFile(`.mp3`);
        stream = ytdl(url, { quality: "highestaudio" });
      } else {
        outputFilePath = getTempFile(`.mp4`);
        stream = ytdl(url, { quality: "highestvideo" });
      }

      const writeStream = fs.createWriteStream(outputFilePath);
      stream.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      if (type === "audio") {
        await sock.sendMessage(extra.from, {
          audio: fs.readFileSync(outputFilePath),
          mimetype: "audio/mp4",
          fileName: `${title}.mp3`,
        });
      } else {
        await sock.sendMessage(extra.from, {
          video: fs.readFileSync(outputFilePath),
          mimetype: "video/mp4",
          fileName: `${title}.mp4`,
        });
      }

      cleanupTempFile(outputFilePath);
      await extra.reply(config.messages.success);
    } catch (error) {
      console.error("Error in YouTube command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
