/** SPSA COBIL — Nebula : modèle métier indépendant du classeur historique. */
import * as XLSX from "xlsx";

export type FieldType = "text" | "textarea" | "date" | "number" | "select";
export type ModuleKey = "suivi" | "incidents" | "projets" | "fournisseurs" | "equipements" | "achats";
export type RecordItem = Record<string, string>;

export type FieldDefinition = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  eyebrow: string;
  description: string;
  sheet: string;
  icon: string;
  capacity: number;
  primaryField: string;
  headers: string[];
  fields: FieldDefinition[];
};

export type WeeklyReport = {
  startDate: string;
  endDate: string;
  realisations: string;
  vigilance: string;
  actions: string;
  decisions: string;
  ressources: string;
  commentaires: string;
};

export type AppData = {
  modules: Record<ModuleKey, RecordItem[]>;
  report: WeeklyReport;
  sourceName: string;
  updatedAt: string | null;
};

export type Filters = { from: string; to: string; responsible: string; site: string };
export type ImportTarget = ModuleKey | "report" | "ignore";
export type ImportPreviewRow = { index: number; values: RecordItem; selected: boolean };
export type ImportSheetPreview = { id: string; sourceName: string; target: ImportTarget; selected: boolean; headers: string[]; rows: ImportPreviewRow[]; report?: WeeklyReport };
export type ImportPreview = { fileName: string; sheets: ImportSheetPreview[] };

