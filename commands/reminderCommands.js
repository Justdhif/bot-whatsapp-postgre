const { createResponse } = require("../utils/createResponse");
const { getGreeting } = require("../utils/getGreeting");
const { reminderDB } = require("../database/reminderDB");
const {
  setReminder,
  viewReminders,
  checkReminders,
} = require("../utils/reminderUtils");

module.exports = {
  handleRemindCommand: (msg, args) => {
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
      const reminder = setReminder(
        date,
        month,
        year,
        hour,
        minute,
        message,
        // msg.chat.id._serialized
      );
      msg.reply(`${greeting}${createResponse("REMIND", reminder)}`);
    }
  },

  handleRemindersCommand: (msg) => {
    const greeting = getGreeting();
    const reminders = viewReminders();
    msg.reply(`${greeting}${createResponse("REMINDERS", reminders)}`);
  },

  handleDeleteRemindCommand: (msg, args) => {
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

    const reminderIndex = reminderDB.findIndex(
      (reminder) =>
        reminder.message.toLowerCase() === reminderMessage.toLowerCase()
    );

    if (reminderIndex === -1) {
      msg.reply(
        `${greeting}${createResponse(
          "DELETE REMIND",
          `❌ *Reminder dengan pesan/nama "${reminderMessage}" tidak ditemukan.*`,
          true
        )}`
      );
    } else {
      const deletedReminder = reminderDB.splice(reminderIndex, 1)[0];
      msg.reply(
        `${greeting}${createResponse(
          "DELETE REMIND",
          `🗑️ *Reminder berhasil dihapus!*\n` +
            `⏰ Waktu: *${new Date(
              deletedReminder.year,
              deletedReminder.month - 1,
              deletedReminder.date,
              deletedReminder.hour,
              deletedReminder.minute
            ).toLocaleString()}*\n` +
            `📝 Pesan: *${deletedReminder.message}*`
        )}`
      );
    }
  },
};
