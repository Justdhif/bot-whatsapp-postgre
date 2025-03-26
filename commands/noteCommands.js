const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");

const prisma = new PrismaClient();

// ====================== HANDLE SET NOTE ======================
const handleSetNoteCommand = async (msg, args) => {
  try {
    if (!msg.hasQuotedMsg) {
      return msg.reply("❌ *Silakan reply pesan untuk menyimpan catatan!*");
    }

    const quotedMsg = await msg.getQuotedMessage();
    const value = quotedMsg.body;
    const key = args.join(" ").trim();

    if (!key) {
      return msg.reply(
        "❌ *Format salah!*\nGunakan: `!setnote [key]`\n📌 Contoh: `!setnote tugas` lalu reply pesan yang ingin disimpan."
      );
    }

    await prisma.notes.upsert({
      where: { key },
      update: { value, isDeleted: false },
      create: { key, value, isDeleted: false },
    });

    msg.reply(`✅ *Catatan "${key}" telah disimpan!* ✨`);
  } catch (error) {
    console.error("Set Note error:", error);
    msg.reply("❌ *Gagal menyimpan catatan!*");
  } finally {
    await prisma.$disconnect();
  }
};

// ====================== HANDLE GET NOTE ======================
const handleGetNoteCommand = async (msg, args) => {
  try {
    const key = args.join(" ").trim();
    if (!key) {
      return msg.reply(
        "❌ *Format salah!*\nGunakan: `!getnote [key]`\n📌 Contoh: `!getnote tugas`"
      );
    }

    const note = await prisma.notes.findFirst({
      where: { key, isDeleted: false },
    });

    msg.reply(
      note
        ? `📝 *Catatan "${key}":*\n${note.value}`
        : `❌ *Catatan "${key}" tidak ditemukan!*`
    );
  } catch (error) {
    console.error("Get Note error:", error);
    msg.reply("❌ *Gagal mengambil catatan!*");
  } finally {
    await prisma.$disconnect();
  }
};

// ====================== HANDLE DELETE NOTE ======================
const handleDeleteNoteCommand = async (msg, args) => {
  try {
    const key = args.join(" ").trim();
    if (!key) {
      return msg.reply(
        "❌ *Format salah!*\nGunakan: `!deletenote [key]`\n📌 Contoh: `!deletenote tugas`"
      );
    }

    const note = await prisma.notes.findFirst({
      where: { key, isDeleted: false },
    });

    if (!note) {
      return msg.reply(`❌ *Catatan "${key}" tidak ditemukan!*`);
    }

    await prisma.notes.update({
      where: { key },
      data: { isDeleted: true },
    });

    msg.reply(`🗑️ *Catatan "${key}" telah dihapus!* ✨`);
  } catch (error) {
    console.error("Delete Note error:", error);
    msg.reply("❌ *Gagal menghapus catatan!*");
  } finally {
    await prisma.$disconnect();
  }
};

// ====================== HANDLE LIST NOTES ======================
const handleListNoteCommand = async (msg) => {
  try {
    const allNotes = await prisma.notes.findMany({
      where: { isDeleted: false },
    });

    const listMessage = allNotes.length
      ? `📜 *Daftar Catatan:*\n${allNotes
          .map((note) => `📝 *${note.key}*`)
          .join("\n")}`
      : "❌ *Tidak ada catatan yang tersimpan!*";

    sendReply(msg, "DAFTAR_CATATAN", listMessage);
  } catch (error) {
    console.error("List Note error:", error);
    sendReply(msg, "ERROR", "❌ *Gagal mengambil daftar catatan!*");
  } finally {
    await prisma.$disconnect();
  }
};

// ====================== EXPORT MODULE ======================
module.exports = {
  handleSetNoteCommand,
  handleGetNoteCommand,
  handleListNoteCommand,
  handleDeleteNoteCommand,
};

// ====================== END OF FILE ======================
