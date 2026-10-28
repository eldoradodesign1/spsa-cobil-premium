import { AppData, ModuleKey, emptyData } from "@/lib/business";

const REFRESH_RECOVERY_KEY = "spsa-cobil-refresh-recovery-v1";
const LEGACY_AUTOSAVE_KEY = "spsa-cobil-autosave-csv-v1";

type CsvRow = [string, string, string, string, string];

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { current += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) { values.push(current); current = ""; }
    else current += character;
  }
  values.push(current);
  return values;
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') { current += '"'; index += 1; }
      else { quoted = !quoted; current += character; }
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (current) rows.push(parseCsvLine(current));
      current = "";
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
    } else current += character;
  }
  if (current) rows.push(parseCsvLine(current));
  return rows;
}

export function serializeAppData(data: AppData) {
  const rows: CsvRow[] = [["section", "module", "index", "key", "value"]];
  rows.push(["meta", "", "", "sourceName", data.sourceName]);
  rows.push(["meta", "", "", "updatedAt", data.updatedAt || ""]);
  Object.entries(data.report).forEach(([key, value]) => rows.push(["report", "", "", key, value]));
  (Object.keys(data.modules) as ModuleKey[]).forEach((module) => {
    data.modules[module].forEach((record, index) => Object.entries(record).forEach(([key, value]) => rows.push(["record", module, String(index), key, value])));
  });
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n") + "\r\n";
}

export function parseAppDataCsv(csv: string): AppData | null {
  const rows = parseCsv(csv);
  if (!rows.length || rows[0].join(",") !== "section,module,index,key,value") return null;
  const data = emptyData("Récupération CSV SPSA COBIL");
  const records = new Map<string, Record<string, string>>();
  rows.slice(1).forEach(([section, module, index, key, value]) => {
    if (section === "meta" && key === "sourceName") data.sourceName = value;
    else if (section === "meta" && key === "updatedAt") data.updatedAt = value || null;
    else if (section === "report" && key in data.report) data.report[key as keyof AppData["report"]] = value;
    else if (section === "record" && module in data.modules && index && key) {
      const identifier = `${module}:${index}`;
      const record = records.get(identifier) || {};
      record[key] = value;
      records.set(identifier, record);
    }
  });
  records.forEach((record, identifier) => {
    const [module] = identifier.split(":") as [ModuleKey];
    const index = Number(identifier.split(":")[1]);
    if (Number.isInteger(index)) data.modules[module][index] = { ...data.modules[module][index], ...record };
  });
  (Object.keys(data.modules) as ModuleKey[]).forEach((module) => { data.modules[module] = data.modules[module].filter(Boolean); });
  return data;
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function persistRefreshRecovery(data: AppData) {
  try {
    sessionStorage.setItem(REFRESH_RECOVERY_KEY, JSON.stringify({ createdAt: Date.now(), csv: serializeAppData(data) }));
  } catch {}
}

export function consumeRefreshRecovery() {
  try {
    const raw = sessionStorage.getItem(REFRESH_RECOVERY_KEY);
    sessionStorage.removeItem(REFRESH_RECOVERY_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as { createdAt?: number; csv?: string };
    if (!value.csv || !value.createdAt || Date.now() - value.createdAt > 24 * 60 * 60 * 1000) return null;
    return parseAppDataCsv(value.csv);
  } catch { return null; }
}

export function clearRefreshRecovery() {
  try { sessionStorage.removeItem(REFRESH_RECOVERY_KEY); } catch {}
}

export function persistAutoSaveCsv(csv: string) {
  try { localStorage.setItem(LEGACY_AUTOSAVE_KEY, csv); } catch {}
}
