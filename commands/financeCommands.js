const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { PrismaClient } = require("@prisma/client");
const { MessageMedia } = require("whatsapp-web.js");

const prisma = new PrismaClient();

module.exports = {
  handleIncomeCommand: async (msg, args) => {
    const greeting = getGreeting();
    const amount = args[0] ? parseFloat(args[0]) : null;
    const description = args.slice(1).join(" "); // Gabungkan semua elemen setelah amount

    if (!amount || isNaN(amount)) {
      msg.reply(
        `${greeting}${createResponse(
          "INCOME",
          "❌ *Format salah!* Gunakan: `!income <jumlah> <deskripsi>`. 😊",
          true
        )}`
      );
    } else {
      await prisma.finance.create({
        data: {
          type: "income",
          amount: amount,
          description: description || "No description", // Jika description kosong, isi dengan nilai default
        },
      });
      msg.reply(
        `${greeting}✅ Pemasukan sebesar *${amount}* telah ditambahkan.`
      );
    }
  },

  handleExpenseCommand: async (msg, args) => {
    const greeting = getGreeting();
    const amount = args[0] ? parseFloat(args[0]) : null;
    const description = args.slice(1).join(" "); // Gabungkan semua elemen setelah amount

    if (!amount || isNaN(amount)) {
      msg.reply(
        `${greeting}${createResponse(
          "EXPENSE",
          "❌ *Format salah!* Gunakan: `!expense <jumlah> <deskripsi>`. 😊",
          true
        )}`
      );
    } else {
      await prisma.finance.create({
        data: {
          type: "expense",
          amount: amount,
          description: description || "No description", // Jika description kosong, isi dengan nilai default
        },
      });
      msg.reply(
        `${greeting}✅ Pengeluaran sebesar *${amount}* telah ditambahkan.`
      );
    }
  },

  handleBalanceCommand: async (msg) => {
    const greeting = getGreeting();
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

    const balanceDetail = createResponse(
      "BALANCE",
      `💰 *Saldo saat ini: ${balance}*\n\n` +
        `📥 *Pemasukan (Income):*\n${
          incomeList || "Tidak ada data pemasukan."
        }\n\n` +
        `📤 *Pengeluaran (Expense):*\n${
          expenseList || "Tidak ada data pengeluaran."
        }`
    );

    msg.reply(`${greeting}${balanceDetail}`);
  },

  handleReportCommand: async (msg) => {
    const greeting = getGreeting();
    const filePath = await createExcelFile(); // Buat laporan Excel
    const media = MessageMedia.fromFilePath(filePath);
    msg.reply(media, null, {
      caption: `${greeting}📊 Laporan keuangan telah diunduh.`,
    });
  },

  handleDeleteFinanceCommand: async (msg) => {
    const greeting = getGreeting();
    await prisma.finance.deleteMany(); // Hapus semua data keuangan dari PostgreSQL
    msg.reply(
      `${greeting}${createResponse(
        "DELETE FINANCE",
        "🗑️ *Semua data keuangan (income dan expense) berhasil dihapus! Saldo sekarang: 0.* ✨"
      )}`
    );
  },
};
