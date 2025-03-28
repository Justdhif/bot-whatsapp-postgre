const { MessageMedia } = require("whatsapp-web.js");
const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");
const {
  createExcelFile,
  getBalanceDetails,
  handleFinanceCommand,
} = require("../utils/financeUtils");

const prisma = new PrismaClient();

// Helper function untuk mendapatkan info sumber
const getSourceInfo = async (msg) => {
  try {
    const isGroup = msg.from.includes("@g.us");
    const sourceId = isGroup
      ? msg.from.replace("@g.us", "")
      : msg.from.replace("@c.us", "").replace(/\D/g, "");

    return {
      sourceType: isGroup ? "group" : "private",
      sourceId,
      isGroup,
    };
  } catch (error) {
    console.error("Error in getSourceInfo:", error);
    return {
      sourceType: "private",
      sourceId: "unknown",
      isGroup: false,
    };
  }
};

// ====================== HANDLE INCOME ======================
const handleIncomeCommand = async (msg, args) => {
  const { sourceType, sourceId, isGroup } = await getSourceInfo(msg);
  return handleFinanceCommand(msg, args, "income", {
    sourceType,
    sourceId,
    isGroup,
  });
};

// ====================== HANDLE EXPENSE ======================
const handleExpenseCommand = async (msg, args) => {
  const { sourceType, sourceId, isGroup } = await getSourceInfo(msg);
  return handleFinanceCommand(msg, args, "expense", {
    sourceType,
    sourceId,
    isGroup,
  });
};

// ====================== HANDLE BALANCE ======================
const handleBalanceCommand = async (msg) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { sourceType, sourceId, isGroup } = await getSourceInfo(msg);

    const data = await prismaInstance.finance.findMany({
      where: {
        isDeleted: false,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
      },
    });

    if (data.length === 0) {
      return sendReply(msg, "BALANCE", "💰 Tidak ada data keuangan saat ini.");
    }

    sendReply(msg, "BALANCE", getBalanceDetails(data));
  } catch (error) {
    console.error("Balance error:", error);
    msg.reply("❌ Terjadi kesalahan saat mengambil saldo.");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

// ====================== HANDLE REPORT ======================
const handleReportCommand = async (msg) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { sourceType, sourceId, isGroup } = await getSourceInfo(msg);

    const data = await prismaInstance.finance.findMany({
      where: {
        isDeleted: false,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
      },
    });

    const filePath = await createExcelFile(data);
    const media = MessageMedia.fromFilePath(filePath);

    msg.reply(media, null, { caption: "📊 Laporan keuangan telah diunduh." });
  } catch (error) {
    console.error("Report error:", error);
    msg.reply("❌ Gagal membuat laporan keuangan.");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

// ====================== HANDLE DELETE FINANCE ======================
const handleDeleteFinanceCommand = async (msg) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { sourceType, sourceId, isGroup } = await getSourceInfo(msg);

    await prismaInstance.finance.updateMany({
      where: {
        isDeleted: false,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
      },
      data: { isDeleted: true },
    });

    msg.reply("🗑️ Data keuangan berhasil dihapus! Saldo sekarang: 0.");
  } catch (error) {
    console.error("Delete Finance error:", error);
    msg.reply("❌ Gagal menghapus data keuangan.");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$discharge();
    }
  }
};

module.exports = {
  handleIncomeCommand,
  handleExpenseCommand,
  handleBalanceCommand,
  handleReportCommand,
  handleDeleteFinanceCommand,
};
