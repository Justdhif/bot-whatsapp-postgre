const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  handleMenuCommand: async (msg) => {
    const greeting = await getGreeting(msg);
    const response = createResponse(
      "MENU",
      `📌 *Pilih Command :*\n\n` +
        ` 📜 Lihat Data (!list)\n` +
        ` 📝 Lihat Catatan (!note)\n` +
        ` 💰 Cek Saldo (!balance)\n` +
        ` ⏰ Lihat Reminder (!reminders)`
    );

    if (response.media) {
      msg.reply(response.media, undefined, {
        caption: `${greeting}\n${response.text}`,
      });
    } else {
      msg.reply(`${greeting}\n${response.text}`);
    }
  },

  handleHelpCommand: async (msg) => {
    const greeting = await getGreeting(msg);
    const response = createResponse(
      "HELP",
      `📌 *Command General:*\n` +
        ` 🔑 \`!set <key>\` - Simpan data\n` +
        ` 🔑 \`!get <key>\` - Ambil data\n` +
        ` 🔑 \`!edit <key>\` - Edit data\n` +
        ` 🔑 \`!delete <key>\` - Hapus data\n` +
        ` 🔑 \`!list\` - Lihat semua data\n\n` +
        `📌 *Command Note:*\n` +
        ` 📝 \`!note\` - Lihat semua note\n` +
        ` 📝 \`!setnote <key>\` - Simpan note\n` +
        ` 📝 \`!getnote <key>\` - Ambil note\n` +
        ` 📝 \`!editnote <key>\` - Edit note\n` +
        ` 📝 \`!deletenote <key>\` - Hapus note\n\n` +
        `📌 *Command Keuangan <Khusus>:*\n` +
        ` 💰 \`!income <jumlah> <deskripsi>\` - Tambah pemasukan\n` +
        ` 💰 \`!expense <jumlah> <deskripsi>\` - Tambah pengeluaran\n` +
        ` 💰 \`!balance\` - Lihat saldo\n` +
        ` 💰 \`!report\` - Unduh laporan keuangan\n` +
        ` 💰 \`!deletefinance <income/expense> <index>\` - Hapus data keuangan\n\n` +
        `📌 *Command Reminder:*\n` +
        ` ⏰ \`!remind <tanggal> <bulan> <tahun> <jam> <menit> <pesan>\` - Atur reminder\n` +
        ` ⏰ \`!reminders\` - Lihat daftar reminder\n` +
        ` ⏰ \`!deletereminder <ID>\` - Hapus reminder\n\n` +
        `📌 *Lainnya:*\n` +
        ` ℹ️ \`!info\` - Info bot\n` +
        ` 📤 \`!feedback\` - Kirim feedback\n` +
        ` 🗑️ \`!resetall\` - Reset semua data`
    );

    if (response.media) {
      msg.reply(response.media, undefined, {
        caption: `${greeting}\n${response.text}`,
      });
    } else {
      msg.reply(`${greeting}\n${response.text}`);
    }
  },

  handleInfoCommand: async (msg) => {
    const greeting = await getGreeting(msg);
    const response = createResponse(
      "INFO",
      `🤖 Hai perkenalkan aku adalah JustBot yang dirancang untuk kebutuhan MPK OSIS.\n` +
        `Aku berfungsi untuk menyimpan segala keperluan mulai dari jobdesk setiap event, catatan hasil eval, dan lain-lain.\n` +
        `Kalian bisa ketik \`!help\` untuk melihat detailnya.\n` +
        `Jam kerja bot sudah diatur mulai dari jam 5.00 sampai 10.00 WIB.\n` +
        `Selamat mencoba! ✨`
    );

    if (response.media) {
      msg.reply(response.media, undefined, {
        caption: `${greeting}\n${response.text}`,
      });
    } else {
      msg.reply(`${greeting}\n${response.text}`);
    }
  },

  handleFeedbackCommand: async (msg) => {
    const greeting = await getGreeting(msg);
    const googleFormLink = "https://bot-advice.netlify.app/";

    const response = createResponse(
      "FEEDBACK",
      `📝 *Terima kasih atas ketertarikan Anda memberikan feedback!*\n\n` +
        `Silakan isi formulir di sini untuk memberikan saran atau masukan:\n${googleFormLink}`
    );

    if (response.media) {
      msg.reply(response.media, undefined, {
        caption: `${greeting}\n${response.text}`,
      });
    } else {
      msg.reply(`${greeting}\n${response.text}`);
    }
  },

  handleResetAllCommand: async (msg) => {
    const greeting = await getGreeting(msg);

    try {
      await prisma.data.deleteMany(); // Hapus semua data dari PostgreSQL
      await prisma.notes.deleteMany(); // Hapus semua data note dari PostgreSQL
      await prisma.finance.deleteMany(); // Hapus semua data keuangan dari PostgreSQL
      await prisma.reminders.deleteMany(); // Hapus semua data reminder dari PostgreSQL

      const responseText = `${greeting}\n🗑️ *Semua data berhasil direset!* ✨`;
      msg.reply(responseText);
    } catch (error) {
      console.error("Gagal mereset data:", error);

      const responseText = `${greeting}\n❌ *Gagal mereset data. Silakan coba lagi.*`;
      msg.reply(responseText);
    }
  },
};
