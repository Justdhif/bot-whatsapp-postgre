const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  handleSetCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await dan parameter msg
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      const value = quotedMsg.body;
      const key = args[0] ? args[0].trim() : null;

      if (key) {
        await prisma.data.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });

        msg.reply(`${greeting}\n✅ *${key}* telah disimpan! 🎉`);
      } else {
        msg.reply(
          `${greeting} ❌ Format salah! Gunakan: \`!set <key>\` dan reply pesan.`
        );
      }
    } else {
      msg.reply(`${greeting} ❌ Silakan reply pesan untuk menyimpan value.`);
    }
  },

  handleGetCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await dan parameter msg
    const key = args[0] ? args[0].trim() : null;

    if (key) {
      const data = await prisma.data.findUnique({ where: { key } });

      msg.reply(
        `${greeting}\n` +
          (data
            ? `*${key}*: *${data.value}*`
            : `❌ Key "${key}" tidak ditemukan.`)
      );
    } else {
      msg.reply(`${greeting} ❌ Format salah! Gunakan: \`!get <key>\`.`);
    }
  },

  handleListCommand: async (msg) => {
    const greeting = await getGreeting(msg); // Tambahkan await dan parameter msg
    const allData = await prisma.data.findMany();
    const listMessage =
      allData.length > 0
        ? `📜 *Daftar Data:*\n${allData
            .map((item) => `🔑 *${item.key}*`)
            .join("\n")}`
        : `❌ *Tidak ada data yang tersimpan.*`;

    const response = createResponse("LIST DATA", listMessage);

    if (response.media) {
      msg.reply(response.media, undefined, {
        caption: `${greeting}\n${response.text}`,
      });
    } else {
      msg.reply(`${greeting}\n${response.text}`);
    }
  },
};
