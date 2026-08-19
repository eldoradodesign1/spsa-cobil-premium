import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const downloadDir = "/home/ubuntu/Downloads";
const latest = fs.readdirSync(downloadDir)
  .filter((name) => /^SPSA-COBIL_Pilotage_IT.*\.xlsx$/i.test(name))
  .map((name) => ({ name, full: path.join(downloadDir, name), mtime: fs.statSync(path.join(downloadDir, name)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)[0];

if (!latest) throw new Error("Aucun export XLSX SPSA COBIL trouvé.");
const workbook = XLSX.readFile(latest.full, { cellDates: true });
const report = {};
for (const name of workbook.SheetNames) {
  const grid = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "" });
  const headers = grid[2] || [];
  const rows = grid.slice(3).filter((row) => row.some((cell) => String(cell).trim()));
  const dateIndex = headers.findIndex((header) => ["Date", "Date début", "Date demande", "Date acquisition"].includes(String(header)));
  report[name] = { rows: rows.length, dates: dateIndex >= 0 ? rows.map((row) => row[dateIndex]).filter(Boolean).slice(0, 8) : [] };
}
console.log(JSON.stringify({ file: latest.name, sheets: report }, null, 2));
