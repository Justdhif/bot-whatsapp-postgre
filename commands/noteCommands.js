const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");

const prisma = new PrismaClient();

// Helper function untuk menentukan sumber pesan
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

// ====================== HANDLE SET NOTE ======================
const handleSetNoteCommand = async (msg, args) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();

    if (!msg.hasQuotedMsg) {
      return await msg.reply(
        "❌ *Silakan reply pesan untuk menyimpan catatan!*"
      );
    }

    const quotedMsg = await msg.getQuotedMessage();
    const value = quotedMsg.body;
    const key = args.join(" ").trim();
    const { isGroup, sourceId, identifier } = getSourceInfo(msg);

    if (!key) {
      return await msg.reply(
        "❌ *Format salah!*\nGunakan: `!setnote [key]`\n📌 Contoh: `!setnote tugas` lalu reply pesan yang ingin disimpan."
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
      await prismaInstance.chat.upsert({
        where: { phone: sourceId },
        create: {
          phone: sourceId,
          isActive: true,
        },
        update: {},
      });
    }

    // Hapus note lama jika ada
    await prismaInstance.note.deleteMany({
      where: {
        key,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
      },
    });

    // Buat note baru dengan relasi
    const createData = {
      key,
      value,
      createdBy: msg.from.replace("@c.us", "").replace(/\D/g, ""),
      isDeleted: false,
    };

    if (isGroup) {
      createData.group = { connect: { groupId: sourceId } };
    } else {
      createData.chat = { connect: { phone: sourceId } };
    }

    await prismaInstance.note.create({
      data: createData,
    });

    return await msg.reply(`✅ *Catatan "${key}" telah disimpan!* ✨`);
  } catch (error) {
    console.error("Set Note error:", error);
    return await msg.reply("❌ *Gagal menyimpan catatan!*");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

// ====================== HANDLE GET NOTE ======================
const handleGetNoteCommand = async (msg, args) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const key = args.join(" ").trim();
    const { isGroup, sourceId } = getSourceInfo(msg);

    if (!key) {
      return await msg.reply(
        "❌ *Format salah!*\nGunakan: `!getnote [key]`\n📌 Contoh: `!getnote tugas`"
      );
    }

    const note = await prismaInstance.note.findFirst({
      where: {
        key,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
        isDeleted: false,
      },
    });

    return await msg.reply(
      note
        ? `📝 *Catatan "${key}":*\n${note.value}`
        : `❌ *Catatan "${key}" tidak ditemukan!*`
    );
  } catch (error) {
    console.error("Get Note error:", error);
    return await msg.reply("❌ *Gagal mengambil catatan!*");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

// ====================== HANDLE DELETE NOTE ======================
const handleDeleteNoteCommand = async (msg, args) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const key = args.join(" ").trim();
    const { isGroup, sourceId } = getSourceInfo(msg);

    if (!key) {
      return await msg.reply(
        "❌ *Format salah!*\nGunakan: `!deletenote [key]`\n📌 Contoh: `!deletenote tugas`"
      );
    }

    const result = await prismaInstance.note.updateMany({
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
      },
    });

    if (result.count === 0) {
      return await msg.reply(`❌ *Catatan "${key}" tidak ditemukan!*`);
    }

    return await msg.reply(`🗑️ *Catatan "${key}" telah dihapus!* ✨`);
  } catch (error) {
    console.error("Delete Note error:", error);
    return await msg.reply("❌ *Gagal menghapus catatan!*");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

// ====================== HANDLE LIST NOTES ======================
const handleListNoteCommand = async (msg) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { isGroup, sourceId } = getSourceInfo(msg);

    const allNotes = await prismaInstance.note.findMany({
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

    const listMessage = allNotes.length
      ? `📜 *Daftar Catatan (${allNotes.length}):*\n\n${allNotes
          .map((note, index) => `${index + 1}. 📝 *${note.key}*`)
          .join("\n")}`
      : "❌ *Tidak ada catatan yang tersimpan!*";

    return await sendReply(msg, "DAFTAR CATATAN", listMessage);
  } catch (error) {
    console.error("List Note error:", error);
    return await sendReply(
      msg,
      "ERROR",
      "❌ *Gagal mengambil daftar catatan!*"
    );
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

module.exports = {
  handleSetNoteCommand,
  handleGetNoteCommand,
  handleListNoteCommand,
  handleDeleteNoteCommand,
};
