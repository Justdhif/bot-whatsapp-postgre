const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  handleSetNoteCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await
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
        msg.reply(`${greeting} 📝 *${key}* berhasil disimpan di note! 🎉`);
      } else {
        msg.reply(
          `${greeting} ❌ *Format salah!* Gunakan: \`!setnote <key>\` dan reply pesan untuk value. 😊`
        );
      }
    } else {
      msg.reply(
        `${greeting} ❌ *Silakan reply pesan untuk menyimpan value.* 😊`
      );
    }
  },

  handleGetNoteCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await
    const noteKey = args[0] ? args[0].trim() : null;
    if (noteKey) {
      const note = await prisma.notes.findUnique({
        where: { key: noteKey },
      });
      if (note) {
        msg.reply(`${greeting} 📝 *${noteKey}* = *${note.value}*`);
      } else {
        msg.reply(`${greeting} ❌ *Note "${noteKey}" tidak ditemukan.*`);
      }
    } else {
      msg.reply(
        `${greeting} ❌ *Format salah!* Gunakan: \`!getnote <key>\`. 😊`
      );
    }
  },

  handleEditNoteCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await
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
            `${greeting} 📝 *${noteKeyToEdit}* berhasil diubah menjadi: *${value}* 🎉`
          );
        } else {
          msg.reply(
            `${greeting} ❌ *Note "${noteKeyToEdit}" tidak ditemukan.*`
          );
        }
      } else {
        msg.reply(
          `${greeting} ❌ *Format salah!* Gunakan: \`!editnote <key>\` dan reply pesan untuk value. 😊`
        );
      }
    } else {
      msg.reply(
        `${greeting} ❌ *Silakan reply pesan untuk mengedit value.* 😊`
      );
    }
  },

  handleDeleteNoteCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await
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
          `${greeting} 🗑️ *Note "${noteKeyToDelete}" berhasil dihapus!* ✨`
        );
      } else {
        msg.reply(
          `${greeting} ❌ *Note "${noteKeyToDelete}" tidak ditemukan.*`
        );
      }
    } else {
      msg.reply(
        `${greeting} ❌ *Format salah!* Gunakan: \`!deletenote <key>\`. 😊`
      );
    }
  },

  handleNoteCommand: async (msg) => {
    const greeting = await getGreeting(msg); // Tambahkan await
    const allNotes = await prisma.notes.findMany();
    const noteListMessage =
      allNotes.length > 0
        ? `📜 *Daftar Note:*\n${allNotes
            .map((note) => `📝 *${note.key}* = *${note.value}*`)
            .join("\n")}`
        : `❌ *Tidak ada note yang tersimpan.*`;

    const response = createResponse("NOTE", noteListMessage);

    if (response.media) {
      msg.reply(response.media, undefined, {
        caption: `${greeting}\n${response.text}`,
      });
    } else {
      msg.reply(`${greeting}\n${response.text}`);
    }
  },
};
