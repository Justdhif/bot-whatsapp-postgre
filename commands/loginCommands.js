const { sendReply } = require("../utils/sendReply");
const {
  getUser,
  loginUser,
  logoutUser,
  setUsername,
  deleteUser,
  getAllUsers,
} = require("../utils/authUtils");

const LOGIN_CODE = "08122008"; // Kode login tetap

// Perintah untuk menampilkan instruksi login
const handleLoginCommand = (msg) => {
  msg.reply(
    "📝 *Silakan masukkan kode login dengan perintah:*\n`!code [kode]`\n📌 Contoh: `!code 12345678`"
  );
};

// Perintah untuk memverifikasi kode login
const handleCodeCommand = async (msg, args) => {
  const code = args.join(" ").trim();
  if (!code) {
    return msg.reply("❌ *Format salah!*\nGunakan: `!code [kode]`.");
  }
  if (code !== LOGIN_CODE) {
    return msg.reply("❌ *Kode login salah!*");
  }

  await loginUser(msg);
  msg.reply(
    "✅ *Verifikasi berhasil!*\nSekarang, atur username dengan:\n`!username [username]`\n📌 Contoh: `!username JohnDoe`"
  );
};

// Perintah untuk mengatur username
const handleUsernameCommand = async (msg, args) => {
  const username = args.join(" ").trim();
  if (!username) {
    return msg.reply("❌ *Format salah!*\nGunakan: `!username [username]`.");
  }

  const user = await getUser(msg);
  if (!user?.isLoggedIn) {
    return msg.reply("❌ *Anda harus login terlebih dahulu!*");
  }

  await setUsername(user.phone, username);
  msg.reply(`✅ *Username berhasil diatur!*\nSelamat datang, *${username}* 🎉`);
};

// Perintah untuk logout
const handleLogoutCommand = async (msg) => {
  const user = await getUser(msg);
  if (!user?.isLoggedIn) {
    return msg.reply("❌ *Anda belum login!*");
  }

  await logoutUser(user.phone);
  msg.reply("✅ *Logout berhasil!* 🔓");
};

// Perintah untuk menampilkan daftar user
const handleListUserCommand = async (msg) => {
  const user = await getUser(msg);
  if (!user?.isLoggedIn) {
    return msg.reply("❌ *Anda harus login terlebih dahulu!*");
  }

  const userList = await getAllUsers();
  sendReply(
    msg,
    "📜 *Daftar Pengguna*",
    userList.length ? userList.join("\n") : "❌ *Tidak ada pengguna terdaftar.*"
  );
};

// Perintah untuk menghapus user
const handleDeleteUserCommand = async (msg, args) => {
  const phoneToDelete = args[0];
  if (!phoneToDelete) {
    return msg.reply(
      "❌ *Format salah!*\nGunakan: `!deleteuser [nomor_telepon]`\n📌 Contoh: `!deleteuser 628123456789`"
    );
  }

  const user = await getUser(msg);
  if (!user?.isLoggedIn) {
    return msg.reply("❌ *Anda harus login terlebih dahulu!*");
  }

  const result = await deleteUser(phoneToDelete, true); // Soft delete
  msg.reply(
    result
      ? `🗑️ *Pengguna dengan nomor ${phoneToDelete} berhasil dihapus!*`
      : `❌ *Pengguna tidak ditemukan!*`
  );
};

module.exports = {
  handleLoginCommand,
  handleCodeCommand,
  handleUsernameCommand,
  handleLogoutCommand,
  handleListUserCommand,
  handleDeleteUserCommand,
};
