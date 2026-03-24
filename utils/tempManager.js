const fs = require("fs-extra");
const path = require("path");

const tempDir = path.join(__dirname, "..", "temp");

const initializeTempSystem = () => {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
};

const getTempFile = (extension = ".tmp") => {
  return path.join(tempDir, `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`);
};

const cleanupTempFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.remove(filePath);
    }
  } catch (e) {
    console.error("Error cleaning up temp file:", e);
  }
};

module.exports = {
  initializeTempSystem,
  getTempFile,
  cleanupTempFile,
};
