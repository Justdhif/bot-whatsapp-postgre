const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { logGroupActivity } = require("../logs/groupLogger");

/**
 * Menangani chat baru (khusus untuk chat pribadi)
 * @param {object} client - WhatsApp client
 * @param {object} chat - Objek chat dari whatsapp-web.js
 */
async function handleNewChat(client, chat) {
  try {
    // Hanya proses chat pribadi (bukan group)
    if (!chat.isGroup) {
      await saveUser(chat.id._serialized);
      console.log(
        `[CHAT] Menangani chat pribadi baru dari: ${chat.id._serialized}`
      );
    }
  } catch (error) {
    console.error("[ERROR] Gagal menangani chat baru:", error);
    throw error;
  }
}

/**
 * Menyimpan user dan chat baru ke database
 * @param {string} phone - Nomor WhatsApp (format: 62812...@c.us)
 * @returns {Promise<boolean>} - True jika berhasil
 */
async function saveUser(phone) {
  try {
    const formattedPhone = phone.replace("@c.us", "").replace(/\D/g, "");

    await prisma.$transaction([
      // Buat atau update chat
      prisma.chat.upsert({
        where: { phone: formattedPhone },
        update: { isActive: true },
        create: {
          phone: formattedPhone,
          isActive: true,
          user: {
            connectOrCreate: {
              where: { phone: formattedPhone },
              create: {
                phone: formattedPhone,
                username: `user-${formattedPhone.slice(-4)}`,
              },
            },
          },
        },
      }),
      // Update last activity jika user sudah ada
      prisma.user.update({
        where: { phone: formattedPhone },
        data: { lastActivity: new Date() },
      }),
    ]);

    console.log(`[DB] Data user ${formattedPhone} tersimpan`);
    return true;
  } catch (error) {
    console.error("[DB ERROR] Gagal menyimpan user:", error);
    return false;
  }
}

/**
 * Menangani ketika bot bergabung dengan grup baru
 * @param {object} client - WhatsApp client
 * @param {string} groupId - ID grup WhatsApp
 * @param {string} groupName - Nama grup
 */
async function handleGroupJoin(client, groupId, groupName) {
  try {
    const formattedId = groupId.replace("@g.us", "");

    const group = await prisma.group.upsert({
      where: { groupId: formattedId },
      update: {
        name: groupName,
        isActive: true,
        lastJoinedAt: new Date(),
      },
      create: {
        groupId: formattedId,
        name: groupName,
        isActive: true,
        lastJoinedAt: new Date(),
      },
    });

    await logGroupActivity(formattedId, "BOT_JOINED", { groupName });
    await client.sendMessage(groupId, generateIntroMessage());

    console.log(
      `[BOT] Bergabung dengan grup baru: ${groupName} (${formattedId})`
    );
    return group;
  } catch (error) {
    console.error("[ERROR] Gagal menangani join grup:", error);
    throw error;
  }
}

/**
 * Menangani ketika bot di-remove dari grup
 * @param {string} groupId - ID grup WhatsApp
 */
async function handleBotRemoved(groupId) {
  try {
    const formattedId = groupId.replace("@g.us", "");

    // Update status grup
    const updatedGroup = await prisma.group.update({
      where: { groupId: formattedId },
      data: {
        isActive: false,
        lastLeftAt: new Date(),
      },
    });

    // Catat log
    await logGroupActivity(formattedId, "BOT_REMOVED");

    console.log(`[BOT] Dikeluarkan dari grup: ${formattedId}`);
    return updatedGroup;
  } catch (error) {
    console.error("[ERROR] Gagal menangani bot removal:", error);
    throw error;
  }
}

/**
 * Menangani ketika bot bergabung kembali ke grup
 * @param {object} client - WhatsApp client
 * @param {string} groupId - ID grup WhatsApp
 * @param {string} groupName - Nama grup
 */
async function handleGroupRejoin(client, groupId, groupName) {
  try {
    const formattedId = groupId.replace("@g.us", "");

    // Update status grup
    const group = await prisma.group.update({
      where: { groupId: formattedId },
      data: {
        isActive: true,
        name: groupName,
        lastJoinedAt: new Date(),
      },
    });

    // Catat log
    await logGroupActivity(formattedId, "BOT_REJOINED");

    // Kirim pesan
    await client.sendMessage(
      groupId,
      "🤖 Saya kembali bergabung dengan grup ini!"
    );

    console.log(
      `[BOT] Bergabung kembali dengan grup: ${groupName} (${formattedId})`
    );
    return group;
  } catch (error) {
    console.error("[ERROR] Gagal menangani rejoin grup:", error);
    throw error;
  }
}

// Helper function untuk pesan perkenalan
function generateIntroMessage() {
  return `🤖 Halo semua! Saya adalah bot WhatsApp. 
Saya siap membantu. Ketik !menu untuk melihat fitur yang tersedia.`;
}

module.exports = {
  saveUser,
  handleNewChat,
  handleGroupJoin,
  handleBotRemoved,
  handleGroupRejoin,
};
