/**
 * Message Handler - Processes incoming messages and executes commands
 */

const config = require("./config");
const database = require("./database");
const { loadCommands } = require("./utils/commandLoader");
const { jidDecode, jidEncode } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Group metadata cache to prevent rate limiting
const groupMetadataCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

// Load all commands
const commands = loadCommands();

// Unwrap WhatsApp containers (ephemeral, view once, etc.)
const getMessageContent = (msg) => {
  if (!msg || !msg.message) return null;

  let m = msg.message;

  // Common wrappers in modern WhatsApp
  if (m.ephemeralMessage) m = m.ephemeralMessage.message;
  if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message;
  if (m.viewOnceMessage) m = m.viewOnceMessage.message;
  if (m.documentWithCaptionMessage) m = m.documentWithCaptionMessage.message;

  // You can add more wrappers if needed later
  return m;
};

// Cached group metadata getter with rate limit handling (for non-admin checks)
const getCachedGroupMetadata = async (sock, groupId) => {
  try {
    // Validate group JID before attempting to fetch
    if (!groupId || !groupId.endsWith("@g.us")) {
      return null;
    }

    // Check cache first
    const cached = groupMetadataCache.get(groupId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data; // Return cached data (even if null for forbidden groups)
    }

    // Fetch from API
    const metadata = await sock.groupMetadata(groupId);

    // Cache it
    groupMetadataCache.set(groupId, {
      data: metadata,
      timestamp: Date.now(),
    });

    return metadata;
  } catch (error) {
    // Handle forbidden (403) errors - cache null to prevent retry storms
    if (
      error.message &&
      (error.message.includes("forbidden") ||
        error.message.includes("403") ||
        error.statusCode === 403 ||
        error.output?.statusCode === 403 ||
        error.data === 403)
    ) {
      // Cache null for forbidden groups to prevent repeated attempts
      groupMetadataCache.set(groupId, {
        data: null,
        timestamp: Date.now(),
      });
      return null; // Silently return null for forbidden groups
    }

    // Handle rate limit errors
    if (error.message && error.message.includes("rate-overlimit")) {
      const cached = groupMetadataCache.get(groupId);
      if (cached) {
        return cached.data;
      }
      return null;
    }

    // For other errors, try cached data as fallback
    const cached = groupMetadataCache.get(groupId);
    if (cached) {
      return cached.data;
    }

    // Return null instead of throwing to prevent crashes
    return null;
  }
};

// Live group metadata getter (always fresh, no cache) - for admin checks
const getLiveGroupMetadata = async (sock, groupId) => {
  try {
    // Always fetch fresh metadata, bypass cache
    const metadata = await sock.groupMetadata(groupId);

    // Update cache for other features (antilink, welcome, etc.)
    groupMetadataCache.set(groupId, {
      data: metadata,
      timestamp: Date.now(),
    });

    return metadata;
  } catch (error) {
    // On error, try cached data as fallback
    const cached = groupMetadataCache.get(groupId);
    if (cached) {
      return cached.data;
    }
    return null;
  }
};

// Alias for backward compatibility (non-admin features use cached)
const getGroupMetadata = getCachedGroupMetadata;

// Helper functions
const isOwner = (sender) => {
  if (!sender) return false;

  // Normalize sender JID to handle LID
  const normalizedSender = normalizeJidWithLid(sender);
  const senderNumber = normalizeJid(normalizedSender);

  // Check against owner numbers
  return config.ownerNumber.some((owner) => {
    const normalizedOwner = normalizeJidWithLid(
      owner.includes("@") ? owner : `${owner}@s.whatsapp.net`
    );
    const ownerNumber = normalizeJid(normalizedOwner);
    return ownerNumber === senderNumber;
  });
};

const isMod = (sender) => {
  const number = sender.split("@")[0];
  return database.isModerator(number);
};

// LID mapping cache
const lidMappingCache = new Map();

// Helper to normalize JID to just the number part
const normalizeJid = (jid) => {
  if (!jid) return null;
  if (typeof jid !== "string") return null;

  // Remove device ID if present (e.g., "1234567890:0@s.whatsapp.net" -> "1234567890")
  if (jid.includes(":")) {
    return jid.split(":")[0];
  }
  // Remove domain if present (e.g., "1234567890@s.whatsapp.net" -> "1234567890")
  if (jid.includes("@")) {
    return jid.split("@")[0];
  }
  return jid;
};

