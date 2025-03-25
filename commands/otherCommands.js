const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");

const prisma = new PrismaClient();

// 📌 Menu utama
const handleMenuCommand = (msg) => {
  sendReply(
    msg,
    "📌 *MENU UTAMA*",
    `✅ *Pilih Command:*\n\n` +
      `📋 To-Do List (!todo)\n` +
      `📜 Catatan (!note)\n` +
      `💰 Keuangan (!balance)\n` +
      `⏰ Reminder (!reminders)\n` +
      `📦 Arsip (!archive)\n` + // ✅ Menambahkan fitur arsip
      `❓ Bantuan (!help)`
  );
};

// ℹ️ Bantuan
const handleHelpCommand = (msg) => {
  sendReply(
    msg,
    "❓ *BANTUAN*",
    `🔹 *General Commands:*\n` +
      `  - ℹ️ !info → Info tentang bot\n` +
      `  - 📝 !feedback → Kirim masukan\n` +
      `  - 🗑️ !resetall → Reset semua data\n\n` +
      `📋 *To-Do List:*\n` +
      `  - ✍️ !addtodo [tugas] → Tambah tugas\n` +
      `  - ✅ !donetodo [tugas] → Tandai selesai\n` +
      `  - ❌ !deletetodo [tugas] → Hapus tugas\n\n` +
      `📜 *Catatan:*\n` +
      `  - 📝 !setnote [key] → Simpan catatan\n` +
      `  - 📖 !getnote [key] → Ambil catatan\n` +
      `  - 🗑️ !deletenote [key] → Hapus catatan\n\n` +
      `💰 *Keuangan:*\n` +
      `  - 📥 !income [jumlah] [deskripsi] → Tambah pemasukan\n` +
      `  - 📤 !expense [jumlah] [deskripsi] → Tambah pengeluaran\n` +
      `  - 💰 !balance → Cek saldo\n` +
      `  - 📊 !report → Laporan Excel\n\n` +
      `📦 *Arsip:*\n` +
      `  - 📜 !archive → Lihat data yang dihapus\n` +
      `  - 🔄 !restore [kategori] [nama] → Pulihkan data\n\n` +
      `💬 *Lainnya:*\n` +
      `  - 🔖 !brat → Buat stiker teks\n`
  );
};

// ℹ️ Info Bot
const handleInfoCommand = (msg) => {
  sendReply(
    msg,
    "🤖 *CHACA BOT - SOLUSI ANAK MPK OSIS*",
    `Halo! Aku *Chaca Bot*, asisten andalan MPK OSIS! 🎓✨\n\n` +
      `📌 Aku siap membantumu mengelola jobdesk, mencatat evaluasi, mengatur keuangan, membuat to-do list, & mengingatkan agenda penting!\n` +
      `🚀 Gunakan *!help* untuk melihat semua fitur keren yang bisa aku lakukan.`
  );
};

// 📝 Feedback
const handleFeedbackCommand = (msg) => {
  sendReply(
    msg,
    "📝 *FEEDBACK*",
    `Terima kasih atas masukan Anda! 🙏\nSilakan isi di sini:\nhttps://bot-advice.netlify.app/`
  );
};

// 🗝️ Secret Command
const handleSecretCommand = (msg) => {
  msg.reply(
    `🗝️ *RAHASIA PENCIPTA BOT*\n
Mungkin bagi sebagian orang, bot ini hanyalah sebuah alat.
Namun, bagiku, setiap baris kode yang kutulis adalah bukti dari sesuatu yang lebih besar.\n
💬 "Bot ini dibuat sebagai bentuk keseriusanku saat memiliki perasaan terhadap seseorang. 
Setiap fitur yang kutambahkan mencerminkan usahaku untuk menjadi lebih baik, untuk menunjukkan bahwa aku peduli.
Mungkin dia tak akan pernah tahu, atau mungkin ini hanya akan menjadi kisah yang tersimpan di balik layar.
Tapi bagiku, ini adalah caraku mengungkapkan sesuatu yang sulit diucapkan dengan kata-kata."\n
🖤 *Dia adalah orang terakhir yang menerima semua effort ini, sampai aku bertemu dengan seseorang yang benar-benar serius.*\n
💙 *- Pembuat Chaca Bot*`
  );
};

