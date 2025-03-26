const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");

const prisma = new PrismaClient();

// ====================== 📌 MENU & BANTUAN ======================

// 📌 Menu utama
const handleMenuCommand = (msg) => {
  sendReply(
    msg,
    "📌 *MENU UTAMA*",
    `✅ *Pilih Command:*\n\n` +
      `📋 To-Do List \`!todo\`\n` +
      `📜 Catatan \`!note\`\n` +
      `💰 Keuangan \`!balance\`\n` +
      `📦 Arsip \`!archive\`\n` +
      `❓ Bantuan \`!help\``
  );
};

// ℹ️ Bantuan Utama
const handleHelpCommand = (msg, category = "") => {
  if (!category || typeof category !== "string") {
    return sendReply(
      msg,
      "❓ *BANTUAN*",
      `Silakan pilih kategori bantuan:\n` +
        `🔑 *Data* → \`!help data\`\n` +
        `📋 *To-Do List* → \`!help todo\`\n` +
        `📜 *Catatan* → \`!help note\`\n` +
        `💰 *Keuangan* → \`!help finance\`\n` +
        `📦 *Arsip* → \`!help archive\`\n` +
        `🔹 *General* → \`!help general\``
    );
  }

  const helpMessages = {
    data:
      `🔑 *Data*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `◦ 📝 *!set [key] [isi]* → Simpan data\n` +
      `  📝 Contoh: *!set nama [reply pesan]*\n` +
      `◦ 📖 *!get [key]* → Ambil data\n` +
      `  📖 Contoh: *!get nama*\n` +
      `◦ 🗑️ *!delete [key]* → Hapus data\n` +
      `  🗑️ Contoh: *!delete nama*\n`
      + `━━━━━━━━━━━━━━━━━━━━`, 

    todo:
      `📋 *To-Do List*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `◦ ✍️ *!addtodo [tugas]* → Tambah tugas\n` +
      `  📌 Contoh: *!addtodo Meeting besok jam 10*\n` +
      `◦ ✅ *!donetodo [tugas]* → Tandai selesai\n` +
      `  ✅ Contoh: *!donetodo Meeting besok jam 10*\n` +
      `◦ ❌ *!deletetodo [tugas]* → Hapus tugas\n` +
      `  🗑️ Contoh: *!deletetodo Meeting besok jam 10*\n` +
      `━━━━━━━━━━━━━━━━━━━━`,
    note:
      `📜 *Catatan*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `◦ 📝 *!setnote [key] [isi]* → Simpan catatan\n` +
      `  ✍️ Contoh: *!setnote ide [reply pesan]*\n` +
      `◦ 📖 *!getnote [key]* → Ambil catatan\n` +
      `  📖 Contoh: *!getnote ide*\n` +
      `◦ 🗑️ *!deletenote [key]* → Hapus catatan\n` +
      `  🗑️ Contoh: *!deletenote ide*\n` +
      `━━━━━━━━━━━━━━━━━━━━`,
    finance:
      `💰 *Keuangan*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `◦ 📥 *!income [jumlah] [desk]* → Tambah pemasukan\n` +
      `  ➕ Contoh: *!income 50000 Gaji freelance*\n` +
      `◦ 📤 *!expense [jumlah] [desk]* → Tambah pengeluaran\n` +
      `  ➖ Contoh: *!expense 20000 Makan siang*\n` +
      `◦ 💰 *!balance* → Cek saldo\n` +
      `  💰 Contoh: *!balance*\n` +
      `◦ 📊 *!report* → Laporan Excel\n` +
      `  📊 Contoh: *!report*\n` +
      `━━━━━━━━━━━━━━━━━━━━`,
    archive:
      `📦 *Arsip*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `◦ 📜 *!archive* → Lihat data yang dihapus\n` +
      `  📦 Contoh: *!archive*\n` +
      `◦ 🔄 *!restore [kategori] [nama]* → Pulihkan data\n` +
      `  🔄 Contoh: *!restore todo Meeting*\n` +
      `━━━━━━━━━━━━━━━━━━━━`,
    general:
      `🔹 *General Commands*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `◦ ℹ️ *!info* → Info tentang bot\n` +
      `  ℹ️ Contoh: *!info*\n` +
      `◦ 📝 *!feedback* → Kirim masukan\n` +
      `  📨 Contoh: *COMING SOON*\n` +
      `◦ 🗑️ *!resetall* → Reset semua data\n` +
      `  ⚠️ Contoh: *!resetall*\n` +
      `━━━━━━━━━━━━━━━━━━━━`,
  };

  const response = helpMessages[category.toLowerCase()];
  if (response) {
    return msg.reply(response);
  } else {
    return msg.reply(
      "🚫 Kategori tidak ditemukan. Gunakan `!help` untuk melihat daftar kategori."
    );
  }
};

