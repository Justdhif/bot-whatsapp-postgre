const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");

const prisma = new PrismaClient();

// Handler untuk command !set
const handleSetCommand = async (msg, args) => {
  try {
    if (!msg.hasQuotedMsg) {
      return msg.reply("❌ Silakan reply pesan untuk menyimpan value");
    }

    const quotedMsg = await msg.getQuotedMessage();
    const value = quotedMsg.body;
    const key = args.join(" ").trim();

    if (!key) {
      return msg.reply(
        "❌ Format salah!\nGunakan: `!set [key]`\nContoh: `!set tugas` (reply pesan untuk value)"
      );
    }

    await prisma.data.upsert({
      where: { key },
      update: { value, isDeleted: false },
      create: { key, value, isDeleted: false },
    });

    return msg.reply(`✅ Berhasil menyimpan: *${key}*`);
  } catch (error) {
    console.error("SetCommand error:", error);
    return msg.reply("❌ Gagal menyimpan data");
  }
};

// Handler untuk command !get
const handleGetCommand = async (msg, args) => {
  try {
    const key = args.join(" ").trim();
    if (!key) {
      return msg.reply(
        "❌ Format salah!\nGunakan: `!get [key]`\nContoh: `!get tugas`"
      );
    }

    const data = await prisma.data.findFirst({
      where: { key, isDeleted: false },
    });

    if (!data) {
      return msg.reply(`❌ Data *"${key}"* tidak ditemukan`);
    }

    return msg.reply(`🔍 *${key}*:\n${data.value}`);
  } catch (error) {
    console.error("GetCommand error:", error);
    return msg.reply("❌ Gagal mengambil data");
  }
};

// Handler untuk command !delete
const handleDeleteCommand = async (msg, args) => {
  try {
    const key = args.join(" ").trim();
    if (!key) {
      return msg.reply(
        "❌ Format salah!\nGunakan: `!delete [key]`\nContoh: `!delete tugas`"
      );
    }

    const data = await prisma.data.findFirst({
      where: { key, isDeleted: false },
    });

    if (!data) {
      return msg.reply(`❌ Data *"${key}"* tidak ditemukan`);
    }

    await prisma.data.update({
      where: { key },
      data: { isDeleted: true },
    });

    return msg.reply(`🗑️ Berhasil menghapus: *${key}*`);
  } catch (error) {
    console.error("DeleteCommand error:", error);
    return msg.reply("❌ Gagal menghapus data");
  }
};

// Handler untuk command !list
const handleListCommand = async (msg) => {
  try {
    const allData = await prisma.data.findMany({
      where: { isDeleted: false },
    });

    if (allData.length === 0) {
      return sendReply(msg, "DATA_LIST", "📭 Tidak ada data yang tersimpan");
    }

    const message = `📋 Daftar Data:\n\n${allData
      .map((data) => `🔑 *${data.key}*`)
      .join("\n")}`;

    return sendReply(msg, "DATA_LIST", message);
  } catch (error) {
    console.error("ListCommand error:", error);
    return sendReply(msg, "ERROR", "❌ Gagal mengambil daftar data");
  }
};

module.exports = {
  handleSetCommand,
  handleGetCommand,
  handleDeleteCommand,
  handleListCommand,
};
