const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  handleSetNoteCommand: async (msg, args) => {
    const greeting = getGreeting();
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      const value = quotedMsg.body;
      const key = args[0] ? args[0].trim() : null;
      if (key) {
        await prisma.notes.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
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

  handleGetNoteCommand: async (msg, args) => {
    const greeting = getGreeting();
    const noteKey = args[0] ? args[0].trim() : null;
    if (noteKey) {
      const note = await prisma.notes.findUnique({
        where: { key: noteKey },
      });
      if (note) {
        msg.reply(
          `${greeting}${createResponse(
            "GET NOTE",
            `📝 *${noteKey}* = *${note.value}*`
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
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "GET NOTE",
          "❌ *Format salah!* Gunakan: `!getnote <key>`. 😊",
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
      if (noteKeyToEdit) {
        const existingNote = await prisma.notes.findUnique({
          where: { key: noteKeyToEdit },
        });
        if (existingNote) {
          await prisma.notes.update({
            where: { key: noteKeyToEdit },
            data: { value },
          });
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
            "❌ *Format salah!* Gunakan: `!editnote <key>` dan reply pesan untuk value. 😊",
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

  handleDeleteNoteCommand: async (msg, args) => {
    const greeting = getGreeting();
    const noteKeyToDelete = args[0] ? args[0].trim() : null;
    if (noteKeyToDelete) {
      const existingNote = await prisma.notes.findUnique({
        where: { key: noteKeyToDelete },
      });
      if (existingNote) {
        await prisma.notes.delete({
          where: { key: noteKeyToDelete },
        });
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
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "DELETE NOTE",
          "❌ *Format salah!* Gunakan: `!deletenote <key>`. 😊",
          true
        )}`
      );
    }
  },

  handleNoteCommand: async (msg) => {
    const greeting = getGreeting();
    const allNotes = await prisma.notes.findMany();
    const noteListMessage =
      allNotes.length > 0
        ? `📜 *Daftar Note:*\n${allNotes
            .map((note) => `📝 *${note.key}* = *${note.value}*`)
            .join("\n")}`
        : `❌ *Tidak ada note yang tersimpan.*`;
    msg.reply(`${greeting}${createResponse("NOTE", noteListMessage)}`);
  },
};