export const MODULES: ModuleDefinition[] = [
  {
    key: "suivi",
    label: "Suivi permanent",
    eyebrow: "Activités & demandes",
    description: "Piloter les demandes IT, leurs responsables et les prochaines actions.",
    sheet: "Suivi permanent",
    icon: "Activity",
    capacity: 500,
    primaryField: "Activité / Demande",
    headers: ["ID", "Date", "Activité / Demande", "Demandeur / Service", "Catégorie", "Priorité", "Responsable", "Statut", "Résultat / Impact pour SPSA-COBIL", "Prochaine action", "Échéance", "Commentaires / Preuve"],
    fields: [
      { key: "Date", label: "Date", type: "date", required: true },
      { key: "Activité / Demande", label: "Activité / Demande", type: "text", required: true, placeholder: "Ex. Renouvellement des accès VPN" },
      { key: "Demandeur / Service", label: "Demandeur / Service", type: "text" },
      { key: "Catégorie", label: "Catégorie", type: "select", options: ["Support", "Réseau", "Systèmes", "Sécurité", "Applications", "Autre"] },
      { key: "Priorité", label: "Priorité", type: "select", options: ["Basse", "Normale", "Haute", "Critique"] },
      { key: "Responsable", label: "Responsable", type: "text" },
      { key: "Statut", label: "Statut", type: "select", options: ["En cours", "Terminé", "En attente", "En retard", "Annulé"] },
      { key: "Résultat / Impact pour SPSA-COBIL", label: "Résultat / Impact", type: "textarea" },
      { key: "Prochaine action", label: "Prochaine action", type: "text" },
      { key: "Échéance", label: "Échéance", type: "date" },
      { key: "Commentaires / Preuve", label: "Commentaires / Preuve", type: "textarea" },
    ],
  },
  {
    key: "incidents",
    label: "Incidents",
    eyebrow: "Support & résolution",
    description: "Déclarer, suivre et clôturer les incidents avec leur cause et leur impact.",
    sheet: "Incidents",
    icon: "Siren",
    capacity: 500,
    primaryField: "Description",
    headers: ["ID", "Date", "Utilisateur / Service", "Description", "Catégorie", "Priorité", "Statut", "Cause", "Action corrective", "Temps de résolution", "Commentaires / preuve"],
    fields: [
      { key: "Date", label: "Date", type: "date", required: true },
      { key: "Utilisateur / Service", label: "Utilisateur / Service", type: "text" },
      { key: "Description", label: "Description", type: "textarea", required: true, placeholder: "Décrire le symptôme observé" },
      { key: "Catégorie", label: "Catégorie", type: "select", options: ["Réseau", "Poste de travail", "Application", "Sécurité", "Accès", "Autre"] },
      { key: "Priorité", label: "Priorité", type: "select", options: ["Basse", "Normale", "Haute", "Critique"] },
      { key: "Statut", label: "Statut", type: "select", options: ["Ouvert", "En cours", "Résolu", "Annulé"] },
      { key: "Cause", label: "Cause", type: "text" },
      { key: "Action corrective", label: "Action corrective", type: "textarea" },
      { key: "Temps de résolution", label: "Temps de résolution", type: "text", placeholder: "Ex. 2 h 30" },
      { key: "Commentaires / preuve", label: "Commentaires / preuve", type: "textarea" },
    ],
  },
  {
    key: "projets",
    label: "Projets",
    eyebrow: "Portefeuille IT",
    description: "Suivre l’avancement, les échéances, le budget et les risques du portefeuille.",
    sheet: "Projets",
    icon: "Orbit",
    capacity: 200,
    primaryField: "Projet",
    headers: ["ID", "Projet", "Objectif", "Responsable", "Date début", "Échéance", "Statut", "% Avancement", "Budget USD", "Risques / prochaines étapes"],
    fields: [
      { key: "Projet", label: "Projet", type: "text", required: true },
      { key: "Objectif", label: "Objectif", type: "textarea" },
      { key: "Responsable", label: "Responsable", type: "text" },
      { key: "Date début", label: "Date début", type: "date" },
      { key: "Échéance", label: "Échéance", type: "date" },
      { key: "Statut", label: "Statut", type: "select", options: ["En cours", "Terminé", "En attente", "En retard", "Annulé"] },
      { key: "% Avancement", label: "% Avancement", type: "number", placeholder: "0 à 100" },
      { key: "Budget USD", label: "Budget USD", type: "number", placeholder: "0.00" },
      { key: "Risques / prochaines étapes", label: "Risques / prochaines étapes", type: "textarea" },
    ],
  },
  {
    key: "fournisseurs",
    label: "Fournisseurs",
    eyebrow: "Contrats & relances",
    description: "Garder une vue nette sur les contrats, les relances et les escalades fournisseurs.",
    sheet: "Fournisseurs",
    icon: "Building2",
    capacity: 300,
    primaryField: "Fournisseur",
    headers: ["ID", "Fournisseur", "Service / Contrat", "Contact", "Date demande", "Dernière relance", "Statut", "Délai attendu", "Problème / besoin", "Action / escalade", "Commentaires / preuve"],
    fields: [
      { key: "Fournisseur", label: "Fournisseur", type: "text", required: true },
      { key: "Service / Contrat", label: "Service / Contrat", type: "text" },
      { key: "Contact", label: "Contact", type: "text" },
      { key: "Date demande", label: "Date demande", type: "date" },
      { key: "Dernière relance", label: "Dernière relance", type: "date" },
      { key: "Statut", label: "Statut", type: "select", options: ["Actif", "En attente", "À relancer", "Clôturé"] },
      { key: "Délai attendu", label: "Délai attendu", type: "text" },
      { key: "Problème / besoin", label: "Problème / besoin", type: "textarea" },
      { key: "Action / escalade", label: "Action / escalade", type: "textarea" },
      { key: "Commentaires / preuve", label: "Commentaires / preuve", type: "textarea" },
    ],
  },
  {
    key: "equipements",
    label: "Équipements",
    eyebrow: "Inventaire du parc",
    description: "Tenir un inventaire exploitable des actifs, de leur état et de leur garantie.",
    sheet: "Équipements",
    icon: "MonitorCog",
    capacity: 500,
    primaryField: "Équipement",
    headers: ["Asset ID", "Équipement", "Marque / Modèle", "N° Série", "Site", "Localisation", "Responsable", "IP / MAC", "État", "Date acquisition", "Garantie", "Commentaires"],
    fields: [
      { key: "Asset ID", label: "Asset ID", type: "text", required: true },
      { key: "Équipement", label: "Équipement", type: "text", required: true },
      { key: "Marque / Modèle", label: "Marque / Modèle", type: "text" },
      { key: "N° Série", label: "N° Série", type: "text" },
      { key: "Site", label: "Site", type: "text" },
      { key: "Localisation", label: "Localisation", type: "text" },
      { key: "Responsable", label: "Responsable", type: "text" },
      { key: "IP / MAC", label: "IP / MAC", type: "text" },
      { key: "État", label: "État", type: "select", options: ["En service", "En stock", "À réparer", "Réformé"] },
      { key: "Date acquisition", label: "Date acquisition", type: "date" },
      { key: "Garantie", label: "Garantie", type: "text" },
      { key: "Commentaires", label: "Commentaires", type: "textarea" },
    ],
  },
  {
    key: "achats",
    label: "Achats IT",
    eyebrow: "Demandes & approbations",
    description: "Suivre les demandes d’achat, les approbateurs, les montants et les décisions.",
    sheet: "Achats IT",
    icon: "ReceiptText",
    capacity: 300,
    primaryField: "Équipement / Service",
    headers: ["ID", "Date", "Équipement / Service", "Justification", "Demandeur", "Fournisseur", "Montant USD", "Statut", "Approbateur", "Date approbation", "Commentaires"],
    fields: [
      { key: "Date", label: "Date", type: "date", required: true },
      { key: "Équipement / Service", label: "Équipement / Service", type: "text", required: true },
      { key: "Justification", label: "Justification", type: "textarea" },
      { key: "Demandeur", label: "Demandeur", type: "text" },
      { key: "Fournisseur", label: "Fournisseur", type: "text" },
      { key: "Montant USD", label: "Montant USD", type: "number" },
      { key: "Statut", label: "Statut", type: "select", options: ["En attente", "Approuvé", "Commandé", "Reçu", "Refusé"] },
      { key: "Approbateur", label: "Approbateur", type: "text" },
      { key: "Date approbation", label: "Date approbation", type: "date" },
      { key: "Commentaires", label: "Commentaires", type: "textarea" },
    ],
  },
];

