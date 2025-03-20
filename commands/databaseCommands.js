const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  handleSetCommand: async (msg, args) => {
    const greeting = getGreeting();
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
        msg.reply(
          `${greeting}${createResponse("SET", `🔑 *${key}* = *${value}* 🎉`)}`
        );
      } else {
        msg.reply(
          `${greeting}${createResponse(
            "SET",
            "❌ *Format salah!* Gunakan: `!set <key>` dan reply pesan untuk value. 😊",
            true
          )}`
        );
      }
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "SET",
          "❌ *Silakan reply pesan untuk menyimpan value.* 😊",
          true
        )}`
      );
    }
  },

  handleGetCommand: async (msg, args) => {
    const greeting = getGreeting();
    const key = args[0] ? args[0].trim() : null;
    if (key) {
      const data = await prisma.data.findUnique({
        where: { key },
      });
      if (data) {
        msg.reply(
          `${greeting}${createResponse("GET", `🔑 *${key}* = *${data.value}*`)}`
        );
      } else {
        msg.reply(
          `${greeting}${createResponse(
            "GET",
            `❌ *Key "${key}" tidak ditemukan.*`,
            true
          )}`
        );
      }
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "GET",
          "❌ *Format salah!* Gunakan: `!get <key>`. 😊",
          true
        )}`
      );
    }
  },

  handleEditCommand: async (msg, args) => {
    const greeting = getGreeting();
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      const value = quotedMsg.body;
      const key = args[0] ? args[0].trim() : null;
      if (key) {
        const existingData = await prisma.data.findUnique({
          where: { key },
        });
        if (existingData) {
          await prisma.data.update({
            where: { key },
            data: { value },
          });
          msg.reply(
            `${greeting}${createResponse(
              "EDIT",
              `🔑 *${key}* = *${value}* 🎉`
            )}`
          );
        } else {
          msg.reply(
            `${greeting}${createResponse(
              "EDIT",
              `❌ *Key "${key}" tidak ditemukan.*`,
              true
            )}`
          );
        }
      } else {
        msg.reply(
          `${greeting}${createResponse(
            "EDIT",
            "❌ *Format salah!* Gunakan: `!edit <key>` dan reply pesan untuk value. 😊",
            true
          )}`
        );
      }
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "EDIT",
          "❌ *Silakan reply pesan untuk mengedit value.* 😊",
          true
        )}`
      );
    }
  },

  handleDeleteCommand: async (msg, args) => {
    const greeting = getGreeting();
    const keyToDelete = args[0] ? args[0].trim() : null;
    if (keyToDelete) {
      const existingData = await prisma.data.findUnique({
        where: { key: keyToDelete },
      });
      if (existingData) {
        await prisma.data.delete({
          where: { key: keyToDelete },
        });
        msg.reply(
          `${greeting}${createResponse(
            "DELETE",
            `🗑️ *Key "${keyToDelete}" berhasil dihapus!* ✨`
          )}`
        );
      } else {
        msg.reply(
          `${greeting}${createResponse(
            "DELETE",
            `❌ *Key "${keyToDelete}" tidak ditemukan.*`,
            true
          )}`
        );
      }
    } else {
      msg.reply(
        `${greeting}${createResponse(
          "DELETE",
          "❌ *Format salah!* Gunakan: `!delete <key>`. 😊",
          true
        )}`
      );
    }
  },

  handleListCommand: async (msg) => {
    const greeting = getGreeting();
    const allData = await prisma.data.findMany();
    const listMessage =
      allData.length > 0
        ? `📜 *Daftar Data:*\n${allData
            .map((item) => `🔑 *${item.key}* = *${item.value}*`)
            .join("\n")}`
        : `❌ *Tidak ada data yang tersimpan.*`;
    msg.reply(`${greeting}${createResponse("LIST", listMessage)}`);
  },
};
