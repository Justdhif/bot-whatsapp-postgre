const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { noteDB } = require("../database/noteDB");

module.exports = {
  handleSetNoteCommand: async (msg, args) => {
    const greeting = getGreeting();
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      const value = quotedMsg.body;
      const key = args[0] ? args[0].trim() : null;
      if (key) {
        noteDB[key] = value;
        msg.reply(
          `${greeting}${createResponse(
            "SET NOTE",
            `📝 *${key}* berhasil disimpan di note! 🎉`
          )}`
        );
      } else {
        msg.reply(
          `${greeting}${createResponse(
            "SET NOTE",
            "❌ *Format salah!* Gunakan: `!setnote <key>` dan reply pesan untuk value. 😊",
            true
          )}`
        );
      }
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "SET NOTE",
          "❌ *Silakan reply pesan untuk menyimpan value.* 😊",
          true
        )}`
      );
    }
  },

  handleGetNoteCommand: (msg, args) => {
    const greeting = getGreeting();
    const noteKey = args[0] ? args[0].trim() : null;
    if (noteKey && noteDB[noteKey]) {
      msg.reply(
        `${greeting}${createResponse(
          "GET NOTE",
          `📝 *${noteKey}* = *${noteDB[noteKey]}*`
        )}`
      );
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "GET NOTE",
          `❌ *Note "${noteKey}" tidak ditemukan.*`,
          true
        )}`
      );
    }
  },

  handleEditNoteCommand: async (msg, args) => {
    const greeting = getGreeting();
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      const value = quotedMsg.body;
      const noteKeyToEdit = args[0] ? args[0].trim() : null;
      if (noteKeyToEdit && noteDB[noteKeyToEdit]) {
        noteDB[noteKeyToEdit] = value;
        msg.reply(
          `${greeting}${createResponse(
            "EDIT NOTE",
            `📝 *${noteKeyToEdit}* berhasil diubah menjadi: *${value}* 🎉`
          )}`
        );
      } else {
        msg.reply(
          `${greeting}${createResponse(
            "EDIT NOTE",
            `❌ *Note "${noteKeyToEdit}" tidak ditemukan.*`,
            true
          )}`
        );
      }
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "EDIT NOTE",
          "❌ *Silakan reply pesan untuk mengedit value.* 😊",
          true
        )}`
      );
    }
  },

  handleDeleteNoteCommand: (msg, args) => {
    const greeting = getGreeting();
    const noteKeyToDelete = args[0] ? args[0].trim() : null;
    if (noteKeyToDelete && noteDB[noteKeyToDelete]) {
      delete noteDB[noteKeyToDelete];
      msg.reply(
        `${greeting}${createResponse(
          "DELETE NOTE",
          `🗑️ *Note "${noteKeyToDelete}" berhasil dihapus!* ✨`
        )}`
      );
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "DELETE NOTE",
          `❌ *Note "${noteKeyToDelete}" tidak ditemukan.*`,
          true
        )}`
      );
    }
  },

  handleNoteCommand: (msg) => {
    const greeting = getGreeting();
    const noteKeys = Object.keys(noteDB);
    const noteListMessage =
      noteKeys.length > 0
        ? `📜 *Daftar Note:*\n${noteKeys
            .map((key) => `📝 *${key}*`)
            .join("\n")}`
        : `❌ *Tidak ada note yang tersimpan.*`;
    msg.reply(`${greeting}${createResponse("NOTE", noteListMessage)}`);
  },
};
