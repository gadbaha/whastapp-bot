const config = require("../config");
const moment = require("moment-timezone");

const formatTime = (timestamp) => {
  return moment(timestamp).tz(config.timezone).format("YYYY-MM-DD HH:mm:ss");
};

const getRandom = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const getBuffer = async (url, options) => {
  try {
    options = options || {};
    const res = await require("axios").get(url, {
      responseType: "arraybuffer",
      ...options,
    });
    return res.data;
  } catch (e) {
    console.error("Error getting buffer:", e);
    return null;
  }
};

module.exports = {
  formatTime,
  getRandom,
  getBuffer,
};