// ====================== ℹ️ GENERAL COMMANDS ======================

// ℹ️ Info Bot
const handleInfoCommand = (msg) => {
  msg.reply(
    "🤖 *CHACA BOT - SOLUSI ANAK MPK OSIS*\n\n" +
      "Halo! Aku *Chaca Bot*, asisten andalan MPK OSIS! 🎓✨\n\n" +
      "📌 Aku siap membantumu mengelola jobdesk, mencatat evaluasi, mengatur keuangan, membuat to-do list, & mengingatkan agenda penting!\n" +
      "🚀 Gunakan *!help* untuk melihat semua fitur keren yang bisa aku lakukan."
  );
};

// 📝 Feedback
const handleFeedbackCommand = (msg) => {
  msg.reply("📝 *FEEDBACK*\n\nCOMING SOON...");
};

// 🗝️ Secret Command
const handleSecretCommand = (msg) => {
  msg.reply(
    `🗝️ *RAHASIA PENCIPTA BOT*\n\n` +
      `"Bot ini dibuat sebagai bentuk keseriusanku saat memiliki perasaan terhadap seseorang. ` +
      `Mungkin dia tak akan pernah tahu, atau mungkin ini hanya akan menjadi kisah yang tersimpan di balik layar.\n` +
      `💙 *- Pembuat Chaca Bot*"`
  );
};

// ====================== 📦 MANAJEMEN DATA ======================

// 📦 Lihat Arsip
const handleArchiveCommand = async (msg) => {
  const [archived, archivedNotes, archivedTodo, archivedFinance] =
    await Promise.all([
      prisma.data.findMany({ where: { isDeleted: true } }),
      prisma.notes.findMany({ where: { isDeleted: true } }),
      prisma.todo.findMany({ where: { isDeleted: true } }),
      prisma.finance.findMany({ where: { isDeleted: true } }),
    ]);

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
      "❌ *Format salah!* Gunakan: `!restore [kategori] [nama]`"
    );
  }

  const tableMap = { note: "notes", todo: "todo", finance: "finance" };
  if (!tableMap[category]) return msg.reply("❌ *Kategori tidak valid!*");

  const updated = await prisma[tableMap[category]].updateMany({
    where: {
      OR: [{ key: name }, { task: name }, { description: name }],
      isDeleted: true,
    },
    data: { isDeleted: false },
  });

  msg.reply(
    updated.count > 0
      ? `✅ *${name}* berhasil dipulihkan!`
      : `❌ *${name}* tidak ditemukan dalam arsip.`
  );
};

// 🗑️ Reset Semua Data
const handleResetAllCommand = async (msg) => {
  await prisma.$transaction([
    prisma.notes.deleteMany({ where: { isDeleted: true } }),
    prisma.todo.deleteMany({ where: { isDeleted: true } }),
    prisma.finance.deleteMany({ where: { isDeleted: true } }),
  ]);
  msg.reply("🗑️ *Semua data terarsip telah dihapus!* ❌");
};

// ====================== EXPORT MODULE ======================
module.exports = {
  handleMenuCommand,
  handleHelpCommand,
  handleInfoCommand,
  handleFeedbackCommand,
  handleSecretCommand,
  handleArchiveCommand,
  handleRestoreCommand,
  handleResetAllCommand,
};

// ====================== END OF FILE ======================