// 🗑️ Reset Semua Data
const handleResetAllCommand = async (msg) => {
  try {
    // Hapus semua data yang sudah diarsipkan (isDeleted: true)
    await prisma.$transaction([
      prisma.data.deleteMany({ where: { isDeleted: true } }),
      prisma.notes.deleteMany({ where: { isDeleted: true } }),
      prisma.finance.deleteMany({ where: { isDeleted: true } }),
      prisma.todo.deleteMany({ where: { isDeleted: true } }),
    ]);

    msg.reply(
      "🗑️ *Semua data yang diarsipkan telah dihapus secara permanen!* ❌"
    );
  } catch (error) {
    console.error("❌ Gagal menghapus data yang diarsipkan:", error);
    msg.reply("❌ *Gagal menghapus data yang diarsipkan. Coba lagi!*");
  }
};

// 📦 Lihat Arsip
const handleArchiveCommand = async (msg) => {
  const archived = await prisma.data.findMany({ where: { isDeleted: true } });
  const archivedNotes = await prisma.notes.findMany({
    where: { isDeleted: true },
  });
  const archivedTodo = await prisma.todo.findMany({
    where: { isDeleted: true },
  });
  const archivedFinance = await prisma.finance.findMany({
    where: { isDeleted: true },
  });

  const message =
    `📦 *Data Terarsip:*\n\n` +
    `🔑 *Data:*\n${
      archived.map((n) => `- ${n.key}`).join("\n") || "Tidak ada"
    }\n\n` +
    `📜 *Catatan:*\n${
      archivedNotes.map((n) => `- ${n.key}`).join("\n") || "Tidak ada"
    }\n\n` +
    `📋 *To-Do List:*\n${
      archivedTodo.map((t) => `- ${t.task}`).join("\n") || "Tidak ada"
    }\n\n` +
    `💰 *Keuangan:*\n${
      archivedFinance
        .map((f) => `- ${f.description} (${f.amount})`)
        .join("\n") || "Tidak ada"
    }`;

  sendReply(msg, "📦 *ARSIP*", message);
};

// 🔄 Pulihkan Data
const handleRestoreCommand = async (msg, args) => {
  const category = args[0];
  const name = args.slice(1).join(" ").trim();

  if (!category || !name) {
    return msg.reply(
      "❌ *Format salah!*\nGunakan: `!restore [kategori] [nama]`\n📌 Contoh: `!restore note tugas`"
    );
  }

  let updated = false;

  if (category === "note") {
    updated = await prisma.notes.updateMany({
      where: { key: name, isDeleted: true },
      data: { isDeleted: false },
    });
  } else if (category === "todo") {
    updated = await prisma.todo.updateMany({
      where: { task: name, isDeleted: true },
      data: { isDeleted: false },
    });
  } else if (category === "finance") {
    updated = await prisma.finance.updateMany({
      where: { description: name, isDeleted: true },
      data: { isDeleted: false },
    });
  } else {
    return msg.reply(
      "❌ *Kategori tidak valid!*\nKategori yang tersedia: `note`, `todo`, `finance`."
    );
  }

  if (updated.count > 0) {
    msg.reply(`✅ *${name}* berhasil dipulihkan dari arsip! ✨`);
  } else {
    msg.reply(`❌ *${name}* tidak ditemukan dalam arsip.`);
  }
};

module.exports = {
  handleMenuCommand,
  handleHelpCommand,
  handleInfoCommand,
  handleFeedbackCommand,
  handleSecretCommand,
  handleResetAllCommand,
  handleArchiveCommand,
  handleRestoreCommand,
};
