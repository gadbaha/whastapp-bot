const { writeFileSync, readFileSync, unlinkSync } = require("fs");
const { exec } = require("child_process");
const path = require("path");
const { getTempFile, cleanupTempFile } = require("./tempManager");

const convertImageToWebp = async (buffer) => {
  const inputPath = getTempFile(".png");
  const outputPath = getTempFile(".webp");
  writeFileSync(inputPath, buffer);

  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -y -i ${inputPath} -vcodec libwebp -vf \"scale=\'min(512,iw)\\\':min=\'min(512,ih)\\\\':force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0\" -s 512x512 -preset default -an -vsync 0 ${outputPath}`,
      (error) => {
        unlinkSync(inputPath);
        if (error) {
          reject(error);
        } else {
          const webpBuffer = readFileSync(outputPath);
          cleanupTempFile(outputPath);
          resolve(webpBuffer);
        }
      }
    );
  });
};

const convertVideoToWebp = async (buffer) => {
  const inputPath = getTempFile(".mp4");
  const outputPath = getTempFile(".webp");
  writeFileSync(inputPath, buffer);

  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -y -i ${inputPath} -vcodec libwebp -vf fps=10,scale=512:512:force_original_aspect_ratio=increase,crop=512:512,setsar=1,loop=0 -preset default -an -vsync 0 -t 10 ${outputPath}`,
      (error) => {
        unlinkSync(inputPath);
        if (error) {
          reject(error);
        } else {
          const webpBuffer = readFileSync(outputPath);
          cleanupTempFile(outputPath);
          resolve(webpBuffer);
        }
      }
    );
  });
};

module.exports = {
  convertImageToWebp,
  convertVideoToWebp,
};
