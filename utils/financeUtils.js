const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");
const fs = require("fs-extra");
const path = require("path");

const prisma = new PrismaClient();

// Menangani pemasukan & pengeluaran
const handleFinanceCommand = async (msg, args, type) => {
  const amount = parseFloat(args[0]);
  const description = args.slice(1).join(" ") || "Tanpa deskripsi";

  if (!amount || isNaN(amount)) {
    return msg.reply(
      `❌ Format salah!\nGunakan: *!${type} [jumlah] [desk]*\n📌 Contoh: *!${type} 50000 Gaji bulanan*`
    );
  }

  try {
    await prisma.finance.create({
      data: { type, amount, description, isDeleted: false },
    });

    msg.reply(
      `✅ ${
        type === "income" ? "Pemasukan" : "Pengeluaran"
      } sebesar *${amount}* telah ditambahkan.`
    );
  } catch (error) {
    console.error("Finance Command error:", error);
    msg.reply("❌ Gagal menambahkan data keuangan.");
  }
};

// Mendapatkan detail saldo
const getBalanceDetails = (data) => {
  const activeData = data.filter((i) => !i.isDeleted);
  const totalIncome = activeData
    .filter((i) => i.type === "income")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = activeData
    .filter((i) => i.type === "expense")
    .reduce((sum, i) => sum + i.amount, 0);
  const balance = totalIncome - totalExpense;

  const formatList = (items, symbol) =>
    items
      .map(
        (item, i) => `${i + 1}. ${symbol} ${item.amount} (${item.description})`
      )
      .join("\n") || "Tidak ada data.";

  return `💰 *Saldo Saat Ini: ${balance}*\n\n📥 *Pemasukan:*\n${formatList(
    activeData.filter((i) => i.type === "income"),
    "💰 +"
  )}\n\n📤 *Pengeluaran:*\n${formatList(
    activeData.filter((i) => i.type === "expense"),
    "💸 -"
  )}`;
};

// Fungsi untuk membuat sheet dari data
const generateSheet = (data) =>
  XLSX.utils.json_to_sheet(
    data.map((item, index) => ({
      No: index + 1,
      Jumlah: item.amount,
      Deskripsi: item.description,
      Tanggal: new Date(item.date).toLocaleDateString("id-ID"),
    }))
  );

// Membuat file laporan keuangan dalam bentuk Excel
const createExcelFile = async () => {
  try {
    const financeData = await prisma.finance.findMany({
      where: { isDeleted: false },
    });

    const incomeSheet = generateSheet(
      financeData.filter((item) => item.type === "income")
    );
    const expenseSheet = generateSheet(
      financeData.filter((item) => item.type === "expense")
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, incomeSheet, "Income");
    XLSX.utils.book_append_sheet(workbook, expenseSheet, "Expenses");

    const reportsDir = path.join(__dirname, "../reports");
    await fs.ensureDir(reportsDir); // Pastikan folder ada

    const filePath = path.join(reportsDir, "finance_report.xlsx");
    XLSX.writeFile(workbook, filePath);

    return filePath;
  } catch (error) {
    console.error("Excel Report error:", error);
    throw new Error("Gagal membuat laporan keuangan.");
  }
};

module.exports = {
  handleFinanceCommand,
  getBalanceDetails,
  createExcelFile,
};