export const MODULE_BY_KEY = Object.fromEntries(MODULES.map((module) => [module.key, module])) as Record<ModuleKey, ModuleDefinition>;

export const REPORT_SECTIONS = [
  { key: "realisations", label: "Réalisations majeures", helper: "Les réalisations importantes et leur impact concret." },
  { key: "vigilance", label: "Points de vigilance", helper: "Incidents, blocages, dépendances et risques à suivre." },
  { key: "actions", label: "Actions à venir", helper: "Les priorités opérationnelles de la prochaine séquence." },
  { key: "decisions", label: "Décisions attendues", helper: "Les arbitrages, approbations ou budgets nécessaires." },
  { key: "ressources", label: "Besoins & ressources", helper: "Capacité, équipements, compétences ou partenaires requis." },
  { key: "commentaires", label: "Notes de contexte", helper: "Les éléments utiles à la lecture de direction." },
] as const;

export const EMPTY_REPORT: WeeklyReport = { startDate: "", endDate: "", realisations: "", vigilance: "", actions: "", decisions: "", ressources: "", commentaires: "" };

export const emptyData = (sourceName = "SPSA-COBIL · espace de travail") : AppData => ({
  modules: { suivi: [], incidents: [], projets: [], fournisseurs: [], equipements: [], achats: [] },
  report: { ...EMPTY_REPORT },
  sourceName,
  updatedAt: null,
});

const dateColumns = ["Date", "Date début", "Date demande", "Date acquisition", "Date approbation"];

export const todayIso = () => new Date().toISOString().slice(0, 10);
export const toIsoDate = (value: unknown) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString().slice(0, 10);
};

export const formatDate = (value: string, withYear = true) => {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(date).replace(".", "");
};

export const formatMoney = (value: string | number) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount) : "—";
};

export const getRecordDate = (record: RecordItem) => dateColumns.map((key) => record[key] || "").find(Boolean) || "";
export const getResponsible = (record: RecordItem) => record.Responsable || record.Demandeur || record.Approbateur || "";
export const getSite = (record: RecordItem) => record.Site || "";

export const matchesFilters = (record: RecordItem, filters: Filters) => {
  const date = getRecordDate(record);
  const dateOk = (!filters.from || !date || date >= filters.from) && (!filters.to || !date || date <= filters.to);
  const responsibleOk = !filters.responsible || getResponsible(record) === filters.responsible;
  const siteOk = !filters.site || getSite(record) === filters.site;
  return dateOk && responsibleOk && siteOk;
};

export const statusTone = (status = "") => {
  const value = status.toLowerCase();
  if (["terminé", "résolu", "approuvé", "reçu", "actif", "en service", "clôturé"].includes(value)) return "positive";
  if (["en retard", "critique", "ouvert", "à relancer", "à réparer", "refusé"].includes(value)) return "negative";
  if (["en attente", "en cours", "commandé", "en stock"].includes(value)) return "warning";
  return "neutral";
};

export const priorityTone = (priority = "") => {
  const value = priority.toLowerCase().trim();
  if (["critique", "urgent", "urgente"].includes(value)) return "rose";
  if (["haute", "élevée", "elevee"].includes(value)) return "violet";
  return "blue";
};

