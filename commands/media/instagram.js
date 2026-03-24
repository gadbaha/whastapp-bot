/**
 * Instagram Downloader Command - Placeholder
 */

const config = require("../../config");

module.exports = {
  name: "instagram",
  aliases: ["ig", "igdl"],
  category: "media",
  description: "Downloads Instagram video or image. (Currently under development)",
  usage: ".instagram <post_url>",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    await extra.reply("Instagram downloader is currently under development. Please check back later!");
  },
};
