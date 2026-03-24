/**
 * Global Configuration for WhatsApp MD Bot
 */

module.exports = {
    // Bot Owner Configuration
    ownerNumber: ["254712345678"], // Replace with your number without + or spaces
    ownerName: ["Bahati Tech Productions"], // Your Name
    
    // Bot Configuration
    botName: "BAHATI BOT",
    prefix: ".", // Default prefix for commands
    premiumNumbers: ["254791085514", "254759261788"], // Numbers with premium access
    premiumPaymentNumber: "254791085514", // M-Pesa number for premium payments
    aiLimit: 5, // Free AI questions per day
    premiumPaymentInstructions: "To get premium access, send KES 100 to M-Pesa number 0791085514. Then send a screenshot of the M-Pesa confirmation message to the bot owner for verification. Once verified, your premium access will be activated for one month.",
    stickerLimit: 10, // Free stickers per day
    sessionName: "session",
    sessionID: process.env.SESSION_ID || "",
    newsletterJid: "", // Optional: for menu forwarding
    updateZipUrl: "", // Optional: for bot updates
    menuImage: "./assets/bahati_logo.png", // Path to the menu image
    footerText: "Powered by Bahati Tech Productions", // Footer text for messages
    
    // Sticker Configuration
    packname: "BAHATI BOT Stickers",
    
    // Bot Behavior
    selfMode: false, // Private mode - only owner can use commands
    autoRead: false,
    autoTyping: false,
    autoBio: false,
    autoSticker: false,
    autoReact: false,
    autoReactMode: "bot", // set bot or all via cmd
    autoDownload: false,
    
    // Group Settings Defaults
    defaultGroupSettings: {
      // Removed antidelete and anticall for ban prevention
      antilink: false,
      antilinkAction: "warn", // "delete", "kick", "warn" - Changed to 'warn' for safer default
      antitag: false,
      antitagAction: "delete",
      antiall: false, // Owner only - blocks all messages from non-admins
      antiviewonce: false,
      antibot: false,

      antigroupmention: false, // Anti-group mention feature
      antigroupmentionAction: "delete", // "delete", "kick"
      welcome: false,
      welcomeMessage: "Welcome @user!\nGroup Description: groupDesc\n\nPowered by botName",
      goodbye: false,
      goodbyeMessage: "Goodbye @user 👋",
      antiSpam: false,

      nsfw: false,
      detect: false,
      chatbot: false,
      autosticker: false // Auto-convert images/videos to stickers
    },
    
    // API Keys (add your own)
    apiKeys: {
      openai: process.env.OPENAI_API_KEY || "",
      openWeather: process.env.OPENWEATHER_API_KEY || "", // Get from https://openweathermap.org/api
      deepai: "",
      remove_bg: ""
    },
    
    // Message Configuration
    messages: {
      wait: "⏳ Please wait...",
      success: "✅ Success!",
      error: "❌ Error occurred!",
      ownerOnly: "👑 This command is only for bot owner!",
      adminOnly: "🛡️ This command is only for group admins!",
      groupOnly: "👥 This command can only be used in groups!",
      privateOnly: "💬 This command can only be used in private chat!",
      botAdminNeeded: "🤖 Bot needs to be admin to execute this command!",
      invalidCommand: "❓ Invalid command! Type .menu for help"
    },
    
    // Timezone
    timezone: "Africa/Nairobi",
    
    // Limits
    maxWarnings: 3,
    
    // Social Links (optional)
    social: {
      github: "https://github.com/yourusername",
      instagram: "https://instagram.com/yourusername",
      youtube: "http://youtube.com/@yourusername"
    }
};