export const isPast = (date: string) => Boolean(date && new Date(`${date}T23:59:59`).getTime() < Date.now());

export const getDateBounds = (data: AppData) => {
  const collected = [
    ...MODULES.flatMap((module) => data.modules[module.key].map(getRecordDate)),
    data.report.startDate,
    data.report.endDate,
  ].filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)).sort();
  if (collected.length) return { min: collected[0], max: collected[collected.length - 1], ticks: Array.from(new Set(collected)) };
  const today = new Date();
  const before = new Date(today); before.setMonth(before.getMonth() - 6);
  return { min: before.toISOString().slice(0, 10), max: today.toISOString().slice(0, 10), ticks: [] as string[] };
};

export const getMetrics = (data: AppData, filters: Filters) => {
  const scoped = Object.fromEntries(MODULES.map((module) => [module.key, data.modules[module.key].filter((record) => matchesFilters(record, filters))])) as AppData["modules"];
  const activities = scoped.suivi;
  const incidents = scoped.incidents;
  const projects = scoped.projets;
  const purchases = scoped.achats;
  const vendors = scoped.fournisseurs;
  const equipment = scoped.equipements;
  const alerts = [
    ...activities.filter((record) => record.Échéance).map((record) => ({ module: "Suivi", label: record["Activité / Demande"] || "Activité sans titre", date: record.Échéance, tone: isPast(record.Échéance) ? "negative" : "warning" })),
    ...projects.filter((record) => record.Échéance).map((record) => ({ module: "Projet", label: record.Projet || "Projet sans titre", date: record.Échéance, tone: isPast(record.Échéance) ? "negative" : "warning" })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  return {
    scoped,
    alerts,
    activitiesDone: activities.filter((record) => record.Statut === "Terminé").length,
    activitiesInProgress: activities.filter((record) => record.Statut === "En cours").length,
    actionsWaiting: activities.filter((record) => ["En attente", "En retard"].includes(record.Statut)).length,
    incidentsOpen: incidents.filter((record) => ["Ouvert", "En cours"].includes(record.Statut)).length,
    incidentsResolved: incidents.filter((record) => record.Statut === "Résolu").length,
    projectsInProgress: projects.filter((record) => record.Statut === "En cours").length,
    projectsLate: projects.filter((record) => record.Statut === "En retard" || isPast(record.Échéance)).length,
    purchasesWaiting: purchases.filter((record) => record.Statut === "En attente").length,
    vendorsToFollow: vendors.filter((record) => ["En attente", "À relancer"].includes(record.Statut)).length,
    equipment: equipment.length,
    totalRecords: Object.values(scoped).flat().length,
  };
};

export const getWeeklyTrend = (data: AppData, filters: Filters) => {
  const records = [...data.modules.suivi, ...data.modules.incidents].filter((record) => matchesFilters(record, filters) && getRecordDate(record));
  const byWeek = new Map<string, { activities: number; incidents: number }>();
  records.forEach((record) => {
    const date = new Date(`${getRecordDate(record)}T12:00:00`);
    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const current = byWeek.get(key) || { activities: 0, incidents: 0 };
    if ("Activité / Demande" in record) current.activities += 1;
    if ("Description" in record) current.incidents += 1;
    byWeek.set(key, current);
  });
  return Array.from(byWeek.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([key, value]) => ({ key, label: formatDate(key, false), ...value }));
};

const cellValue = (cell: XLSX.CellObject | undefined) => {
  if (!cell || cell.v === undefined || cell.v === null || cell.f) return "";
  if (cell.v instanceof Date) return cell.v.toISOString().slice(0, 10);
  if (cell.t === "n" && cell.z && /[dmy]/i.test(String(cell.z))) {
    const parsed = XLSX.SSF.parse_date_code(Number(cell.v));
    return parsed ? `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}` : String(cell.v);
  }
  return String(cell.v);
};

const readRows = (sheet: XLSX.WorkSheet | undefined, definition: ModuleDefinition) => {
  if (!sheet || !sheet["!ref"]) return [];
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const rows: RecordItem[] = [];
  for (let row = 3; row <= range.e.r; row += 1) {
    const item: RecordItem = {};
    let hasValue = false;
    definition.headers.forEach((header, column) => {
      const value = cellValue(sheet[XLSX.utils.encode_cell({ r: row, c: column })]);
      item[header] = value;
      if (header !== "ID" && value) hasValue = true;
    });
    if (hasValue) rows.push(item);
  }
  return rows;
};

export async function importWorkbook(file: File): Promise<AppData> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, cellStyles: true });
  const data = emptyData(file.name);
  MODULES.forEach((definition) => { data.modules[definition.key] = readRows(workbook.Sheets[definition.sheet], definition); });
  const report = workbook.Sheets["Rapport hebdomadaire"];
  if (report) {
    data.report = {
      startDate: toIsoDate(cellValue(report.B3)), endDate: toIsoDate(cellValue(report.D3)),
      realisations: cellValue(report.A10), vigilance: cellValue(report.A19), actions: cellValue(report.A27),
      decisions: cellValue(report.A35), ressources: cellValue(report.A43), commentaires: cellValue(report.A51),
    };
  }
  data.updatedAt = new Date().toISOString();
  return data;
}

