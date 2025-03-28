const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");

const prisma = new PrismaClient();

// Helper function yang disesuaikan dengan schema
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

// ====================== HANDLE SET ======================
const handleSetCommand = async (msg, args) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();

    if (!msg.hasQuotedMsg) {
      return await msg.reply("❌ Silakan reply pesan untuk menyimpan value");
    }

    const quotedMsg = await msg.getQuotedMessage();
    const value = quotedMsg.body;
    const key = args.join(" ").trim();
    const { sourceId, isGroup } = await getSourceInfo(msg);

    if (!key) {
      return await msg.reply(
        "❌ Format salah!\nGunakan: `!set [key]`\nContoh: `!set tugas` (reply pesan untuk value)"
      );
    }

    // Pastikan Group/Chat sudah ada
    if (isGroup) {
      await prismaInstance.group.upsert({
        where: { groupId: sourceId },
        create: {
          groupId: sourceId,
          name: `Group-${sourceId}`,
          isActive: true,
        },
        update: {},
      });
    } else {
      // Untuk private chat, pastikan chat dan user ada
      const formattedPhone = sourceId;

      await prismaInstance.chat.upsert({
        where: { phone: formattedPhone },
        create: {
          phone: formattedPhone,
          isActive: true,
        },
        update: {},
      });

      // Buat user jika belum ada
      await prismaInstance.user.upsert({
        where: { phone: formattedPhone },
        create: {
          phone: formattedPhone,
          username: `user-${Date.now()}`,
          chat: {
            connect: { phone: formattedPhone },
          },
        },
        update: {},
      });
    }

    // Hapus data lama jika ada
    await prismaInstance.data.deleteMany({
      where: {
        key,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
      },
    });

    // Buat data baru dengan relasi yang benar
    const createData = {
      key,
      value,
      createdBy: msg.from.replace("@c.us", "").replace(/\D/g, ""),
      isDeleted: false,
      createdAt: new Date(),
    };

    if (isGroup) {
      createData.group = { connect: { groupId: sourceId } };
    } else {
      createData.chat = { connect: { phone: sourceId } };
    }

    await prismaInstance.data.create({
      data: createData,
    });

    return await msg.reply(`✅ Berhasil menyimpan: *${key}*`);
  } catch (error) {
    console.error("SetCommand error:", error);
    return await msg.reply("❌ Gagal menyimpan data");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

// ====================== HANDLE GET ======================
const handleGetCommand = async (msg, args) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();

    const key = args.join(" ").trim();
    const { sourceType, sourceId, isGroup } = await getSourceInfo(msg);

    if (!key) {
      return await msg.reply(
        "❌ Format salah!\nGunakan: `!get [key]`\nContoh: `!get tugas`"
      );
    }

    const data = await prismaInstance.data.findFirst({
      where: {
        key,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
        isDeleted: false,
      },
    });

    if (!data) {
      return await msg.reply(`❌ Data *"${key}"* tidak ditemukan`);
    }

    return await msg.reply(`🔍 *${key}*:\n${data.value}`);
  } catch (error) {
    console.error("GetCommand error:", error);
    return await msg.reply("❌ Gagal mengambil data");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

// ====================== HANDLE DELETE ======================
const handleDeleteCommand = async (msg, args) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();

    const key = args.join(" ").trim();
    const { sourceType, sourceId, isGroup } = await getSourceInfo(msg);

    if (!key) {
      return await msg.reply(
        "❌ Format salah!\nGunakan: `!delete [key]`\nContoh: `!delete tugas`"
      );
    }

    const result = await prismaInstance.data.updateMany({
      where: {
        key,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return await msg.reply(`❌ Data *"${key}"* tidak ditemukan`);
    }

    return await msg.reply(`🗑️ Berhasil menghapus: *${key}*`);
  } catch (error) {
    console.error("DeleteCommand error:", error);
    return await msg.reply("❌ Gagal menghapus data");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

// ====================== HANDLE LIST ======================
const handleListCommand = async (msg) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();

    const { sourceType, sourceId, isGroup } = await getSourceInfo(msg);

    const allData = await prismaInstance.data.findMany({
      where: {
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    if (allData.length === 0) {
      return await sendReply(
        msg,
        "DATA_LIST",
        "📭 Tidak ada data yang tersimpan"
      );
    }

    const message = `📋 *Daftar Data (${allData.length}):*\n\n${allData
      .map((data, index) => `${index + 1}. 🔑 *${data.key}*`)
      .join("\n")}`;

    return await sendReply(msg, "DATA LIST", message);
  } catch (error) {
    console.error("ListCommand error:", error);
    return await sendReply(msg, "ERROR", "❌ Gagal mengambil daftar data");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

module.exports = {
  handleSetCommand,
  handleGetCommand,
  handleDeleteCommand,
  handleListCommand,
};
