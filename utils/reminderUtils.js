const { reminderDB } = require("../database/reminderDB");

const setReminder = (date, month, year, hour, minute, message, chatId) => {
  const reminder = {
    date: parseInt(date),
    month: parseInt(month),
    year: parseInt(year),
    hour: parseInt(hour),
    minute: parseInt(minute),
    message,
    chatId,
  };
  reminderDB.push(reminder);
  return `⏰ Reminder berhasil diset untuk tanggal *${date}-${month}-${year} jam ${hour}:${minute}* dengan pesan: *${message}*`;
};

const viewReminders = () => {
  if (reminderDB.length === 0) return "❌ *Tidak ada reminder yang terset.*";
  return `📜 *Daftar Reminder:*\n${reminderDB
    .map(
      (reminder, index) =>
        ` ⏰ *${index + 1}. ${reminder.date}-${reminder.month}-${
          reminder.year
        } ${reminder.hour}:${reminder.minute}* - ${reminder.message}`
    )
    .join("\n")}`;
};

const checkReminders = () => {
  const now = new Date();
  reminderDB.forEach((reminder, index) => {
    const reminderTime = new Date(
      reminder.year,
      reminder.month - 1, // Bulan dimulai dari 0 (Januari = 0)
      reminder.date,
      reminder.hour,
      reminder.minute
    );

    // Hitung selisih waktu dalam milidetik
    const timeDiff = reminderTime - now;

    // Jika waktu reminder sudah lewat, hapus dari database
    if (timeDiff <= 0) {
      reminderDB.splice(index, 1);
      return;
    }

    const oneDayBefore = 86400000; // 1 hari dalam milidetik
    if (timeDiff <= oneDayBefore && !reminder.daysNotificationSent) {
      const notificationMessage = `⏰ *Reminder Notification (1 hari sebelumnya):*\n${
        reminder.message
      }\n\nWaktu reminder: ${reminderTime.toLocaleString()}`;
      if (reminder.chatId.startsWith("group")) {
        // Kirim notifikasi ke grup
        client.sendMessage(reminder.chatId, notificationMessage);
      } else {
        // Kirim notifikasi ke chat pribadi
        client.sendMessage(reminder.chatId, notificationMessage);
      }
      reminder.daysNotificationSent = true; // Tandai notifikasi 1 hari sebelumnya sudah dikirim
    }

    // Kirim notifikasi 1 jam sebelumnya
    const oneHourBefore = 3600000; // 1 jam dalam milidetik
    if (timeDiff <= oneHourBefore && !reminder.hoursNotificationSent) {
      const notificationMessage = `⏰ *Reminder Notification (1 jam sebelumnya):*\n${
        reminder.message
      }\n\nWaktu reminder: ${reminderTime.toLocaleString()}`;
      if (reminder.chatId.startsWith("group")) {
        // Kirim notifikasi ke grup
        client.sendMessage(reminder.chatId, notificationMessage);
      } else {
        // Kirim notifikasi ke chat pribadi
        client.sendMessage(reminder.chatId, notificationMessage);
      }
      reminder.hoursNotificationSent = true; // Tandai notifikasi 1 jam sebelumnya sudah dikirim
    }
  });
};

module.exports = { setReminder, viewReminders, checkReminders };
