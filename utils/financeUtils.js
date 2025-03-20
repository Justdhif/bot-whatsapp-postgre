const { financeDB } = require("../database/financeDB");
const XLSX = require("xlsx");
const path = require("path");

const addIncome = (amount, description) => {
  financeDB.income.push({ amount, description, date: new Date() });
};

const addExpense = (amount, description) => {
  financeDB.expenses.push({ amount, description, date: new Date() });
};

const calculateBalance = () => {
  const totalIncome = financeDB.income.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalExpenses = financeDB.expenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  return totalIncome - totalExpenses;
};

const createExcelFile = () => {
  const workbook = XLSX.utils.book_new();

  // Sheet Income
  const incomeSheet = XLSX.utils.json_to_sheet(financeDB.income);
  XLSX.utils.book_append_sheet(workbook, incomeSheet, "Income");

  // Sheet Expenses
  const expensesSheet = XLSX.utils.json_to_sheet(financeDB.expenses);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, "Expenses");

  // Simpan file Excel
  const filePath = path.join(__dirname, "finance_report.xlsx");
  XLSX.writeFile(workbook, filePath);

  return filePath;
};

module.exports = { addIncome, addExpense, calculateBalance, createExcelFile };
