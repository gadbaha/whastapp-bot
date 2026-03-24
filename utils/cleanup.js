const fs = require("fs-extra");
const path = require("path");

const tempDir = path.join(__dirname, "..", "temp");

const startCleanup = () => {
  // Clean up temp directory on startup
  if (fs.existsSync(tempDir)) {
    fs.emptyDirSync(tempDir);
  }

  // Schedule periodic cleanup (e.g., every 6 hours)
  setInterval(() => {
    if (fs.existsSync(tempDir)) {
      fs.emptyDirSync(tempDir);
      console.log("🧹 Cleaned up temporary directory.");
    }
  }, 6 * 60 * 60 * 1000); // Every 6 hours
};

module.exports = { startCleanup };
