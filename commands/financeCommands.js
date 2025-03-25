const { MessageMedia } = require("whatsapp-web.js");
const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");
const { checkLogin } = require("../utils/authUtils");
const {
  createExcelFile,
  getBalanceDetails,
  handleFinanceCommand,
} = require("../utils/financeUtils");

const prisma = new PrismaClient();

// Menambahkan Income
const handleIncomeCommand = (msg, args) =>
  handleFinanceCommand(msg, args, "income");

// Menambahkan Expense
const handleExpenseCommand = (msg, args) =>
  handleFinanceCommand(msg, args, "expense");

// Menampilkan Balance
const handleBalanceCommand = async (msg) => {
  try {
    const data = await prisma.finance.findMany({
      where: { isDeleted: false },
    });

    if (data.length === 0) {
      return sendReply(msg, "BALANCE", "💰 Tidak ada data keuangan saat ini.");
    }

    sendReply(msg, "BALANCE", getBalanceDetails(data));
  } catch (error) {
    console.error("Balance error:", error);
    msg.reply("❌ Terjadi kesalahan saat mengambil saldo.");
  }
};

// Mengunduh Laporan Keuangan
const handleReportCommand = async (msg) => {
  if (!(await checkLogin(msg))) {
    return msg.reply("❌ Anda harus login terlebih dahulu.");
  }

  try {
    const media = MessageMedia.fromFilePath(await createExcelFile());
    msg.reply(media, null, { caption: "📊 Laporan keuangan telah diunduh." });
  } catch (error) {
    console.error("Report error:", error);
    msg.reply("❌ Gagal membuat laporan keuangan.");
  }
};

// Menghapus Semua Data Keuangan
const handleDeleteFinanceCommand = async (msg) => {
  if (!(await checkLogin(msg))) {
    return msg.reply("❌ Anda harus login terlebih dahulu.");
  }

  try {
    await prisma.finance.updateMany({
      where: { isDeleted: false },
      data: { isDeleted: true },
    });

    msg.reply("🗑️ Semua data keuangan berhasil dihapus! Saldo sekarang: 0.");
  } catch (error) {
    console.error("Delete Finance error:", error);
    msg.reply("❌ Gagal menghapus data keuangan.");
  }
};

module.exports = {
  handleIncomeCommand,
  handleExpenseCommand,
  handleBalanceCommand,
  handleReportCommand,
  handleDeleteFinanceCommand,
};
