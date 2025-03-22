const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const createExcelFile = async () => {
  const financeData = await prisma.finance.findMany();

  // Pisahkan data income & expense
  const incomeData = financeData.filter((item) => item.type === "income");
  const expenseData = financeData.filter((item) => item.type === "expense");

  // Konversi ke format JSON untuk Excel
  const incomeSheet = XLSX.utils.json_to_sheet(
    incomeData.map((item, index) => ({
      No: index + 1,
      Jumlah: item.amount,
      Deskripsi: item.description,
      Tanggal: item.date,
    }))
  );

  const expenseSheet = XLSX.utils.json_to_sheet(
    expenseData.map((item, index) => ({
      No: index + 1,
      Jumlah: item.amount,
      Deskripsi: item.description,
      Tanggal: item.date,
    }))
  );

  // Buat workbook dan tambahkan kedua sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, incomeSheet, "Income");
  XLSX.utils.book_append_sheet(workbook, expenseSheet, "Expenses");

  // Simpan file Excel di folder 'reports'
  const reportsDir = path.join(__dirname, "../reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filePath = path.join(reportsDir, "finance_report.xlsx");
  XLSX.writeFile(workbook, filePath);

  return filePath;
};

module.exports = { createExcelFile };
