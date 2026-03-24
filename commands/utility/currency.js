/**
 * Currency Converter Command - Converts currency using real-time rates
 */

const config = require("../../config");
const CurrencyConverter = require("currency-converter-lt");

module.exports = {
  name: "currency",
  aliases: ["convert", "forex"],
  category: "utility",
  description: "Converts an amount from one currency to another.",
  usage: ".currency <amount> <from_currency> <to_currency>",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (args.length !== 3) {
        return extra.reply("Please provide the amount, from currency, and to currency. Example: .currency 100 USD KES");
      }

      const amount = parseFloat(args[0]);
      const fromCurrency = args[1].toUpperCase();
      const toCurrency = args[2].toUpperCase();

      if (isNaN(amount) || amount <= 0) {
        return extra.reply("Please provide a valid amount to convert.");
      }

      await extra.reply(config.messages.wait);

      let currencyConverter = new CurrencyConverter();
      const result = await currencyConverter.from(fromCurrency).to(toCurrency).amount(amount).convert();

      if (result) {
        await extra.reply(`*${amount} ${fromCurrency}* is equal to *${result.toFixed(2)} ${toCurrency}*\n${config.footerText}`);
      } else {
        await extra.reply("Could not perform currency conversion. Please check the currency codes and try again.");
      }

    } catch (error) {
      console.error("Error in currency command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
