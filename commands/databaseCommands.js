const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { database } = require("../database/database");

module.exports = {
  handleSetCommand: async (msg, args) => {
    const greeting = getGreeting();
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      const value = quotedMsg.body;
      const key = args[0] ? args[0].trim() : null;
      if (key) {
        database[key] = value;
        msg.reply(
          `${greeting}${createResponse("SET", `🔑 *${key}* = *${value}* 🎉`)}`
        );
      } else {
        msg.reply(
          `${greeting}${createResponse(
            "SET",
            "❌ *Format salah!* Gunakan: `!set <key>` dan reply pesan untuk value. 😊",
            true
          )}`
        );
      }
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "SET",
          "❌ *Silakan reply pesan untuk menyimpan value.* 😊",
          true
        )}`
      );
    }
  },

  handleGetCommand: (msg, args) => {
    const greeting = getGreeting();
    const key = args[0] ? args[0].trim() : null;
    if (key && database[key]) {
      msg.reply(
        `${greeting}${createResponse(
          "GET",
          `🔑 *${key}* = *${database[key]}*`
        )}`
      );
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "GET",
          `❌ *Key "${key}" tidak ditemukan.*`,
          true
        )}`
      );
    }
  },

  handleEditCommand: async (msg, args) => {
    const greeting = getGreeting();
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      const value = quotedMsg.body;
      const key = args[0] ? args[0].trim() : null;
      if (key && database[key]) {
        database[key] = value;
        msg.reply(
          `${greeting}${createResponse("EDIT", `🔑 *${key}* = *${value}* 🎉`)}`
        );
      } else {
        msg.reply(
          `${greeting}${createResponse(
            "EDIT",
            `❌ *Key "${key}" tidak ditemukan.*`,
            true
          )}`
        );
      }
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "EDIT",
          "❌ *Silakan reply pesan untuk mengedit value.* 😊",
          true
        )}`
      );
    }
  },

  handleDeleteCommand: (msg, args) => {
    const greeting = getGreeting();
    const keyToDelete = args[0] ? args[0].trim() : null;
    if (keyToDelete && database[keyToDelete]) {
      delete database[keyToDelete];
      msg.reply(
        `${greeting}${createResponse(
          "DELETE",
          `🗑️ *Key "${keyToDelete}" berhasil dihapus!* ✨`
        )}`
      );
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "DELETE",
          `❌ *Key "${keyToDelete}" tidak ditemukan.*`,
          true
        )}`
      );
    }
  },

  handleListCommand: (msg) => {
    const greeting = getGreeting();
    const keys = Object.keys(database);
    const listMessage =
      keys.length > 0
        ? `📜 *Daftar Data:*\n${keys.map((key) => `🔑 *${key}*`).join("\n")}`
        : `❌ *Tidak ada data yang tersimpan.*`;
    msg.reply(`${greeting}${createResponse("LIST", listMessage)}`);
  },
};
