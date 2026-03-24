/**
 * AI Command - Chat with GPT-4
 */

const { OpenAI } = require("openai");
const config = require("../../config");

const client = new OpenAI();

module.exports = {
  name: "ai",
  aliases: ["gpt", "ask"],
  category: "ai",
  description: "Ask the AI a question.",
  usage: ".ai <question>",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const prompt = args.join(" ");
      if (!prompt) {
        return extra.reply("Please provide a question for the AI.");
      }

      await extra.reply(config.messages.wait);

      const response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const aiResponse = response.choices[0].message.content;
      await extra.reply(aiResponse);
    } catch (error) {
      console.error("Error in AI command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
