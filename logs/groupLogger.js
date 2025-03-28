const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Mencatat aktivitas bot dalam grup
 * @param {string} groupId - ID grup WhatsApp
 * @param {string} action - Aksi yang dilakukan (BOT_JOINED, BOT_LEFT, etc)
 * @param {object} metadata - Data tambahan untuk log
 */
async function logGroupActivity(groupId, action, metadata = {}) {
  try {
    const formattedId = groupId.replace("@g.us", "");

    const logEntry = await prisma.groupLog.create({
      data: {
        groupId: formattedId,
        action,
        description: getActionDescription(action),
        metadata: metadata || {},
      },
    });

    console.log(
      `[LOG] Aktivitas grup tercatat: ${action} untuk grup ${formattedId}`
    );
    return logEntry;
  } catch (error) {
    console.error("[LOG ERROR] Gagal mencatat aktivitas grup:", error);
    throw error;
  }
}

// Helper untuk deskripsi otomatis
function getActionDescription(action) {
  const descriptions = {
    BOT_JOINED: "Bot bergabung dengan grup",
    BOT_REJOINED: "Bot bergabung kembali dengan grup",
    BOT_LEFT: "Bot meninggalkan grup",
    BOT_REMOVED: "Bot dikeluarkan dari grup",
    GROUP_UPDATED: "Informasi grup diperbarui",
  };
  return descriptions[action] || `Aksi tidak diketahui: ${action}`;
}

module.exports = { logGroupActivity };
