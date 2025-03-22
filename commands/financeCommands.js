const { PrismaClient } = require("@prisma/client");
const { getGreeting } = require("../utils/getGreeting");
const { createResponse } = require("../utils/createResponse");
const { createExcelFile } = require("../utils/financeUtils");
const { MessageMedia } = require("whatsapp-web.js");

const prisma = new PrismaClient();

// Fungsi untuk memeriksa apakah pengguna sudah login
const checkLogin = async (msg) => {
  const phone = msg.from.endsWith("@g.us")
    ? msg.author.split("@")[0] // Ambil nomor telepon pengguna jika di grup
    : msg.from.split("@")[0]; // Ambil nomor telepon pengguna jika di private chat
  const user = await prisma.user.findUnique({ where: { phone } });
  return user && user.isLoggedIn;
};

module.exports = {
  handleIncomeCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await

    if (!(await checkLogin(msg))) {
      msg.reply(`${greeting} ❌ *Anda harus login terlebih dahulu!*`);
      return;
    }

    const amount = args[0] ? parseFloat(args[0]) : null;
    const description = args.slice(1).join(" ") || "No description";

    if (!amount || isNaN(amount)) {
      msg.reply(
        `${greeting} ❌ *Format salah!* Gunakan: \`!income <jumlah> <deskripsi>\`. 😊`
      );
    } else {
      await prisma.finance.create({
        data: { type: "income", amount, description },
      });
      msg.reply(
        `${greeting} ✅ Pemasukan sebesar *${amount}* telah ditambahkan.`
      );
    }
  },

  handleExpenseCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await

    if (!(await checkLogin(msg))) {
      msg.reply(`${greeting} ❌ *Anda harus login terlebih dahulu!*`);
      return;
    }

    const amount = args[0] ? parseFloat(args[0]) : null;
    const description = args.slice(1).join(" ") || "No description";

    if (!amount || isNaN(amount)) {
      msg.reply(
        `${greeting} ❌ *Format salah!* Gunakan: \`!expense <jumlah> <deskripsi>\`. 😊`
      );
    } else {
      await prisma.finance.create({
        data: { type: "expense", amount, description },
      });
      msg.reply(
        `${greeting} ✅ Pengeluaran sebesar *${amount}* telah ditambahkan.`
      );
    }
  },

  handleBalanceCommand: async (msg) => {
    const greeting = await getGreeting(msg); // Tambahkan await
    const financeData = await prisma.finance.findMany();

    const totalIncome = financeData
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);

    const totalExpense = financeData
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

    const balance = totalIncome - totalExpense;

    const incomeList = financeData
      .filter((item) => item.type === "income")
      .map(
        (item, index) =>
          `${index + 1}. 💰 +${item.amount} (${item.description})`
      )
      .join("\n");

    const expenseList = financeData
      .filter((item) => item.type === "expense")
      .map(
        (item, index) =>
          `${index + 1}. 💸 -${item.amount} (${item.description})`
      )
      .join("\n");

    const balanceDetail =
      `💰 *Saldo saat ini: ${balance}*\n\n` +
      `📥 *Pemasukan (Income):*\n${
        incomeList || "Tidak ada data pemasukan."
      }\n\n` +
      `📤 *Pengeluaran (Expense):*\n${
        expenseList || "Tidak ada data pengeluaran."
      }`;

    const response = createResponse("BALANCE", balanceDetail);

    if (response.media) {
      msg.reply(response.media, undefined, {
        caption: `${greeting}\n${response.text}`,
      });
    } else {
      msg.reply(`${greeting}\n${response.text}`);
    }
  },

  handleReportCommand: async (msg) => {
    const greeting = await getGreeting(msg); // Tambahkan await

    if (!(await checkLogin(msg))) {
      msg.reply(`${greeting} ❌ *Anda harus login terlebih dahulu!*`);
      return;
    }

    const filePath = await createExcelFile(); // Buat laporan Excel
    const media = MessageMedia.fromFilePath(filePath);
    msg.reply(media, null, {
      caption: `${greeting} 📊 Laporan keuangan telah diunduh.`,
    });
  },

  handleDeleteFinanceCommand: async (msg) => {
    const greeting = await getGreeting(msg); // Tambahkan await

    if (!(await checkLogin(msg))) {
      msg.reply(`${greeting} ❌ *Anda harus login terlebih dahulu!*`);
      return;
    }

    await prisma.finance.deleteMany();
    msg.reply(
      `${greeting} 🗑️ *Semua data keuangan berhasil dihapus! Saldo sekarang: 0.* ✨`
    );
  },
};