function genericSheetRows(sheet: XLSX.WorkSheet | undefined) {
  if (!sheet || !sheet["!ref"]) return { headers: [] as string[], rows: [] as RecordItem[] };
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const headerRow = Math.min(range.s.r + 1, range.e.r);
  const headers = Array.from({ length: range.e.c - range.s.c + 1 }, (_, offset) => cellValue(sheet[XLSX.utils.encode_cell({ r: headerRow, c: range.s.c + offset })]) || `Colonne ${offset + 1}`);
  const rows: RecordItem[] = [];
  for (let row = headerRow + 1; row <= range.e.r; row += 1) {
    const values: RecordItem = {}; let hasValue = false;
    headers.forEach((header, offset) => { const value = cellValue(sheet[XLSX.utils.encode_cell({ r: row, c: range.s.c + offset })]); values[header] = value; if (value) hasValue = true; });
    if (hasValue) rows.push(values);
  }
  return { headers, rows };
}

export async function previewWorkbook(file: File): Promise<ImportPreview> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, cellStyles: true });
  const moduleBySheet = new Map(MODULES.map((definition) => [definition.sheet, definition]));
  const sheets = workbook.SheetNames.map((sourceName, sheetIndex) => {
    const definition = moduleBySheet.get(sourceName);
    if (definition) {
      const rows = readRows(workbook.Sheets[sourceName], definition);
      return { id: `${sheetIndex}-${sourceName}`, sourceName, target: definition.key as ImportTarget, selected: true, headers: definition.headers, rows: rows.map((values, index) => ({ index, values, selected: true })) };
    }
    if (sourceName === "Rapport hebdomadaire") {
      const report = workbook.Sheets[sourceName];
      return { id: `${sheetIndex}-${sourceName}`, sourceName, target: "report" as ImportTarget, selected: true, headers: ["Synthèse narrative"], rows: [], report: { startDate: toIsoDate(cellValue(report.B3)), endDate: toIsoDate(cellValue(report.D3)), realisations: cellValue(report.A10), vigilance: cellValue(report.A19), actions: cellValue(report.A27), decisions: cellValue(report.A35), ressources: cellValue(report.A43), commentaires: cellValue(report.A51) } };
    }
    const generic = genericSheetRows(workbook.Sheets[sourceName]);
    return { id: `${sheetIndex}-${sourceName}`, sourceName, target: "ignore" as ImportTarget, selected: false, headers: generic.headers, rows: generic.rows.map((values, index) => ({ index, values, selected: false })) };
  });
  return { fileName: file.name, sheets };
}

function mapImportRow(row: RecordItem, sourceHeaders: string[], definition: ModuleDefinition) {
  const mapped: RecordItem = {};
  definition.headers.forEach((header, index) => { mapped[header] = row[header] ?? row[sourceHeaders[index]] ?? ""; });
  return mapped;
}

export function importPreviewToData(preview: ImportPreview): AppData {
  const data = emptyData(preview.fileName);
  preview.sheets.forEach((sheet) => {
    if (!sheet.selected || sheet.target === "ignore") return;
    if (sheet.target === "report") { if (sheet.report) data.report = sheet.report; return; }
    const target = sheet.target as ModuleKey;
    const definition = MODULE_BY_KEY[target];
    data.modules[target].push(...sheet.rows.filter((row) => row.selected).map((row) => mapImportRow(row.values, sheet.headers, definition)));
  });
  data.updatedAt = new Date().toISOString();
  return data;
}
