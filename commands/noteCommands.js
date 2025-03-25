const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");

const prisma = new PrismaClient();

// Menyimpan catatan dengan nama (key) tertentu
const handleSetNoteCommand = async (msg, args) => {
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
    update: { value },
    create: { key, value },
  });

  msg.reply(`✅ *Catatan "${key}" telah disimpan!* ✨`);
};

// Mengambil catatan berdasarkan nama (key)
const handleGetNoteCommand = async (msg, args) => {
  const key = args.join(" ").trim();
  if (!key) {
    return msg.reply(
      "❌ *Format salah!*\nGunakan: `!getnote [key]`\n📌 Contoh: `!getnote tugas`"
    );
  }

  const note = await prisma.notes.findUnique({ where: { key } });

  msg.reply(
    note
      ? `📝 *Catatan "${key}":*\n${note.value}`
      : `❌ *Catatan "${key}" tidak ditemukan!*`
  );
};

// Menampilkan daftar semua catatan
const handleListNoteCommand = async (msg) => {
  const allNotes = await prisma.notes.findMany();
  const listMessage = allNotes.length
    ? `📜 *Daftar Catatan:*\n${allNotes
        .map((note) => `📝 *${note.key}*`)
        .join("\n")}`
    : "❌ *Tidak ada catatan yang tersimpan!*";

  sendReply(msg, "DAFTAR_CATATAN", listMessage);
};

// Menghapus catatan berdasarkan nama (key)
const handleDeleteNoteCommand = async (msg, args) => {
  const key = args.join(" ").trim();
  if (!key) {
    return msg.reply(
      "❌ *Format salah!*\nGunakan: `!deletenote [key]`\n📌 Contoh: `!deletenote tugas`"
    );
  }

  const note = await prisma.notes.findUnique({ where: { key } });
  if (!note) {
    return msg.reply(`❌ *Catatan "${key}" tidak ditemukan!*`);
  }

  await prisma.notes.update({ where: { key }, data: { isDeleted: true } });
  msg.reply(`🗑️ *Catatan "${key}" telah dihapus!* ✨`);
};

module.exports = {
  handleSetNoteCommand,
  handleGetNoteCommand,
  handleListNoteCommand,
  handleDeleteNoteCommand,
};
