const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { financeDB } = require("../database/financeDB");
const {
  addIncome,
  addExpense,
  calculateBalance,
  createExcelFile,
} = require("../utils/financeUtils");

module.exports = {
  handleIncomeCommand: (msg, args) => {
    const greeting = getGreeting();
    const [amount, ...description] = args[0] ? args[0].split(" ") : null;
    if (!amount || isNaN(amount)) {
      msg.reply(
        `${greeting}${createResponse(
          "INCOME",
          "❌ *Format salah!* Gunakan: `!income <jumlah> <deskripsi>`. 😊",
          true
        )}`
      );
    } else {
      addIncome(parseFloat(amount), description.join(" "));
      msg.reply(
        `${greeting}✅ Pemasukan sebesar *${amount}* telah ditambahkan.`
      );
    }
  },

  handleExpenseCommand: (msg, args) => {
    const greeting = getGreeting();
    const [amount, ...description] = args[0].split(" ");
    if (!amount || isNaN(amount)) {
      msg.reply(
        `${greeting}${createResponse(
          "EXPENSE",
          "❌ *Format salah!* Gunakan: `!expense <jumlah> <deskripsi>`. 😊",
          true
        )}`
      );
    } else {
      addExpense(parseFloat(amount), description.join(" "));
      msg.reply(
        `${greeting}✅ Pengeluaran sebesar *${amount}* telah ditambahkan.`
      );
    }
  },

  handleBalanceCommand: (msg) => {
    const greeting = getGreeting();
    const balance = calculateBalance();

    // Ambil data income dan expense
    const incomeList = financeDB.income
      .map(
        (income, index) =>
          `${index + 1}. 💰 +${income.amount} (${income.description})`
      )
      .join("\n");
    const expenseList = financeDB.expenses
      .map(
        (expense, index) =>
          `${index + 1}. 💸 -${expense.amount} (${expense.description})`
      )
      .join("\n");

    // Buat pesan detail income dan expense
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

  handleReportCommand: (msg) => {
    const greeting = getGreeting();
    const filePath = createExcelFile();
    const media = MessageMedia.fromFilePath(filePath);
    msg.reply(media, null, {
      caption: `${greeting}📊 Laporan keuangan telah diunduh.`,
    });
  },

  handleDeleteFinanceCommand: (msg) => {
    const greeting = getGreeting();
    financeDB.income = [];
    financeDB.expenses = [];
    msg.reply(
      `${greeting}${createResponse(
        "DELETE FINANCE",
        "🗑️ *Semua data keuangan (income dan expense) berhasil dihapus! Saldo sekarang: 0.* ✨"
      )}`
    );
  },
};
