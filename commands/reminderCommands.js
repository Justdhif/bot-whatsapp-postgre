const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  handleRemindCommand: async (msg, args) => {
    const greeting = getGreeting();
    if (args.length < 6) {
      msg.reply(
        `${greeting}${createResponse(
          "REMIND",
          "❌ *Format salah!* Gunakan: `!remind <tanggal> <bulan> <tahun> <jam> <menit> <pesan>`. 😊",
          true
        )}`
      );
    } else {
      const [date, month, year, hour, minute, ...messageParts] = args;
      const message = messageParts.join(" ");

      // Buat objek Date untuk reminder
      const reminderDate = new Date(year, month - 1, date, hour, minute);

      // Simpan reminder ke PostgreSQL
      await prisma.reminders.create({
        data: {
          date: reminderDate,
          message: message,
        },
      });

      msg.reply(
        `${greeting}${createResponse(
          "REMIND",
          `⏰ *Reminder berhasil ditambahkan!*\n` +
            `📅 Waktu: *${reminderDate.toLocaleString()}*\n` +
            `📝 Pesan: *${message}*`
        )}`
      );
    }
  },

  handleRemindersCommand: async (msg) => {
    const greeting = getGreeting();
    const reminders = await prisma.reminders.findMany(); // Ambil semua reminder dari PostgreSQL

    // Format daftar reminder
    const reminderList =
      reminders.length > 0
        ? reminders
            .map(
              (reminder, index) =>
                `${index + 1}. ⏰ *${new Date(
                  reminder.date
                ).toLocaleString()}*\n` + `   📝 *${reminder.message}*`
            )
            .join("\n\n")
        : "❌ *Tidak ada reminder yang tersimpan.*";

    msg.reply(
      `${greeting}${createResponse(
        "REMINDERS",
        `📅 *Daftar Reminder:*\n${reminderList}`
      )}`
    );
  },

  handleDeleteRemindCommand: async (msg, args) => {
    const greeting = getGreeting();
    const reminderMessage = args.join(" ");
    if (!reminderMessage) {
      msg.reply(
        `${greeting}${createResponse(
          "DELETE REMIND",
          "❌ *Format salah!* Gunakan: `!deleteremind <pesan/nama reminder>`.",
          true
        )}`
      );
      return;
    }

    // Cari reminder berdasarkan pesan
    const reminderToDelete = await prisma.reminders.findFirst({
      where: {
        message: {
          contains: reminderMessage,
          mode: "insensitive", // Case-insensitive search
        },
      },
    });

    if (!reminderToDelete) {
      msg.reply(
        `${greeting}${createResponse(
          "DELETE REMIND",
          `❌ *Reminder dengan pesan/nama "${reminderMessage}" tidak ditemukan.*`,
          true
        )}`
      );
    } else {
      // Hapus reminder dari PostgreSQL
      await prisma.reminders.delete({
        where: { id: reminderToDelete.id },
      });

      msg.reply(
        `${greeting}${createResponse(
          "DELETE REMIND",
          `🗑️ *Reminder berhasil dihapus!*\n` +
            `⏰ Waktu: *${new Date(
              reminderToDelete.date
            ).toLocaleString()}*\n` +
            `📝 Pesan: *${reminderToDelete.message}*`
        )}`
      );
    }
  },
};
