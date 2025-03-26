const { sendReply } = require("../utils/sendReply");
const {
  getUserByUsername,
  setUsername,
  updateUsername,
  getAllUsers,
  deleteUserByUsername,
} = require("../utils/authUtils");

// Perintah untuk mengatur atau mengganti username
const handleUsernameCommand = async (msg, args) => {
  const newUsername = args.join(" ").trim();
  if (!newUsername) {
    return msg.reply("❌ *Format salah!*\nGunakan: `!username [username]`.");
  }

  const existingUser = await getUserByUsername(newUsername);
  if (existingUser) {
    return msg.reply("❌ *Username sudah digunakan! Coba yang lain.*");
  }

  const phone = msg.from; // Menggunakan nomor pengirim sebagai ID unik
  const user = await getUserByUsername(phone);

  if (user) {
    await updateUsername(phone, newUsername);
    msg.reply(`🔄 *Username berhasil diubah menjadi:* *${newUsername}* ✅`);
  } else {
    await setUsername(phone, newUsername);
    msg.reply(`🎉 *Username berhasil disimpan sebagai:* *${newUsername}* ✅`);
  }
};

// Perintah untuk menampilkan daftar user
const handleListUserCommand = async (msg) => {
  const userList = await getAllUsers();
  sendReply(
    msg,
    "📜 *Daftar Pengguna*",
    userList.length ? userList.join("\n") : "❌ *Tidak ada pengguna terdaftar.*"
  );
};

// Perintah untuk menghapus user berdasarkan username
const handleDeleteUserCommand = async (msg, args) => {
  const usernameToDelete = args.join(" ").trim();
  if (!usernameToDelete) {
    return msg.reply(
      "❌ *Format salah!*\nGunakan: `!deleteuser [username]`\n📌 Contoh: `!deleteuser JohnDoe`"
    );
  }

  const user = await getUserByUsername(usernameToDelete);
  if (!user) {
    return msg.reply("❌ *Username tidak ditemukan!*");
  }

  await deleteUserByUsername(usernameToDelete);
  msg.reply(
    `🗑️ *Pengguna dengan username ${usernameToDelete} berhasil dihapus!*`
  );
};

module.exports = {
  handleUsernameCommand,
  handleListUserCommand,
  handleDeleteUserCommand,
};
