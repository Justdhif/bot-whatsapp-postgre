const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getUser = async (msg) => {
  const phone = msg.from.endsWith("@g.us")
    ? msg.author.split("@")[0]
    : msg.from.split("@")[0];

  return prisma.user.findUnique({ where: { phone } });
};

const loginUser = async (msg) => {
  const phone = msg.from.split("@")[0];
  await prisma.user.upsert({
    where: { phone },
    update: { isLoggedIn: true },
    create: { phone, isLoggedIn: true },
  });
};

const logoutUser = async (phone) => {
  await prisma.user.update({
    where: { phone },
    data: { isLoggedIn: false },
  });
};

const setUsername = async (phone, username) => {
  await prisma.user.update({
    where: { phone },
    data: { username },
  });
};

const deleteUser = async (phone) => {
  const userToDelete = await prisma.user.findUnique({ where: { phone } });
  if (!userToDelete) return `❌ *User dengan nomor ${phone} tidak ditemukan.*`;
  if (userToDelete.isLoggedIn)
    return `❌ *User ${phone} masih login! Hanya bisa menghapus user yang sudah logout.*`;

  await prisma.user.delete({ where: { phone } });
  return `✅ *User dengan nomor ${phone} berhasil dihapus!*`;
};

const getAllUsers = async () => {
  const allUsers = await prisma.user.findMany();
  if (!allUsers.length) return "❌ *Tidak ada user yang terdaftar.*";

  return allUsers
    .map(
      (u) =>
        `📞 *${u.phone}*\n👤 *${u.username || "Belum di-set"}*\n🔒 Status: ${
          u.isLoggedIn ? "🟢 Login" : "🔴 Logout"
        }\n`
    )
    .join("\n");
};

const checkLogin = async (msg) => {
  const phone = msg.from.endsWith("@g.us")
    ? msg.author.split("@")[0]
    : msg.from.split("@")[0];
  const user = await prisma.user.findUnique({ where: { phone } });
  return user?.isLoggedIn;
};

module.exports = {
  getUser,
  loginUser,
  logoutUser,
  setUsername,
  deleteUser,
  getAllUsers,
  checkLogin,
};
