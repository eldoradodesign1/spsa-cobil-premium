/** SPSA COBIL — Nebula : documents de direction avec XLSX réellement mis en forme et PDF éditorial. */
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { AppData, Filters, MODULES, ModuleDefinition, getMetrics, formatDate, matchesFilters, priorityTone } from "@/lib/business";

type ExportMetric = ReturnType<typeof getMetrics>;
const ink = "FF27235C";
const violet = "FF645BDB";
const blue = "FF3E72E8";
const rose = "FFE56A9F";
const line = "FFD8D6F2";
const white = "FFFFFFFF";
const logoPath = `${import.meta.env.BASE_URL}icons/spsa-cobil-logo.png`;

const titleStyle: Partial<ExcelJS.Style> = { font: { name: "Aptos Display", size: 16, bold: true, color: { argb: white } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: ink } }, alignment: { vertical: "middle" } };
const headerStyle: Partial<ExcelJS.Style> = { font: { name: "Aptos", size: 10, bold: true, color: { argb: white } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: violet } }, alignment: { vertical: "middle", wrapText: true }, border: { bottom: { style: "thin", color: { argb: "FF4A42B2" } } } };
const textStyle: Partial<ExcelJS.Style> = { font: { name: "Aptos", size: 10, color: { argb: ink } }, alignment: { vertical: "top", wrapText: true }, border: { bottom: { style: "hair", color: { argb: line } } } };
const metricStyle: Partial<ExcelJS.Style> = { font: { name: "Aptos Display", size: 17, bold: true, color: { argb: violet } }, alignment: { vertical: "middle", horizontal: "center" }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F4FF" } }, border: { top: { style: "thin", color: { argb: line } }, bottom: { style: "thin", color: { argb: line } } } };

function dateOrBlank(value: string) { const date = new Date(`${value.slice(0, 10)}T12:00:00`); return value && !Number.isNaN(date.getTime()) ? date : ""; }
function mergeAndTitle(sheet: ExcelJS.Worksheet, title: string, columns: number) {
  sheet.getCell(1, 1).style = titleStyle;
  sheet.mergeCells(1, 2, 1, columns);
  const cell = sheet.getCell(1, 2); cell.value = title; cell.style = titleStyle;
  sheet.mergeCells(2, 1, 2, columns);
  const brandCell = sheet.getCell(2, 1); brandCell.value = "NEBULA EDITION  ·  SPSA COBIL  ·  CONFIDENTIEL"; brandCell.style = { font: { name: "Aptos", size: 8, bold: true, color: { argb: "FF5A54C8" } }, alignment: { vertical: "middle" } };
  sheet.getRow(1).height = 32; sheet.getRow(2).height = 15;
}
function applyHeader(row: ExcelJS.Row) { row.height = 28; row.eachCell((cell) => { cell.style = headerStyle; }); }
function applyText(row: ExcelJS.Row) { row.eachCell((cell) => { cell.style = textStyle; }); }
function columnWidth(header: string) { return Math.min(Math.max(header.length + 4, 13), 32); }
async function logoDataUri() {
  try {
    const response = await fetch(logoPath);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
  } catch { return null; }
}
function attachNebulaLogo(sheet: ExcelJS.Worksheet, imageId: number | null) {
  if (imageId === null) { sheet.getCell("A1").value = "◉"; return; }
  sheet.addImage(imageId, { tl: { col: 0.18, row: 0.12 }, ext: { width: 23, height: 23 } });
}
function priorityCellStyle(tone: ReturnType<typeof priorityTone>): Partial<ExcelJS.Style> {
  const colors = { rose: { fg: "FFFFEDF5", text: rose }, violet: { fg: "FFF0EEFF", text: violet }, blue: { fg: "FFEDF3FF", text: blue } }[tone];
  return { ...textStyle, font: { name: "Aptos", size: 10, bold: true, color: { argb: colors.text } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: colors.fg } }, alignment: { vertical: "middle", horizontal: "center" } };
}

