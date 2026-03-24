# WhatsApp MD Bot

A powerful and modular WhatsApp bot inspired by KnightBot-Mini and BWM XMD. Built with Node.js and the Baileys library.

## ✨ Features

- **Modular Command System**: Easily add new commands in the `commands/` directory.
- **Antilink Protection**: Automatically delete or kick users who send links in groups.
- **Sticker Maker**: Convert images and videos to stickers.
- **AI Integration**: Chat with GPT-4 using the `.ai` command.
- **Welcome/Goodbye Messages**: Customizable messages for new and departing group members.
- **Antidelete**: Detect and report deleted messages in groups.
- **Anticall**: Automatically block users who call the bot.

## 🛠 Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- FFmpeg (for sticker conversion)

### 2. Installation

1. Clone this repository or download the source code.
2. Navigate to the project directory:
   ```bash
   cd whatsapp-bot
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### 3. Configuration

Edit the `config.js` file to customize your bot:

- `ownerNumber`: Your WhatsApp number (e.g., `['254712345678']`).
- `botName`: The name of your bot.
- `prefix`: The command prefix (default is `.`).
- `apiKeys`: Add your OpenAI API key if you want to use the AI features.

### 4. Running the Bot

Start the bot by running:
```bash
npm start
```

When the bot starts, a QR code will appear in your terminal. Scan it using **Linked Devices** in your WhatsApp app.

## 📜 Commands

Type `.menu` in WhatsApp to see the full list of available commands.

- `.sticker`: Reply to an image/video to create a sticker.
- `.ai <question>`: Ask the AI a question.
- `.antilink <on/off/set/get>`: Configure link protection in groups.
- `.menu`: Show the command menu.

## ⚠️ Disclaimer

This bot is for educational purposes only. Using third-party bots may violate WhatsApp's Terms of Service and could lead to your account being banned. Use at your own risk.

## 🙏 Credits

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API library.
- [KnightBot-Mini](https://github.com/mruniquehacker/KnightBot-Mini) - Inspiration for the bot structure.
- [BWM XMD](https://bwmxmd.co.ke/) - Inspiration for features.