// Get LID mapping value from session files
const getLidMappingValue = (user, direction) => {
  if (!user) return null;

  const cacheKey = `${direction}:${user}`;
  if (lidMappingCache.has(cacheKey)) {
    return lidMappingCache.get(cacheKey);
  }

  const sessionPath = path.join(__dirname, config.sessionName || "session");
  const suffix = direction === "pnToLid" ? ".json" : "_reverse.json";
  const filePath = path.join(sessionPath, `lid-mapping-${user}${suffix}`);

  if (!fs.existsSync(filePath)) {
    lidMappingCache.set(cacheKey, null);
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8").trim();
    const value = raw ? JSON.parse(raw) : null;
    lidMappingCache.set(cacheKey, value || null);
    return value || null;
  } catch (error) {
    lidMappingCache.set(cacheKey, null);
    return null;
  }
};

// Normalize JID handling LID conversion
const normalizeJidWithLid = (jid) => {
  if (!jid) return jid;

  try {
    const decoded = jidDecode(jid);
    if (!decoded?.user) {
      return `${jid.split(":")[0].split("@")[0]}@s.whatsapp.net`;
    }

    let user = decoded.user;
    let server = decoded.server === "c.us" ? "s.whatsapp.net" : decoded.server;

    const mapToPn = () => {
      const pnUser = getLidMappingValue(user, "lidToPn");
      if (pnUser) {
        user = pnUser;
        server = server === "hosted.lid" ? "hosted" : "s.whatsapp.net";
        return true;
      }
      return false;
    };

    if (server === "lid" || server === "hosted.lid") {
      mapToPn();
    } else if (server === "s.whatsapp.net" || server === "hosted") {
      mapToPn();
    }

    if (server === "hosted") {
      return jidEncode(user, "hosted");
    }
    return jidEncode(user, "s.whatsapp.net");
  } catch (error) {
    return jid;
  }
};

// Build comparable JID variants (PN + LID) for matching
const buildComparableIds = (jid) => {
  if (!jid) return [];

  try {
    const decoded = jidDecode(jid);
    if (!decoded?.user) {
      return [normalizeJidWithLid(jid)].filter(Boolean);
    }

    const variants = new Set();
    const normalizedServer = decoded.server === "c.us" ? "s.whatsapp.net" : decoded.server;

    variants.add(jidEncode(decoded.user, normalizedServer));

    const isPnServer = normalizedServer === "s.whatsapp.net" || normalizedServer === "hosted";
    const isLidServer = normalizedServer === "lid" || normalizedServer === "hosted.lid";

    if (isPnServer) {
      const lidUser = getLidMappingValue(decoded.user, "pnToLid");
      if (lidUser) {
        const lidServer = normalizedServer === "hosted" ? "hosted.lid" : "lid";
        variants.add(jidEncode(lidUser, lidServer));
      }
    } else if (isLidServer) {
      const pnUser = getLidMappingValue(decoded.user, "lidToPn");
      if (pnUser) {
        const pnServer = normalizedServer === "hosted.lid" ? "hosted" : "s.whatsapp.net";
        variants.add(jidEncode(pnUser, pnServer));
      }
    }

    return Array.from(variants);
  } catch (error) {
    return [jid];
  }
};

// Find participant by either PN JID or LID JID
const findParticipant = (participants = [], userIds) => {
  const targets = (Array.isArray(userIds) ? userIds : [userIds])
    .filter(Boolean)
    .flatMap((id) => buildComparableIds(id));

  if (!targets.length) return null;

  return (
    participants.find((participant) => {
      if (!participant) return false;

      const participantIds = [
        participant.id,
        participant.lid,
        participant.userJid,
      ]
        .filter(Boolean)
        .flatMap((id) => buildComparableIds(id));

      return participantIds.some((id) => targets.includes(id));
    }) || null
  );
};

const isAdmin = async (sock, participant, groupId, groupMetadata = null) => {
  if (!participant) return false;

  // Early return for non-group JIDs (DMs) - prevents slow sock.groupMetadata() call
  if (!groupId || !groupId.endsWith("@g.us")) {
    return false;
  }

  // Always fetch live metadata for admin checks
  let liveMetadata = groupMetadata;
  if (!liveMetadata || !liveMetadata.participants) {
    if (groupId) {
      liveMetadata = await getLiveGroupMetadata(sock, groupId);
    } else {
      return false;
    }
  }

  if (!liveMetadata || !liveMetadata.participants) return false;

  // Use findParticipant to handle LID matching
  const foundParticipant = findParticipant(liveMetadata.participants, participant);
  if (!foundParticipant) return false;

  return foundParticipant.admin === "admin" || foundParticipant.admin === "superadmin";
};