function buildDashboard(workbook: ExcelJS.Workbook, metrics: ExportMetric, filters: Filters) {
  const sheet = workbook.addWorksheet("Tableau de bord", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  sheet.columns = Array.from({ length: 6 }, () => ({ width: 21 })); mergeAndTitle(sheet, "SPSA-COBIL — TABLEAU DE BORD IT / VISIBILITÉ DIRECTION", 6);
  sheet.mergeCells("B3:F3"); sheet.getCell("A3").value = "Période analysée"; sheet.getCell("B3").value = `${filters.from ? formatDate(filters.from) : "Début libre"} → ${filters.to ? formatDate(filters.to) : "Fin libre"}`; sheet.getCell("A3").style = headerStyle; sheet.getCell("B3").style = textStyle;
  sheet.getRow(5).values = ["Activités terminées", "", "Activités en cours", "", "Actions en attente", ""]; applyHeader(sheet.getRow(5)); sheet.getRow(6).values = [metrics.activitiesDone, "", metrics.activitiesInProgress, "", metrics.actionsWaiting, ""]; sheet.getRow(6).height = 38; sheet.getRow(6).eachCell((cell) => { cell.style = metricStyle; });
  sheet.getRow(8).values = ["Incidents ouverts", "", "Projets en cours", "", "Achats en attente", ""]; applyHeader(sheet.getRow(8)); sheet.getRow(9).values = [metrics.incidentsOpen, "", metrics.projectsInProgress, "", metrics.purchasesWaiting, ""]; sheet.getRow(9).height = 38; sheet.getRow(9).eachCell((cell) => { cell.style = metricStyle; });
  sheet.mergeCells("A11:F11"); sheet.getCell("A11").value = "REPÈRES DE DÉCISION"; sheet.getCell("A11").style = headerStyle;
  sheet.mergeCells("A12:F13"); sheet.getCell("A12").value = "Les indicateurs de ce classeur sont générés depuis SPSA COBIL. Le périmètre exporté est documenté dans la ligne de contexte ci-dessus."; sheet.getCell("A12").style = textStyle; sheet.getRow(12).height = 28;
  return sheet;
}

function buildReport(workbook: ExcelJS.Workbook, data: AppData, metrics: ExportMetric, filters: Filters) {
  const sheet = workbook.addWorksheet("Rapport hebdomadaire", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  sheet.columns = Array.from({ length: 8 }, () => ({ width: 18 })); mergeAndTitle(sheet, "SPSA-COBIL — RAPPORT HEBDOMADAIRE DU DÉPARTEMENT IT", 8);
  sheet.getRow(3).values = ["Période active du", dateOrBlank(filters.from || data.report.startDate), "au", dateOrBlank(filters.to || data.report.endDate)]; ["A3", "C3"].forEach((address) => { sheet.getCell(address).style = headerStyle; }); ["B3", "D3"].forEach((address) => { sheet.getCell(address).style = { ...textStyle, numFmt: "dd/mm/yyyy" }; });
  sheet.getRow(5).values = ["Activités réalisées", "", "Activités en cours", "", "Actions en attente", "", "Incidents résolus", ""]; applyHeader(sheet.getRow(5)); sheet.getRow(6).values = [metrics.activitiesDone, "", metrics.activitiesInProgress, "", metrics.actionsWaiting, "", metrics.incidentsResolved, ""]; sheet.getRow(6).height = 38; sheet.getRow(6).eachCell((cell) => { cell.style = metricStyle; });
  const sections = [
    [8, "1. RÉALISATIONS MAJEURES", data.report.realisations], [11, "2. POINTS DE VIGILANCE", data.report.vigilance], [14, "3. ACTIONS À VENIR", data.report.actions],
    [17, "4. DÉCISIONS ATTENDUES", data.report.decisions], [20, "5. BESOINS & RESSOURCES", data.report.ressources], [23, "6. NOTES DE CONTEXTE", data.report.commentaires],
  ];
  sections.forEach(([row, label, text]) => { sheet.mergeCells(row as number, 1, row as number, 8); sheet.getCell(row as number, 1).value = label as string; sheet.getCell(row as number, 1).style = headerStyle; sheet.mergeCells((row as number) + 1, 1, (row as number) + 2, 8); sheet.getCell((row as number) + 1, 1).value = (text as string) || "Aucune information renseignée."; sheet.getCell((row as number) + 1, 1).style = textStyle; sheet.getRow((row as number) + 1).height = 28; });
  return sheet;
}

function buildModule(workbook: ExcelJS.Workbook, definition: ModuleDefinition, rows: AppData["modules"][keyof AppData["modules"]]) {
  const sheet = workbook.addWorksheet(definition.sheet, { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  sheet.columns = definition.headers.map((header) => ({ width: columnWidth(header) })); mergeAndTitle(sheet, `SPSA-COBIL — ${definition.label.toUpperCase()}`, definition.headers.length);
  sheet.getRow(3).values = definition.headers; applyHeader(sheet.getRow(3));
  rows.forEach((record, index) => {
    const values = definition.headers.map((header, column) => {
      if (column === 0 && header === "ID") return { formula: `IF(B${index + 4}="","",ROW()-3)` };
      const field = definition.fields.find((item) => item.key === header); return field?.type === "date" ? dateOrBlank(record[header] || "") : record[header] || "";
    });
    const row = sheet.addRow(values); row.height = 28; applyText(row);
    definition.fields.filter((field) => field.type === "date").forEach((field) => { const cell = row.getCell(definition.headers.indexOf(field.key) + 1); cell.numFmt = "dd/mm/yyyy"; });
    const priorityColumn = definition.headers.indexOf("Priorité");
    if (priorityColumn >= 0) row.getCell(priorityColumn + 1).style = priorityCellStyle(priorityTone(record.Priorité));
  });
  sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: Math.max(3, rows.length + 3), column: definition.headers.length } };
  return sheet;
}

function downloadWorkbook(buffer: ArrayBuffer, suffix = "Pilotage_IT") {
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `SPSA-COBIL_${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportXlsx(data: AppData, filters: Filters) {
  const metrics = getMetrics(data, filters); const workbook = new ExcelJS.Workbook(); workbook.creator = "SPSA COBIL"; workbook.lastModifiedBy = "SPSA COBIL"; workbook.created = new Date(); workbook.modified = new Date();
  buildDashboard(workbook, metrics, filters); buildReport(workbook, data, metrics, filters); MODULES.forEach((definition) => buildModule(workbook, definition, data.modules[definition.key].filter((record) => matchesFilters(record, filters))));
  const logo = await logoDataUri(); const imageId = logo ? workbook.addImage({ base64: logo, extension: "png" }) : null; workbook.worksheets.forEach((sheet) => attachNebulaLogo(sheet, imageId));
  const buffer = await workbook.xlsx.writeBuffer(); downloadWorkbook(buffer as ArrayBuffer);
}

export async function exportPdf(element: HTMLElement, kind: "dashboard" | "report" | "compiled" | "module", moduleLabel = "Rubrique") {
  const logo = await logoDataUri();
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f7f6ff",
    logging: false,
    onclone: (document) => {
      document.querySelectorAll<HTMLElement>(".export-document__veil").forEach((node) => { node.style.backgroundImage = "none"; node.style.opacity = "0"; });
      document.querySelectorAll<HTMLImageElement>(".export-document .brand-mark").forEach((node) => { if (logo) node.src = logo; else node.style.display = "none"; });
    },
  });
  const image = canvas.toDataURL("image/png"); const document = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" }); const width = 190; const height = (canvas.height * width) / canvas.width; const pageHeight = 277; let rendered = 0;
  document.setProperties({ title: `SPSA COBIL — ${kind === "dashboard" ? "Pilotage IT" : kind === "report" ? "Rapport hebdomadaire" : kind === "compiled" ? "Pack de pilotage complet" : `Détail ${moduleLabel}`}` });
  while (rendered < height) { if (rendered > 0) document.addPage(); document.addImage(image, "PNG", 10, 10 - rendered, width, height, undefined, "FAST"); document.setTextColor(90, 84, 200); document.setFontSize(7); document.text("SPSA COBIL · NEBULA EDITION · Document préparé depuis le cockpit de pilotage", 10, 291); rendered += pageHeight; }
  const moduleSlug = moduleLabel.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  document.save(`SPSA-COBIL_${kind === "dashboard" ? "Pilotage_IT" : kind === "report" ? "Rapport_Hebdomadaire" : kind === "compiled" ? "Pack_Complet" : `Rubrique_${moduleSlug}`}.pdf`);
}

export const reportDateLabel = (data: AppData) => data.report.startDate || data.report.endDate ? `${formatDate(data.report.startDate)} — ${formatDate(data.report.endDate)}` : "Période à renseigner";
