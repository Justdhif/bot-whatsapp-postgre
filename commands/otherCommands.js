const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");

const prisma = new PrismaClient();

// Helper function yang disesuaikan
const getSourceInfo = (msg) => {
  const isGroup = msg.id.remote.includes("@g.us");
  const sourceId = isGroup
    ? msg.id.remote.replace("@g.us", "")
    : msg.from.replace("@c.us", "").replace(/\D/g, "");
  return {
    isGroup,
    sourceId,
    identifier: isGroup ? { groupId: sourceId } : { phone: sourceId },
  };
};

// ====================== 📌 MENU & BANTUAN ======================
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

const handleHelpCommand = (msg, category = "") => {
  // ... (tetap sama)
};

// ====================== ℹ️ GENERAL COMMANDS ======================
const handleInfoCommand = (msg) => {
  // ... (tetap sama)
};

const handleFeedbackCommand = (msg) => {
  // ... (tetap sama)
};

const handleSecretCommand = (msg) => {
  // ... (tetap sama)
};

// ====================== 📦 MANAJEMEN DATA ======================
const handleArchiveCommand = async (msg) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { isGroup, sourceId } = getSourceInfo(msg);

    const [archived, archivedNotes, archivedTodo, archivedFinance] =
      await Promise.all([
        prismaInstance.data.findMany({
          where: {
            isDeleted: true,
            OR: [
              { group: isGroup ? { groupId: sourceId } : null },
              { chat: !isGroup ? { phone: sourceId } : null },
            ],
          },
        }),
        prismaInstance.note.findMany({
          where: {
            isDeleted: true,
            OR: [
              { group: isGroup ? { groupId: sourceId } : null },
              { chat: !isGroup ? { phone: sourceId } : null },
            ],
          },
        }),
        prismaInstance.todo.findMany({
          where: {
            isDeleted: true,
            OR: [
              { group: isGroup ? { groupId: sourceId } : null },
              { chat: !isGroup ? { phone: sourceId } : null },
            ],
          },
        }),
        prismaInstance.finance.findMany({
          where: {
            isDeleted: true,
            OR: [
              { group: isGroup ? { groupId: sourceId } : null },
              { chat: !isGroup ? { phone: sourceId } : null },
            ],
          },
        }),
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
  } catch (error) {
    console.error("Archive error:", error);
    msg.reply("❌ Gagal mengambil data arsip");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

const handleRestoreCommand = async (msg, args) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { isGroup, sourceId } = getSourceInfo(msg);
    const category = args[0];
    const name = args.slice(1).join(" ").trim();

    if (!category || !name) {
      return msg.reply(
        "❌ *Format salah!* Gunakan: `!restore [kategori] [nama]`"
      );
    }

    const tableMap = {
      data: "data",
      note: "note",
      todo: "todo",
      finance: "finance",
    };

    if (!tableMap[category]) return msg.reply("❌ *Kategori tidak valid!*");

    // Menentukan kondisi WHERE yang sesuai
    const whereCondition = {
      OR: [
        { group: isGroup ? { groupId: sourceId } : null },
        { chat: !isGroup ? { phone: sourceId } : null },
      ],
      isDeleted: true,
    };

    // Tambahkan kondisi pencarian berdasarkan kategori
    if (category === "data" || category === "note") {
      whereCondition.key = name;
    } else if (category === "todo") {
      whereCondition.task = name;
    } else if (category === "finance") {
      whereCondition.description = name;
    }

    const updated = await prismaInstance[tableMap[category]].updateMany({
      where: whereCondition,
      data: { isDeleted: false },
    });

    msg.reply(
      updated.count > 0
        ? `✅ *${name}* berhasil dipulihkan!`
        : `❌ *${name}* tidak ditemukan dalam arsip.`
    );
  } catch (error) {
    console.error("Restore error:", error);
    msg.reply("❌ Gagal memulihkan data");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

const handleResetAllCommand = async (msg) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { isGroup, sourceId } = getSourceInfo(msg);

    await prismaInstance.$transaction([
      prismaInstance.data.deleteMany({
        where: {
          isDeleted: true,
          OR: [
            { group: isGroup ? { groupId: sourceId } : null },
            { chat: !isGroup ? { phone: sourceId } : null },
          ],
        },
      }),
      prismaInstance.note.deleteMany({
        where: {
          isDeleted: true,
          OR: [
            { group: isGroup ? { groupId: sourceId } : null },
            { chat: !isGroup ? { phone: sourceId } : null },
          ],
        },
      }),
      prismaInstance.todo.deleteMany({
        where: {
          isDeleted: true,
          OR: [
            { group: isGroup ? { groupId: sourceId } : null },
            { chat: !isGroup ? { phone: sourceId } : null },
          ],
        },
      }),
      prismaInstance.finance.deleteMany({
        where: {
          isDeleted: true,
          OR: [
            { group: isGroup ? { groupId: sourceId } : null },
            { chat: !isGroup ? { phone: sourceId } : null },
          ],
        },
      }),
    ]);

    msg.reply("🗑️ *Semua data terarsip telah dihapus!* ❌");
  } catch (error) {
    console.error("Reset All error:", error);
    msg.reply("❌ Gagal menghapus data arsip");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

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