const isBotAdmin = async (sock, groupId, groupMetadata = null) => {
  if (!sock.user || !groupId) return false;

  // Early return for non-group JIDs (DMs) - prevents slow sock.groupMetadata() call
  if (!groupId.endsWith("@g.us")) {
    return false;
  }

  try {
    // Get bot's JID - Baileys stores it in sock.user.id
    const botId = sock.user.id;
    const botLid = sock.user.lid;

    if (!botId) return false;

    // Prepare bot JIDs to check - findParticipant will normalize them via buildComparableIds
    const botJids = [botId, botLid].filter(Boolean);

    let liveMetadata = groupMetadata;
    if (!liveMetadata || !liveMetadata.participants) {
      liveMetadata = await getLiveGroupMetadata(sock, groupId);
    }

    if (!liveMetadata || !liveMetadata.participants) return false;

    const foundBotParticipant = findParticipant(liveMetadata.participants, botJids);

    return (
      foundBotParticipant &&
      (foundBotParticipant.admin === "admin" ||
        foundBotParticipant.admin === "superadmin")
    );
  } catch (error) {
    console.error("Error checking bot admin status:", error);
    return false;
  }
};

const handleMessage = async (sock, msg, store) => {
  const messageContent = getMessageContent(msg);
  if (!messageContent) return;

  const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
  const isCmd = body.startsWith(config.prefix);
  const sender = msg.key.remoteJid;
  const fromMe = msg.key.fromMe;
  const isGroup = sender.endsWith("@g.us");
  const args = body.slice(config.prefix.length).trim().split(/ +/).slice(1);
  const commandName = body.slice(config.prefix.length).trim().split(/ +/).shift().toLowerCase();

  const command = commands.get(commandName);

  const extra = {
    // Helper to reply to the message
    reply: async (text, options = {}) => {
      await sock.sendMessage(sender, { text: text, ...options }, { quoted: msg });
    },
    // Helper to send a message to a specific JID
    send: async (jid, content, options = {}) => {
      await sock.sendMessage(jid, content, options);
    },
    // Helper to get message type
    getMessageType: (message) => {
      if (message.imageMessage) return 'image';
      if (message.videoMessage) return 'video';
      if (message.stickerMessage) return 'sticker';
      if (message.audioMessage) return 'audio';
      if (message.documentMessage) return 'document';
      if (message.locationMessage) return 'location';
      if (message.contactMessage) return 'contact';
      if (message.extendedTextMessage) return 'text';
      if (message.conversation) return 'text';
      return 'unknown';
    },
    // Helper to get quoted message
    getQuotedMessage: () => {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quoted) {
        return { type: extra.getMessageType(quoted), content: quoted };
      }
      return null;
    },
    // Helper to get media buffer
    getMediaBuffer: async () => {
      if (msg.message.imageMessage) {
        return await sock.downloadMediaMessage(msg);
      }
      if (msg.message.videoMessage) {
        return await sock.downloadMediaMessage(msg);
      }
      if (msg.message.stickerMessage) {
        return await sock.downloadMediaMessage(msg);
      }
      return null;
    },
    // Helper to check if message contains a URL
    containsURL: (text) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return urlRegex.test(text);
    },
    // Helper to get URLs from text
    getURLs: (text) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text.match(urlRegex) || [];
    },
    // Helper to kick a participant
    kickParticipant: async (groupId, participantId) => {
      await sock.groupParticipantsUpdate(groupId, [participantId], 'remove');
    },
    // Helper to delete a message
    deleteMessage: async (key) => {
      await sock.sendMessage(key.remoteJid, { delete: key });
    },
    // Helper to warn a user
    warnUser: (groupId, userId, reason) => {
      return database.addWarning(groupId, userId, reason);
    },
    // Helper to get warnings
    getWarnings: (groupId, userId) => {
      return database.getWarnings(groupId, userId);
    },
    // Helper to clear warnings
    clearWarnings: (groupId, userId) => {
      return database.clearWarnings(groupId, userId);
    },
    // Helper to check if user is owner
    isOwner: isOwner(msg.key.participant || sender),
    // Helper to check if user is admin
    isAdmin: isGroup ? await isAdmin(sock, msg.key.participant, sender) : false,
    // Helper to check if bot is admin
    isBotAdmin: isGroup ? await isBotAdmin(sock, sender) : false,
    // Helper to get group settings
    getGroupSettings: (groupId) => {
      return database.getGroupSettings(groupId);
    },
    // Helper to update group settings
    updateGroupSettings: (groupId, settings) => {
      return database.updateGroupSettings(groupId, settings);
    },
    // Helper to get user data
    getUser: (userId) => {
      return database.getUser(userId);
    },
    // Helper to update user data
    updateUser: (userId, data) => {
      return database.updateUser(userId, data);
    },
    // Helper to get group metadata
    getGroupMetadata: async (groupId) => {
      return await getCachedGroupMetadata(sock, groupId);
    },
    // Helper to get live group metadata
    getLiveGroupMetadata: async (groupId) => {
      return await getLiveGroupMetadata(sock, groupId);
    },
    // Helper to normalize JID
    normalizeJid: normalizeJid,
    // Helper to normalize JID with LID
    normalizeJidWithLid: normalizeJidWithLid,
    // Helper to build comparable IDs
    buildComparableIds: buildComparableIds,
    // Helper to find participant
    findParticipant: findParticipant,
    // Helper to check if a user is a moderator
    isMod: isMod(msg.key.participant || sender),
    // The original message object
    msg: msg,
    // The raw message content
    messageContent: messageContent,
    // The sender's JID
    from: sender,
    // Whether the message is from a group
    isGroup: isGroup,
    // The message body
    body: body,
    // The command arguments
    args: args,
    // The command name
    commandName: commandName,
  };

  // Record message for group stats (if implemented)
  // addMessage(sender, msg.key.participant);

  // Antilink feature
  if (isGroup) {
    const groupSettings = extra.getGroupSettings(sender);
    if (groupSettings.antilink && extra.containsURL(body)) {
      const botIsAdmin = await extra.isBotAdmin;
      const senderIsAdmin = await extra.isAdmin;
      const senderIsOwner = extra.isOwner;

      if (!senderIsAdmin && !senderIsOwner && botIsAdmin) {
        const action = groupSettings.antilinkAction;
        if (action === 'delete') {
          await extra.deleteMessage(msg.key);
          await extra.reply('Link detected! Message deleted.');
        } else if (action === 'kick') {
          await extra.kickParticipant(sender, msg.key.participant);
          await extra.reply('Link detected! User kicked.');
        }
      }
    }
  }

  if (isCmd && command) {
    if (command.groupOnly && !isGroup) {
      return extra.reply(config.messages.groupOnly);
    }
    if (command.adminOnly && !extra.isAdmin) {
      return extra.reply(config.messages.adminOnly);
    }
    if (command.botAdminNeeded && !extra.isBotAdmin) {
      return extra.reply(config.messages.botAdminNeeded);
    }
    if (command.ownerOnly && !extra.isOwner) {
      return extra.reply(config.messages.ownerOnly);
    }

    try {
      await command.execute(sock, msg, args, extra);
    } catch (error) {
      console.error("Error executing command:", error);
      await extra.reply(config.messages.error);
    }
  }
};

