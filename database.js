/**
 * Simple JSON-based Database for Group Settings, Users, Warnings, and Premium Features
 */

const fs = require("fs");
const path = require("path");
const config = require("./config");

const DB_PATH = path.join(__dirname, "database");
const GROUPS_DB = path.join(DB_PATH, "groups.json");
const USERS_DB = path.join(DB_PATH, "users.json");
const WARNINGS_DB = path.join(DB_PATH, "warnings.json");
const MODS_DB = path.join(DB_PATH, "mods.json");
const PREMIUM_DB = path.join(DB_PATH, "premium.json"); // New: Premium users database
const USAGE_DB = path.join(DB_PATH, "usage.json"); // New: User command usage database

// Initialize database directory
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

// Initialize database files
const initDB = (filePath, defaultData = {}) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initDB(GROUPS_DB, {});
initDB(USERS_DB, {});
initDB(WARNINGS_DB, {});
initDB(MODS_DB, { moderators: [] });
initDB(PREMIUM_DB, { premiumUsers: [] }); // Initialize premium DB
initDB(USAGE_DB, {}); // Initialize usage DB

// Read database
const readDB = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading database ${filePath}: ${error.message}`);
    return {};
  }
};

// Write database
const writeDB = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing database ${filePath}: ${error.message}`);
    return false;
  }
};

// Group Settings
const getGroupSettings = (groupId) => {
  const groups = readDB(GROUPS_DB);
  if (!groups[groupId]) {
    groups[groupId] = { ...config.defaultGroupSettings };
    writeDB(GROUPS_DB, groups);
  }
  return groups[groupId];
};

const updateGroupSettings = (groupId, settings) => {
  const groups = readDB(GROUPS_DB);
  groups[groupId] = { ...groups[groupId], ...settings };
  return writeDB(GROUPS_DB, groups);
};

// User Data (General)
const getUser = (userId) => {
  const users = readDB(USERS_DB);
  if (!users[userId]) {
    users[userId] = {
      registered: Date.now(),
      banned: false,
    };
    writeDB(USERS_DB, users);
  }
  return users[userId];
};

const updateUser = (userId, data) => {
  const users = readDB(USERS_DB);
  users[userId] = { ...users[userId], ...data };
  return writeDB(USERS_DB, users);
};

// Premium User Management
const getPremiumUsers = () => {
  const premiumData = readDB(PREMIUM_DB);
  return premiumData.premiumUsers || [];
};

const isPremium = (userId) => {
  // Check config.premiumNumbers first for permanent premium access
  const normalizedUserId = userId.split("@")[0];
  if (config.premiumNumbers.includes(normalizedUserId)) {
    return true;
  }

  const premiumUsers = getPremiumUsers();
  const user = premiumUsers.find(u => u.id === userId);
  if (user && user.premiumUntil && user.premiumUntil > Date.now()) {
    return true;
  }
  return false;
};

const addPremiumUser = (userId, durationDays) => {
  const premiumData = readDB(PREMIUM_DB);
  let premiumUsers = premiumData.premiumUsers || [];

  const existingUserIndex = premiumUsers.findIndex(u => u.id === userId);
  const premiumUntil = Date.now() + durationDays * 24 * 60 * 60 * 1000; // Calculate expiration date

  if (existingUserIndex !== -1) {
    // Update existing premium user
    premiumUsers[existingUserIndex].premiumUntil = premiumUntil;
  } else {
    // Add new premium user
    premiumUsers.push({ id: userId, premiumUntil: premiumUntil });
  }

  premiumData.premiumUsers = premiumUsers;
  return writeDB(PREMIUM_DB, premiumData);
};

const removePremiumUser = (userId) => {
  const premiumData = readDB(PREMIUM_DB);
  let premiumUsers = premiumData.premiumUsers || [];

  premiumUsers = premiumUsers.filter(u => u.id !== userId);

  premiumData.premiumUsers = premiumUsers;
  return writeDB(PREMIUM_DB, premiumData);
};

// Usage Tracking (AI and Sticker)
const getUserUsage = (userId) => {
  const usageData = readDB(USAGE_DB);
  const today = new Date().toDateString(); // Get today's date string for daily reset

  if (!usageData[userId] || usageData[userId].lastResetDate !== today) {
    // Reset usage if it's a new day or user doesn't exist
    usageData[userId] = {
      ai: 0,
      sticker: 0,
      lastResetDate: today,
    };
    writeDB(USAGE_DB, usageData);
  }
  return usageData[userId];
};

const incrementUsage = (userId, type) => {
  const usageData = readDB(USAGE_DB);
  const today = new Date().toDateString();

  if (!usageData[userId] || usageData[userId].lastResetDate !== today) {
    // Reset usage if it's a new day
    usageData[userId] = {
      ai: 0,
      sticker: 0,
      lastResetDate: today,
    };
  }

  if (usageData[userId][type] !== undefined) {
    usageData[userId][type]++;
  }
  return writeDB(USAGE_DB, usageData);
};

// Warnings System
const getWarnings = (groupId, userId) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;
  return warnings[key] || { count: 0, warnings: [] };
};

const addWarning = (groupId, userId, reason) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;

  if (!warnings[key]) {
    warnings[key] = { count: 0, warnings: [] };
  }

  warnings[key].count++;
  warnings[key].warnings.push({
    reason,
    date: Date.now(),
  });

  writeDB(WARNINGS_DB, warnings);
  return warnings[key];
};

const removeWarning = (groupId, userId) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;

  if (warnings[key] && warnings[key].count > 0) {
    warnings[key].count--;
    warnings[key].warnings.pop();
    writeDB(WARNINGS_DB, warnings);
    return true;
  }
  return false;
};

const clearWarnings = (groupId, userId) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;
  delete warnings[key];
  return writeDB(WARNINGS_DB, warnings);
};

// Moderators System
const getModerators = () => {
  const mods = readDB(MODS_DB);
  return mods.moderators || [];
};

const addModerator = (userId) => {
  const mods = readDB(MODS_DB);
  if (!mods.moderators) mods.moderators = [];
  if (!mods.moderators.includes(userId)) {
    mods.moderators.push(userId);
    return writeDB(MODS_DB, mods);
  }
  return false;
};

const removeModerator = (userId) => {
  const mods = readDB(MODS_DB);
  if (mods.moderators) {
    mods.moderators = mods.moderators.filter((id) => id !== userId);
    return writeDB(MODS_DB, mods);
  }
  return false;
};

const isModerator = (userId) => {
  const mods = getModerators();
  return mods.includes(userId);
};

module.exports = {
  getGroupSettings,
  updateGroupSettings,
  getUser,
  updateUser,
  getWarnings,
  addWarning,
  removeWarning,
  clearWarnings,
  getModerators,
  addModerator,
  removeModerator,
  isModerator,
  getPremiumUsers, // Export new premium functions
  isPremium,
  addPremiumUser,
  removePremiumUser,
  getUserUsage, // Export new usage functions
  incrementUsage,
};
