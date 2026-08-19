import ExcelJS from "exceljs";

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("Style");
sheet.getCell("A1").value = "SPSA COBIL";
sheet.getCell("A1").style = {
  font: { name: "Aptos", size: 16, bold: true, color: { argb: "FFFFFFFF" } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF173845" } },
};
const buffer = await workbook.xlsx.writeBuffer();
await (await import("node:fs/promises")).writeFile("/home/ubuntu/source-audit/exceljs_style_check.xlsx", Buffer.from(buffer));