const handleGroupParticipantsUpdate = async (sock, update) => {
  const groupId = update.id;
  const participants = update.participants;
  const action = update.action;

  const groupSettings = database.getGroupSettings(groupId);
  const groupMetadata = await getCachedGroupMetadata(sock, groupId);

  if (!groupMetadata) return;

  for (const participant of participants) {
    if (action === "add" && groupSettings.welcome) {
      let welcomeMessage = groupSettings.welcomeMessage;
      welcomeMessage = welcomeMessage.replace(/@user/g, `@${participant.split("@")[0]}`);
      welcomeMessage = welcomeMessage.replace(/@group/g, groupMetadata.subject);
      welcomeMessage = welcomeMessage.replace(/groupDesc/g, groupMetadata.desc || "");
      welcomeMessage = welcomeMessage.replace(/botName/g, config.botName);
      welcomeMessage = welcomeMessage.replace(/#memberCount/g, groupMetadata.participants.length);
      welcomeMessage = welcomeMessage.replace(/time⏰/g, new Date().toLocaleTimeString());

      await sock.sendMessage(groupId, {
        text: welcomeMessage,
        mentions: [participant],
      });
    } else if (action === "remove" && groupSettings.goodbye) {
      let goodbyeMessage = groupSettings.goodbyeMessage;
      goodbyeMessage = goodbyeMessage.replace(/@user/g, `@${participant.split("@")[0]}`);
      goodbyeMessage = goodbyeMessage.replace(/botName/g, config.botName);

      await sock.sendMessage(groupId, {
        text: goodbyeMessage,
        mentions: [participant],
      });
    }
  }
};

const handleMessageDelete = async (sock, update, store) => {
  const groupId = update.chat;
  const messageKey = update.key;

  const groupSettings = database.getGroupSettings(groupId);

  if (groupSettings.antidelete) {
    const deletedMessage = await store.loadMessage(groupId, messageKey.id);
    if (deletedMessage) {
      await sock.sendMessage(groupId, {
        text: `*Antidelete Activated!*\n\nSomeone tried to delete a message:\n\nSender: @${deletedMessage.key.participant.split("@")[0]}\nMessage: ${deletedMessage.message.conversation || deletedMessage.message.extendedTextMessage?.text || "(Non-text message)"}`,
        mentions: [deletedMessage.key.participant],
      });
    }
  }
};

const handleCall = async (sock, calls) => {
  for (const call of calls) {
    if (call.status === "offer") {
      const userId = call.from;
      const userSettings = database.getUser(userId);

      if (userSettings.anticall) {
        await sock.sendMessage(userId, { text: "I'm sorry, I cannot receive calls." });
        await sock.updateBlockStatus(userId, "block");
      }
    }
  }
};

module.exports = {
  handleMessage,
  handleGroupParticipantsUpdate,
  handleMessageDelete,
  handleCall,
};
