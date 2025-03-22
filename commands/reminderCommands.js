const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  handleRemindCommand: async (msg, args) => {
    const greeting = await getGreeting(msg);
    if (args.length < 6) {
      msg.reply(
        `${greeting}\n❌ *Format salah!*\nGunakan: \`!remind <tanggal> <bulan> <tahun> <jam> <menit> <pesan>\`. 😊`
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
        `${greeting}\n✅ *Reminder berhasil ditambahkan!*\n\n` +
          `📅 *Waktu:* ${reminderDate.toLocaleString()}\n` +
          `📝 *Pesan:* ${message}`
      );
    }
  },

  handleRemindersCommand: async (msg) => {
    const greeting = await getGreeting(msg);
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

    const response = createResponse(
      "REMINDERS",
      `📅 *Daftar Reminder:*\n${reminderList}`
    );

    if (response.media) {
      msg.reply(response.media, undefined, {
        caption: `${greeting}\n${response.text}`,
      });
    } else {
      msg.reply(`${greeting}\n${response.text}`);
    }
  },

  handleDeleteRemindCommand: async (msg, args) => {
    const greeting = await getGreeting(msg);
    const reminderMessage = args.join(" ");
    if (!reminderMessage) {
      msg.reply(
        `${greeting}\n❌ *Format salah!*\nGunakan: \`!deleteremind <pesan/nama reminder>\`.`
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
        `${greeting}\n❌ *Reminder dengan pesan/nama "${reminderMessage}" tidak ditemukan.*`
      );
    } else {
      // Hapus reminder dari PostgreSQL
      await prisma.reminders.delete({
        where: { id: reminderToDelete.id },
      });

      msg.reply(
        `${greeting}\n🗑️ *Reminder berhasil dihapus!*\n\n` +
          `⏰ *Waktu:* ${new Date(reminderToDelete.date).toLocaleString()}\n` +
          `📝 *Pesan:* ${reminderToDelete.message}`
      );
    }
  },
};
