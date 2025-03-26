const { MessageMedia } = require("whatsapp-web.js");
const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");
const {
  createExcelFile,
  getBalanceDetails,
  handleFinanceCommand,
} = require("../utils/financeUtils");

const prisma = new PrismaClient();

// ====================== HANDLE INCOME ======================
const handleIncomeCommand = (msg, args) =>
  handleFinanceCommand(msg, args, "income");

// ====================== HANDLE EXPENSE ======================
const handleExpenseCommand = (msg, args) =>
  handleFinanceCommand(msg, args, "expense");

// ====================== HANDLE BALANCE ======================
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
  } finally {
    await prisma.$disconnect();
  }
};

// ====================== HANDLE REPORT ======================
const handleReportCommand = async (msg) => {
  try {
    const filePath = await createExcelFile();
    const media = MessageMedia.fromFilePath(filePath);

    msg.reply(media, null, { caption: "📊 Laporan keuangan telah diunduh." });
  } catch (error) {
    console.error("Report error:", error);
    msg.reply("❌ Gagal membuat laporan keuangan.");
  }
};

// ====================== HANDLE DELETE FINANCE ======================
const handleDeleteFinanceCommand = async (msg) => {
  try {
    await prisma.finance.updateMany({
      where: { isDeleted: false },
      data: { isDeleted: true },
    });

    msg.reply("🗑️ Semua data keuangan berhasil dihapus! Saldo sekarang: 0.");
  } catch (error) {
    console.error("Delete Finance error:", error);
    msg.reply("❌ Gagal menghapus data keuangan.");
  } finally {
    await prisma.$disconnect();
  }
};

// ====================== EXPORT MODULE ======================
module.exports = {
  handleIncomeCommand,
  handleExpenseCommand,
  handleBalanceCommand,
  handleReportCommand,
  handleDeleteFinanceCommand,
};

// ====================== END OF FILE ======================
