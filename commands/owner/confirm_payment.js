/**
 * Confirm Payment Command - Owner-only command to manually confirm M-Pesa payment and grant premium.
 */

const config = require("../../config");
const database = require("../../database");

module.exports = {
  name: "confirmpayment",
  aliases: ["confirm", "mpesaconfirm"],
  category: "owner",
  description: "Manually confirms an M-Pesa payment and grants premium access to a user.",
  usage: ".confirmpayment <user_number> <duration_days> <mpesa_transaction_id>",
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      if (args.length < 3) {
        return extra.reply("Usage: .confirmpayment <user_number> <duration_days> <mpesa_transaction_id>\nExample: .confirmpayment 254712345678 30 OGH234KJL");
      }

      const userNumber = args[0].replace(/[^0-9]/g, "");
      const targetJid = `${userNumber}@s.whatsapp.net`;
      const durationDays = parseInt(args[1]);
      const transactionId = args[2];

      if (isNaN(durationDays) || durationDays <= 0) {
        return extra.reply("Please provide a valid number of days for the premium duration.");
      }

      // In a real-world scenario, you would integrate with an M-Pesa API here
      // to automatically verify the payment using a transaction ID.
      // For this bot, the owner manually verifies the payment outside the bot.
      // The transactionId is provided for the owner's reference.

      const success = database.addPremiumUser(targetJid, durationDays);

      if (success) {
        await extra.reply(`Premium access granted to ${userNumber} for ${durationDays} days. M-Pesa Transaction ID: ${transactionId}. Please inform the user.`);
        // Optionally, notify the user directly
        await extra.send(targetJid, `🎉 Your premium access for BAHATI BOT has been activated for ${durationDays} days! Enjoy unlimited features.`);
      } else {
        await extra.reply("Failed to grant premium access. An error occurred or user is already premium.");
      }

    } catch (error) {
      console.error("Error in confirm_payment command:", error);
      await extra.reply(`${config.messages.error} ${error.message}`);
    }
  },
};
