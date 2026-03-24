/**
 * Weather Command - Gets current weather information for a city
 */

const config = require("../../config");
const weather = require("openweather-apis");

module.exports = {
  name: "weather",
  aliases: ["w"],
  category: "utility",
  description: "Gets current weather information for a specified city.",
  usage: ".weather <city_name>",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const city = args.join(" ");
      if (!city) {
        return extra.reply("Please provide a city name. Example: .weather Nairobi");
      }

      if (!config.apiKeys.openWeather) {
        return extra.reply("OpenWeather API key is not configured. Please ask the bot owner to set it up.");
      }

      weather.set </dev/null>APPID(config.apiKeys.openWeather);
      weather.set </dev/null>Units("metric"); // or "imperial"
      weather.set </dev/null>Lang("en");
      weather.set </dev/null>City(city);

      await extra.reply(config.messages.wait);

      weather.getAllWeather(async (err, JSONObj) => {
        if (err) {
          console.error("Error fetching weather:", err);
          return extra.reply("Could not retrieve weather information. Please check the city name or try again later.");
        }

        if (JSONObj && JSONObj.main && JSONObj.weather && JSONObj.name) {
          const weatherDescription = JSONObj.weather[0].description;
          const temperature = JSONObj.main.temp;
          const feelsLike = JSONObj.main.feels_like;
          const humidity = JSONObj.main.humidity;
          const windSpeed = JSONObj.wind.speed;

          const replyMessage = `*Weather in ${JSONObj.name}, ${JSONObj.sys.country}*\n` +
                               `Description: ${weatherDescription}\n` +
                               `Temperature: ${temperature}°C (Feels like: ${feelsLike}°C)\n` +
                               `Humidity: ${humidity}%\n` +
                               `Wind Speed: ${windSpeed} m/s\n\n` +
                               `${config.footerText}`;
          await extra.reply(replyMessage);
        } else {
          await extra.reply("Could not retrieve weather information for that city. Please try again.");
        }
      });

    } catch (error) {
      console.error("Error in weather command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
