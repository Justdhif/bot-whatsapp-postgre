const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Mendapatkan data pengguna
const getUser = async (msg, client) => {
  const isGroup = msg.from.endsWith("@g.us");

  if (isGroup) {
    // Ambil semua participant di grup
    const chat = await msg.getChat();
    const participants = chat.participants.map((p) => p.id.user); // Ambil nomor HP semua member

    // Cari yang ada di database
    const users = await prisma.user.findMany({
      where: { phone: { in: participants } },
      select: { phone: true, username: true },
    });

    // Format output
    const userList = users
      .map((u) => `👤 *${u.username || "Tanpa Nama"}* (📞 ${u.phone})`)
      .join("\n");

    return userList || "❌ *Tidak ada participant yang terdaftar di database.*";
  } else {
    // Jika di private chat, hanya tampilkan user yang terdaftar di database
    const phone = msg.from.split("@")[0];
    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || !user.username) {
      return "❌ *Kamu belum memiliki username di database.*";
    }

    return `👤 *${user.username}* (📞 ${user.phone})`;
  }
};

// Mendapatkan data pengguna berdasarkan username
const getUserByUsername = async (username) => {
  return await prisma.user.findUnique({ where: { username } });
};

// Mengatur username baru (username harus unik)
const setUsername = async (phone, username) => {
  const existingUser = await getUserByUsername(username);
  if (existingUser) return `❌ *Username "${username}" sudah digunakan!*`;

  await prisma.user.upsert({
    where: { phone },
    update: { username },
    create: { phone, username },
  });

  return `✅ *Username berhasil disimpan sebagai "${username}"!*`;
};

// Mengupdate username (jika sudah ada sebelumnya)
const updateUsername = async (phone, newUsername) => {
  const existingUser = await getUserByUsername(newUsername);
  if (existingUser) return `❌ *Username "${newUsername}" sudah digunakan!*`;

  await prisma.user.update({
    where: { phone },
    data: { username: newUsername },
  });

  return `✅ *Username berhasil diubah menjadi "${newUsername}"!*`;
};

// Menghapus user berdasarkan username
const deleteUserByUsername = async (username) => {
  const userToDelete = await getUserByUsername(username);
  if (!userToDelete)
    return `❌ *User dengan username "${username}" tidak ditemukan.*`;

  await prisma.user.delete({ where: { username } });
  return `✅ *User dengan username "${username}" berhasil dihapus!*`;
};

// Mendapatkan daftar semua user
const getAllUsers = async () => {
  const allUsers = await prisma.user.findMany();
  if (!allUsers.length) return "❌ *Tidak ada user yang terdaftar.*";

  return allUsers
    .map((u) => `👤 *${u.username || "Tanpa Nama"}* (📞 ${u.phone})`)
    .join("\n");
};

module.exports = {
  getUser,
  getUserByUsername,
  setUsername,
  updateUsername,
  deleteUserByUsername,
  getAllUsers,
};
