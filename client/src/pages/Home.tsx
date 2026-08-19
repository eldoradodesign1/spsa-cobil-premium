/** SPSA COBIL — Nebula : cockpit de pilotage IT, verre cosmique et décisions contextualisées. */
import { ChangeEvent, ComponentType, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowRight, Bell, Building2, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleAlert, Download, FileDown, FileSpreadsheet, FileText, LayoutDashboard, ListFilter, Menu, MonitorCog,
  Moon, MoreHorizontal, Orbit, PanelLeftClose, PenLine, Plus, ReceiptText, RotateCcw, Search, Settings2,
  ShieldCheck, Siren, Sparkles, Sun, Trash2, Upload, X,
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { DoubleRangeSlider } from "@/components/DoubleRangeSlider";
import { ExportPreview } from "@/components/ExportPreview";
import { NebulaDatePicker, NebulaNumberInput, NebulaSelect } from "@/components/NebulaFieldControls";
import {
  AppData, EMPTY_REPORT, FieldDefinition, Filters, MODULE_BY_KEY, MODULES, ModuleKey, RecordItem, REPORT_SECTIONS,
  emptyData, formatDate, formatMoney, getDateBounds, getMetrics, getRecordDate, getResponsible, getSite,
  getWeeklyTrend, importWorkbook, matchesFilters, priorityTone, statusTone,
} from "@/lib/business";
import { exportPdf, exportXlsx, reportDateLabel } from "@/lib/exports";

type View = "dashboard" | "report" | "settings" | ModuleKey;
type ToastState = { message: string; kind: "success" | "info" | "error" } | null;
type RecordDialog = { module: ModuleKey; index: number | null; values: RecordItem } | null;
type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };

const moduleIcons: Record<ModuleKey, Icon> = { suivi: Activity, incidents: Siren, projets: Orbit, fournisseurs: Building2, equipements: MonitorCog, achats: ReceiptText };
const menuGroups: { label: string; items: { id: View; label: string; icon: Icon; shortcut: string }[] }[] = [
  { label: "Pilotage", items: [{ id: "dashboard", label: "Vue de direction", icon: LayoutDashboard, shortcut: "1" }, { id: "report", label: "Rapport hebdomadaire", icon: FileText, shortcut: "2" }] },
  { label: "Opérations", items: [{ id: "suivi", label: "Suivi permanent", icon: Activity, shortcut: "3" }, { id: "incidents", label: "Incidents", icon: Siren, shortcut: "4" }, { id: "projets", label: "Projets", icon: Orbit, shortcut: "5" }] },
  { label: "Ressources", items: [{ id: "fournisseurs", label: "Fournisseurs", icon: Building2, shortcut: "6" }, { id: "equipements", label: "Équipements", icon: MonitorCog, shortcut: "7" }, { id: "achats", label: "Achats IT", icon: ReceiptText, shortcut: "8" }] },
];
const defaultFilters: Filters = { from: "", to: "", responsible: "", site: "" };
const isModule = (view: View): view is ModuleKey => MODULES.some((module) => module.key === view);
const shortcutViews: Record<string, View> = { "1": "dashboard", "2": "report", "3": "suivi", "4": "incidents", "5": "projets", "6": "fournisseurs", "7": "equipements", "8": "achats", "9": "settings" };
const purchaseEquipmentFields: FieldDefinition[] = [
  { key: "Asset ID", label: "Asset ID", type: "text", required: true, placeholder: "Ex. IT-2026-001" },
  { key: "Marque / Modèle", label: "Marque / Modèle", type: "text", placeholder: "Ex. Lenovo ThinkPad E14" },
  { key: "N° Série", label: "N° Série", type: "text" },
  { key: "Site", label: "Site", type: "text", required: true, placeholder: "Ex. Kinshasa" },
  { key: "Localisation", label: "Localisation", type: "text", placeholder: "Ex. Direction · Bureau 04" },
  { key: "Responsable équipement", label: "Responsable de l’équipement", type: "text" },
  { key: "État équipement", label: "État initial", type: "select", options: ["En service", "En stock", "À réparer", "Réformé"] },
  { key: "Garantie", label: "Garantie", type: "text", placeholder: "Ex. Jusqu’au 31/12/2028" },
];
const purchaseEquipmentKeys = ["Ajouter à l’inventaire", ...purchaseEquipmentFields.map((field) => field.key)];

function getSavedData() {
  try { const value = window.localStorage.getItem("spsa-cobil-data-v2"); return value ? JSON.parse(value) as AppData : emptyData(); } catch { return emptyData(); }
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [data, setData] = useState<AppData>(getSavedData);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [theme, setTheme] = useState<"light" | "dark">(() => (window.localStorage.getItem("spsa-cobil-theme") as "light" | "dark") || "dark");
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [periodDockOutOfView, setPeriodDockOutOfView] = useState(false);
  const [exportKind, setExportKind] = useState<"dashboard" | "report" | null>(null);
  const [recordDialog, setRecordDialog] = useState<RecordDialog>(null);
  const [reportEditing, setReportEditing] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [importing, setImporting] = useState(false);
  const [themeTransition, setThemeTransition] = useState<"light" | "dark" | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const filterDockRef = useRef<HTMLElement>(null);
  const bounds = useMemo(() => getDateBounds(data), [data]);
  const metrics = useMemo(() => getMetrics(data, filters), [data, filters]);
  const trend = useMemo(() => getWeeklyTrend(data, filters), [data, filters]);
  const allRecords = useMemo(() => MODULES.flatMap((module) => data.modules[module.key].map((record, index) => ({ module, record, index }))), [data]);
  const activeFilterCount = [filters.responsible, filters.site, filters.from && filters.from !== bounds.min ? filters.from : "", filters.to && filters.to !== bounds.max ? filters.to : ""].filter(Boolean).length;
  const responsibles = useMemo(() => Array.from(new Set(allRecords.map(({ record }) => getResponsible(record)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr")), [allRecords]);
  const sites = useMemo(() => Array.from(new Set(allRecords.map(({ record }) => getSite(record)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr")), [allRecords]);
  const searchResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase(); if (!term) return [];
    return allRecords.filter(({ record }) => Object.values(record).some((value) => value.toLocaleLowerCase().includes(term))).slice(0, 7);
  }, [allRecords, query]);

  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem("spsa-cobil-theme", theme); }, [theme]);
  useEffect(() => { window.localStorage.setItem("spsa-cobil-data-v2", JSON.stringify(data)); }, [data]);
  useEffect(() => { setFilters((current) => ({ ...current, from: current.from || bounds.min, to: current.to || bounds.max })); }, [bounds.min, bounds.max]);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 140); window.addEventListener("scroll", onScroll, { passive: true }); onScroll(); return () => window.removeEventListener("scroll", onScroll); }, []);
  useEffect(() => {
    if (view !== "dashboard") { setPeriodDockOutOfView(true); return; }
    const target = filterDockRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setPeriodDockOutOfView(!entry.isIntersecting), { threshold: 0, rootMargin: "-84px 0px 0px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [view]);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(timeout); }, [toast]);
  useEffect(() => { const onBeforeInstallPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); }; window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt); return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt); }, []);

  const notify = (message: string, kind: "success" | "info" | "error" = "success") => setToast({ message, kind });
  const navigate = (next: View) => { setView(next); if (next !== "dashboard" && next !== "report") setExportKind(null); setSidebarOpen(false); setShowSearch(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const resetFilters = () => { setFilters({ ...defaultFilters, from: bounds.min, to: bounds.max }); notify("Périmètre réinitialisé", "info"); };
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!/\.xlsx?$/i.test(file.name)) { notify("Sélectionnez un fichier Excel (.xlsx ou .xls).", "error"); return; }
    setImporting(true);
    try { const imported = await importWorkbook(file); setData(imported); setView("dashboard"); notify(`Classeur importé : ${file.name}`); }
    catch { notify("Le classeur n’a pas pu être interprété.", "error"); }
    finally { setImporting(false); event.target.value = ""; }
  };
  const saveRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!recordDialog) return;
    const definition = MODULE_BY_KEY[recordDialog.module];
    const invalid = definition.fields.find((field) => field.required && !recordDialog.values[field.key]?.trim());
    if (invalid) { notify(`Le champ « ${invalid.label} » est requis.`, "error"); return; }
    const shouldCreateEquipment = recordDialog.module === "achats" && recordDialog.values["Ajouter à l’inventaire"] === "Oui";
    const missingEquipment = shouldCreateEquipment && purchaseEquipmentFields.find((field) => field.required && !recordDialog.values[field.key]?.trim());
    if (missingEquipment) { notify(`Le champ équipement « ${missingEquipment.label} » est requis.`, "error"); return; }
    const savedValues = { ...recordDialog.values };
    if (recordDialog.module === "achats") purchaseEquipmentKeys.forEach((key) => delete savedValues[key]);
    const equipmentRecord: RecordItem | null = shouldCreateEquipment ? {
      "Asset ID": recordDialog.values["Asset ID"],
      "Équipement": recordDialog.values["Équipement / Service"] || "Équipement acheté",
      "Marque / Modèle": recordDialog.values["Marque / Modèle"] || "",
      "N° Série": recordDialog.values["N° Série"] || "",
      Site: recordDialog.values.Site || "",
      Localisation: recordDialog.values.Localisation || "",
      Responsable: recordDialog.values["Responsable équipement"] || recordDialog.values.Demandeur || "",
      "IP / MAC": "",
      État: recordDialog.values["État équipement"] || "En stock",
      "Date acquisition": recordDialog.values.Date || "",
      Garantie: recordDialog.values.Garantie || "",
      Commentaires: `Créé depuis l’achat IT · ${recordDialog.values.Justification || "Sans justification renseignée"}`,
    } : null;
    setData((current) => {
      const records = [...current.modules[recordDialog.module]];
      if (recordDialog.index === null) records.unshift(savedValues); else records[recordDialog.index] = savedValues;
      return { ...current, modules: { ...current.modules, [recordDialog.module]: records, ...(equipmentRecord ? { equipements: [equipmentRecord, ...current.modules.equipements] } : {}) }, updatedAt: new Date().toISOString() };
    });
    setRecordDialog(null); notify(equipmentRecord ? "Achat enregistré et équipement ajouté au parc" : "Entrée enregistrée");
  };
  const deleteRecord = (module: ModuleKey, index: number) => {
    if (!window.confirm("Supprimer cette entrée ? La suppression sera reflétée dans les prochains exports.")) return;
    setData((current) => ({ ...current, modules: { ...current.modules, [module]: current.modules[module].filter((_, itemIndex) => itemIndex !== index) }, updatedAt: new Date().toISOString() })); notify("Entrée supprimée", "info");
  };
  const saveReport = (report: AppData["report"]) => { setData((current) => ({ ...current, report, updatedAt: new Date().toISOString() })); setReportEditing(false); notify("Rapport enregistré"); };
  const activeExportKind: "dashboard" | "report" = view === "report" ? "report" : "dashboard";
  const isTopbarPeriodVisible = view !== "dashboard" || periodDockOutOfView;
  const startExport = (kind: "dashboard" | "report" = activeExportKind) => setExportKind(kind);
  const downloadPdf = async () => { if (!previewRef.current || !exportKind) return; try { await exportPdf(previewRef.current, exportKind); notify("PDF préparé et téléchargé"); } catch { notify("La génération du PDF a rencontré un problème.", "error"); } };
  const switchTheme = (next: "light" | "dark") => {
    if (next === theme) return;
    setThemeTransition(next);
    window.requestAnimationFrame(() => setTheme(next));
    window.setTimeout(() => setThemeTransition(null), 780);
  };
  const toggleTheme = () => switchTheme(theme === "dark" ? "light" : "dark");
  const requestInstall = async () => { if (!installPrompt) { notify("Utilisez le menu du navigateur pour installer l’application lorsque l’option est disponible.", "info"); return; } await installPrompt.prompt(); const result = await installPrompt.userChoice; setInstallPrompt(null); notify(result.outcome === "accepted" ? "Installation demandée au navigateur" : "Installation annulée", result.outcome === "accepted" ? "success" : "info"); };

  useEffect(() => { if (exportKind && (view === "dashboard" || view === "report")) setExportKind(activeExportKind); }, [activeExportKind, exportKind, view]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = Boolean(target?.closest("input, textarea, select, [contenteditable='true']"));
      if (event.key === "Escape") {
        if (showSearch) { event.preventDefault(); setShowSearch(false); return; }
        if (exportKind) { event.preventDefault(); setExportKind(null); return; }
        if (recordDialog) { event.preventDefault(); setRecordDialog(null); return; }
        if (sidebarOpen) { event.preventDefault(); setSidebarOpen(false); }
        return;
      }
      if (isEditing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "/") { event.preventDefault(); setShowSearch(true); return; }
      if (event.key.toLowerCase() === "t") { event.preventDefault(); toggleTheme(); return; }
      if (event.key.toLowerCase() === "e") { event.preventDefault(); startExport(view === "report" ? "report" : "dashboard"); return; }
      if (event.key.toLowerCase() === "b") { event.preventDefault(); setCollapsed((value) => !value); return; }
      const next = shortcutViews[event.key];
      if (next) { event.preventDefault(); navigate(next); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exportKind, recordDialog, showSearch, sidebarOpen, theme, view]);

  return <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""} ${sidebarOpen ? "app-shell--menu-open" : ""}`}>
    <div className="lavalamp" aria-hidden="true"><span className="lava-blob lava-blob--one" /><span className="lava-blob lava-blob--two" /><span className="lava-blob lava-blob--three" /><span className="lava-blob lava-blob--four" /></div>
    <AnimatePresence>{themeTransition && <motion.div aria-hidden="true" className={`theme-cosmos-transition theme-cosmos-transition--${themeTransition}`} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.08 }} transition={{ duration: 0.56, ease: [0.23, 1, 0.32, 1] }} />}</AnimatePresence>
    <aside className="sidebar"><div className="sidebar__brand"><AppLogo compact={collapsed} /><button className="icon-button sidebar__collapse" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Déployer la navigation" : "Réduire la navigation"}>{collapsed ? <ChevronRight size={17} /> : <PanelLeftClose size={17} />}</button></div>
      <nav className="sidebar__nav" aria-label="Navigation principale">{menuGroups.map((group) => <section key={group.label}><p>{group.label}</p>{group.items.map((item) => <button key={item.id} className={view === item.id ? "nav-item is-active" : "nav-item"} onClick={() => navigate(item.id)} aria-keyshortcuts={item.shortcut} title={collapsed ? `${item.label} · raccourci ${item.shortcut}` : undefined}><item.icon size={18} strokeWidth={1.7} /><span>{item.label}</span><kbd className="sidebar__shortcut">{item.shortcut}</kbd>{view === item.id && <i />}</button>)}</section>)}</nav>
      <div className="sidebar__bottom"><div className="sidebar__status"><span /><div><b>Mode local</b><small>{data.sourceName.includes("espace") ? "Classeur à importer" : "Classeur en mémoire"}</small></div></div><button className={view === "settings" ? "nav-item is-active" : "nav-item"} onClick={() => navigate("settings")} aria-keyshortcuts="9" title={collapsed ? "Préférences · raccourci 9" : undefined}><Settings2 size={18} strokeWidth={1.7} /><span>Préférences</span><kbd className="sidebar__shortcut">9</kbd></button><div className="sidebar__quick-hints"><span><kbd>/</kbd> Rechercher</span><span><kbd>T</kbd> Thème</span><span><kbd>E</kbd> Export</span><span><kbd>B</kbd> Barre</span></div></div>
    </aside>
    <div className="mobile-nav-scrim" onClick={() => setSidebarOpen(false)} />
    <main className="workspace">
      <header className={`topbar ${scrolled ? "topbar--scrolled" : ""}`}><div className="topbar__left"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir la navigation"><Menu size={20} /></button><div className="topbar__context"><span>{view === "dashboard" ? "Cockpit de pilotage" : view === "report" ? "Rituel de direction" : view === "settings" ? "Préférences" : MODULE_BY_KEY[view].eyebrow}</span><b>{view === "dashboard" ? "Vue de direction" : view === "report" ? "Rapport hebdomadaire" : view === "settings" ? "Environnement" : MODULE_BY_KEY[view].label}</b></div></div>
        <div className={`topbar__period ${isTopbarPeriodVisible ? "is-visible" : ""}`}><DoubleRangeSlider min={bounds.min} max={bounds.max} ticks={bounds.ticks} from={filters.from} to={filters.to} compact onChange={(from, to) => setFilters((current) => ({ ...current, from, to }))} /></div>
        <div className="topbar__actions"><button className="topbar-action" onClick={() => setShowSearch(true)} aria-label="Rechercher"><Search size={17} /><span>Rechercher</span><kbd>/</kbd></button><button className="icon-button" onClick={toggleTheme} aria-label="Basculer le thème" title="Raccourci T">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><button className="icon-button notification-button" aria-label="Notifications"><Bell size={17} /><i /></button><button className="primary-button primary-button--top" onClick={() => startExport(view === "report" ? "report" : "dashboard")} title="Raccourci E"><Download size={16} /><span>Exporter</span></button></div>
      </header>
      <div className={`mobile-period-strip ${isTopbarPeriodVisible ? "is-visible" : ""}`} aria-label="Période active"><DoubleRangeSlider min={bounds.min} max={bounds.max} ticks={bounds.ticks} from={filters.from} to={filters.to} compact onChange={(from, to) => setFilters((current) => ({ ...current, from, to }))} /></div>

      <div className="page-content">
        <AnimatePresence mode="wait">{view === "dashboard" ? <Dashboard key="dashboard" filterDockRef={filterDockRef} data={data} metrics={metrics} trend={trend} filters={filters} bounds={bounds} activeFilterCount={activeFilterCount} onFilterChange={setFilters} onReset={resetFilters} onImport={() => inputRef.current?.click()} onNavigate={navigate} onExport={() => startExport("dashboard")} />
          : view === "report" ? <WeeklyReport key="report" data={data} metrics={metrics} editing={reportEditing} onEdit={() => setReportEditing(true)} onCancel={() => setReportEditing(false)} onSave={saveReport} onExport={() => startExport("report")} />
          : view === "settings" ? <SettingsPage key="settings" theme={theme} data={data} canInstall={Boolean(installPrompt)} onInstall={() => { void requestInstall(); }} onTheme={switchTheme} onClear={() => { if (window.confirm("Réinitialiser les données locales de travail ?")) { setData(emptyData()); setFilters(defaultFilters); notify("Espace de travail réinitialisé", "info"); } }} />
          : <ModulePage key={view} module={MODULE_BY_KEY[view]} records={data.modules[view].map((record, index) => ({ record, index })).filter(({ record }) => matchesFilters(record, filters))} onCreate={() => setRecordDialog({ module: view, index: null, values: {} })} onEdit={(index, record) => setRecordDialog({ module: view, index, values: { ...record } })} onDelete={(index) => deleteRecord(view, index)} />}</AnimatePresence>
      </div>
    </main>
    <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} hidden />
    {importing && <div className="import-curtain"><div><Sparkles size={20} /><b>Lecture du classeur</b><span>Les feuilles et champs sont en cours d’interprétation.</span></div></div>}
    <AnimatePresence>{toast && <motion.div className={`toast toast--${toast.kind}`} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}><Check size={16} /><span>{toast.message}</span></motion.div>}</AnimatePresence>
    <AnimatePresence>{showSearch && <SearchOverlay query={query} setQuery={setQuery} results={searchResults} onClose={() => setShowSearch(false)} onOpen={(module) => navigate(module)} />}</AnimatePresence>
    <AnimatePresence>{exportKind && <ExportDialog kind={exportKind} data={data} filters={filters} bounds={bounds} previewRef={previewRef} onClose={() => setExportKind(null)} onKindChange={(kind) => { setExportKind(kind); navigate(kind); }} onFilterChange={setFilters} onPdf={downloadPdf} onXlsx={() => { void exportXlsx(data, filters).then(() => notify("Classeur XLSX téléchargé")).catch(() => notify("La génération du classeur a rencontré un problème.", "error")); }} />}</AnimatePresence>
    <AnimatePresence>{recordDialog && <RecordEditor dialog={recordDialog} onClose={() => setRecordDialog(null)} onChange={(values) => setRecordDialog((current) => current ? { ...current, values } : current)} onSubmit={saveRecord} />}</AnimatePresence>
  </div>;
}

function Dashboard({ filterDockRef, data, metrics, trend, filters, bounds, activeFilterCount, onFilterChange, onReset, onImport, onNavigate, onExport }: { filterDockRef: React.RefObject<HTMLElement | null>; data: AppData; metrics: ReturnType<typeof getMetrics>; trend: ReturnType<typeof getWeeklyTrend>; filters: Filters; bounds: ReturnType<typeof getDateBounds>; activeFilterCount: number; onFilterChange: (value: Filters) => void; onReset: () => void; onImport: () => void; onNavigate: (value: View) => void; onExport: () => void }) {
  const cards = [
    { label: "Activités terminées", value: metrics.activitiesDone, meta: `${metrics.activitiesInProgress} en cours`, icon: Check, tone: "teal" },
    { label: "Incidents ouverts", value: metrics.incidentsOpen, meta: `${metrics.incidentsResolved} résolu(s)`, icon: CircleAlert, tone: "coral" },
    { label: "Projets en cours", value: metrics.projectsInProgress, meta: metrics.projectsLate ? `${metrics.projectsLate} à sécuriser` : "Aucun retard détecté", icon: Orbit, tone: "violet" },
    { label: "Achats en attente", value: metrics.purchasesWaiting, meta: `${metrics.vendorsToFollow} relance(s) fournisseur`, icon: ReceiptText, tone: "amber" },
  ];
  return <motion.div className="view-stack" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}>
    <section className="dashboard-hero"><div className="dashboard-hero__copy"><p className="eyebrow"><Sparkles size={14} /> Pilotage IT · SPSA COBIL</p><h1>Les signaux qui <em>méritent</em> votre attention.</h1><p className="hero-lede">Un espace de lecture précis pour transformer la matière opérationnelle en décisions situées dans le temps.</p><div className="hero-actions"><button className="primary-button" onClick={onImport}><Upload size={17} />Importer un classeur</button><button className="text-button" onClick={onExport}>Préparer la synthèse <ArrowRight size={16} /></button></div></div><div className="dashboard-hero__lens"><img src="/manus-storage/spsa-cobil-export-seal_6dc79461.jpg" alt="" /><div className="lens-caption"><span>ESPACE ACTIF</span><b>{metrics.totalRecords ? `${metrics.totalRecords} signal${metrics.totalRecords > 1 ? "aux" : ""} analysé${metrics.totalRecords > 1 ? "s" : ""}` : "Prêt à recevoir vos données"}</b></div></div></section>
    <section ref={filterDockRef} className="filter-dock glass-panel"><div className="filter-dock__heading"><div><p className="eyebrow"><CalendarDays size={14} /> Périmètre de lecture</p><h2>Temporalité active</h2></div>{activeFilterCount > 0 && <button className="soft-button" onClick={onReset}><RotateCcw size={14} />Réinitialiser <span>{activeFilterCount}</span></button>}</div><DoubleRangeSlider min={bounds.min} max={bounds.max} ticks={bounds.ticks} from={filters.from} to={filters.to} onChange={(from, to) => onFilterChange({ ...filters, from, to })} /><div className="filter-selects"><FilterSelect label="Responsable" value={filters.responsible} options={Array.from(new Set(MODULES.flatMap((module) => data.modules[module.key].map(getResponsible)).filter(Boolean))).sort()} onChange={(responsible) => onFilterChange({ ...filters, responsible })} /><FilterSelect label="Site" value={filters.site} options={Array.from(new Set(data.modules.equipements.map(getSite).filter(Boolean))).sort()} onChange={(site) => onFilterChange({ ...filters, site })} /><button className="filter-more" onClick={() => onNavigate("settings")}><ListFilter size={15} />Préréglages</button></div></section>
    <section className="kpi-grid">{cards.map((card, index) => <motion.article className={`kpi-card kpi-card--${card.tone}`} key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.05, duration: 0.32 }}><div className="kpi-card__top"><span>{card.label}</span><i><card.icon size={17} /></i></div><AnimatedNumber value={card.value} /><p>{card.meta}</p><div className="kpi-card__glow" /></motion.article>)}</section>
    <section className="dashboard-grid"><article className="glass-panel trend-panel"><div className="panel-heading"><div><p className="eyebrow">Rythme opérationnel</p><h2>Signal hebdomadaire</h2></div><span className="panel-context">{trend.length ? `${trend.length} semaines` : "À alimenter"}</span></div>{trend.length ? <div className="trend-chart">{trend.map((point) => <div className="trend-bar" key={point.key}><div className="trend-bar__area"><i style={{ height: `${Math.max(7, point.activities * 17)}%` }} title={`${point.activities} activité(s)`} /><b style={{ height: `${Math.max(6, point.incidents * 17)}%` }} title={`${point.incidents} incident(s)`} /></div><span>{point.label}</span></div>)}</div> : <EmptyState title="Le rythme apparaîtra ici" text="Importez ou saisissez des activités et incidents datés pour construire la lecture hebdomadaire." action="Importer le classeur" onAction={onImport} />}</article>
      <article className="glass-panel attention-panel"><div className="panel-heading"><div><p className="eyebrow">À surveiller</p><h2>Échéances proches</h2></div><button className="icon-button"><MoreHorizontal size={18} /></button></div>{metrics.alerts.length ? <div className="attention-list">{metrics.alerts.map((alert) => <div className="attention-item" key={`${alert.module}-${alert.label}`}><i className={`status-dot status-dot--${alert.tone}`} /><div><b>{alert.label}</b><span>{alert.module} · {formatDate(alert.date)}</span></div><ChevronRight size={16} /></div>)}</div> : <EmptyState title="Aucune échéance signalée" text="Les activités et projets avec une échéance remonteront automatiquement ici." />}</article>
    </section>
    <section className="dashboard-grid dashboard-grid--lower"><article className="glass-panel modules-panel"><div className="panel-heading"><div><p className="eyebrow">Matière de travail</p><h2>Registres actifs</h2></div><span className="panel-context">{metrics.totalRecords} entrées</span></div><div className="module-list">{MODULES.map((module) => { const IconComponent = moduleIcons[module.key]; const amount = data.modules[module.key].filter((record) => matchesFilters(record, filters)).length; return <button key={module.key} onClick={() => onNavigate(module.key)}><span className="module-list__icon"><IconComponent size={17} /></span><span className="module-list__copy"><b>{module.label}</b><small>{module.eyebrow}</small></span><strong>{amount}</strong><ChevronRight size={16} /></button>; })}</div></article>
      <article className="export-cta"><img src="/manus-storage/spsa-cobil-aurora-dark_3795a5fa.jpg" alt="" /><div><p className="eyebrow">Document de direction</p><h2>Préparer une lecture qui porte la décision.</h2><p>Une prévisualisation HTML éditoriale, un PDF structuré et un classeur Excel prêt à continuer sa vie opérationnelle.</p><button className="light-button" onClick={onExport}><FileDown size={16} />Choisir le format</button></div></article></section>
  </motion.div>;
}

function WeeklyReport({ data, metrics, editing, onEdit, onCancel, onSave, onExport }: { data: AppData; metrics: ReturnType<typeof getMetrics>; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (report: AppData["report"]) => void; onExport: () => void }) {
  const [draft, setDraft] = useState(data.report);
  useEffect(() => setDraft(data.report), [data.report]);
  const stats = [{ label: "Réalisations", value: metrics.activitiesDone }, { label: "En cours", value: metrics.activitiesInProgress }, { label: "En attente", value: metrics.actionsWaiting }, { label: "Incidents résolus", value: metrics.incidentsResolved }];
  return <motion.div className="view-stack report-view" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><section className="report-hero"><div><p className="eyebrow"><FileText size={14} /> Rituel de direction</p><h1>Rapport <em>hebdomadaire.</em></h1><p>Une synthèse narrative pensée pour expliquer l’impact, cadrer les risques et obtenir les arbitrages nécessaires.</p></div><div className="report-hero__actions">{editing ? <><button className="soft-button" onClick={onCancel}>Annuler</button><button className="primary-button" onClick={() => onSave(draft)} title="Ctrl/⌘ + Entrée"><Check size={16} />Enregistrer</button></> : <><button className="soft-button" onClick={onExport}><Download size={15} />Exporter</button><button className="primary-button" onClick={onEdit}><PenLine size={16} />Modifier le rapport</button></>}</div></section><section className="report-stat-row">{stats.map((stat) => <div className="report-stat" key={stat.label}><AnimatedNumber value={stat.value} /><span>{stat.label}</span></div>)}</section><article className={`report-surface ${editing ? "report-surface--editing" : ""}`} onKeyDown={(event) => { if (editing && (event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); onSave(draft); } }}><header><div><span>IT Operations · SPSA COBIL</span><h2>Semaine du {reportDateLabel(data)}</h2></div><div className="report-surface__mark"><AppLogo compact /></div></header>{editing && <div className="report-dates"><label>Début<NebulaDatePicker value={draft.startDate} onChange={(startDate) => setDraft({ ...draft, startDate })} placeholder="Début du rapport" required /></label><label>Fin<NebulaDatePicker value={draft.endDate} onChange={(endDate) => setDraft({ ...draft, endDate })} placeholder="Fin du rapport" required /></label></div>}<div className="report-sections">{REPORT_SECTIONS.map((section, index) => <section key={section.key}><div className="report-sections__number">{String(index + 1).padStart(2, "0")}</div><div><h3>{section.label}</h3>{editing ? <textarea value={draft[section.key]} placeholder={section.helper} onChange={(event) => setDraft({ ...draft, [section.key]: event.target.value })} /> : <p>{data.report[section.key] || section.helper}</p>}</div></section>)}</div><footer>Document préparé depuis le cockpit SPSA COBIL · Usage de pilotage interne</footer></article></motion.div>;
}

function ModulePage({ module, records, onCreate, onEdit, onDelete }: { module: typeof MODULES[number]; records: { record: RecordItem; index: number }[]; onCreate: () => void; onEdit: (index: number, record: RecordItem) => void; onDelete: (index: number) => void }) {
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all");
  const filtered = records.filter(({ record }) => (!search || Object.values(record).some((value) => value.toLocaleLowerCase().includes(search.toLocaleLowerCase()))) && (status === "all" || Object.values(record).includes(status)));
  const statuses = Array.from(new Set(records.map(({ record }) => record.Statut || record.État).filter(Boolean)));
  const IconComponent = moduleIcons[module.key];
  return <motion.div className="view-stack module-view" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><section className="module-hero"><div className="module-hero__icon"><IconComponent size={24} /></div><div><p className="eyebrow">{module.eyebrow}</p><h1>{module.label}</h1><p>{module.description}</p></div><button className="primary-button" onClick={onCreate}><Plus size={17} />Nouvelle entrée</button></section><section className="table-shell glass-panel"><div className="table-toolbar"><div className="table-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher dans ce registre" /></div><NebulaSelect value={status === "all" ? "" : status} onChange={(value) => setStatus(value || "all")} options={statuses} emptyLabel="Tous les statuts" className="table-status-select" /><span>{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span></div>{filtered.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr>{module.headers.filter((header) => header !== "ID").slice(0, 6).map((header) => <th key={header}>{header}</th>)}<th aria-label="Actions" /></tr></thead><tbody>{filtered.map(({ record, index }) => <tr key={`${module.key}-${index}`}><td className="table-primary">{record[module.primaryField] || "Sans libellé"}</td>{module.headers.filter((header) => header !== "ID" && header !== module.primaryField).slice(0, 5).map((header) => <td key={header}>{header === "Statut" || header === "État" ? <span className={`status-pill status-pill--${statusTone(record[header])}`}>{record[header] || "—"}</span> : header === "Priorité" ? <span className={`priority-pill priority-pill--${priorityTone(record[header])}`}>{record[header] || "Normale"}</span> : record[header] || "—"}</td>)}<td><div className="row-actions"><button onClick={() => onEdit(index, record)} aria-label="Modifier"><PenLine size={15} /></button><button onClick={() => onDelete(index)} aria-label="Supprimer"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="Aucune entrée dans ce périmètre" text="Créez une première entrée ou ajustez votre recherche et vos filtres globaux." action="Nouvelle entrée" onAction={onCreate} />}</section></motion.div>;
}

function SettingsPage({ theme, data, canInstall, onInstall, onTheme, onClear }: { theme: "light" | "dark"; data: AppData; canInstall: boolean; onInstall: () => void; onTheme: (theme: "light" | "dark") => void; onClear: () => void }) {
  return <motion.div className="view-stack settings-view" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><section className="settings-hero"><p className="eyebrow"><Settings2 size={14} /> Environnement</p><h1>Préférences du <em>cockpit.</em></h1><p>Les réglages d’apparence et le dernier espace de travail sont stockés dans ce navigateur.</p></section><div className="settings-grid"><article className="glass-panel setting-card"><div><p className="eyebrow">Apparence</p><h2>Thème de lecture</h2><p>Deux interprétations conçues pour préserver les contrastes et le confort de travail.</p></div><div className="theme-choice"><button className={theme === "dark" ? "is-selected" : ""} onClick={() => onTheme("dark")}><Moon size={17} /><span><b>Nocturne</b><small>Encre boréale</small></span><i /></button><button className={theme === "light" ? "is-selected" : ""} onClick={() => onTheme("light")}><Sun size={17} /><span><b>Opalin</b><small>Blanc minéral</small></span><i /></button></div></article><article className="glass-panel setting-card"><div><p className="eyebrow">Espace local</p><h2>{data.sourceName}</h2><p>{data.updatedAt ? `Dernière mise à jour · ${formatDate(data.updatedAt)}` : "Aucune donnée importée ou saisie."}</p></div><button className="danger-button" onClick={onClear}><Trash2 size={16} />Réinitialiser les données locales</button></article><article className="glass-panel setting-card setting-card--pwa"><div><p className="eyebrow">Application installable</p><h2>Prête pour un usage récurrent.</h2><p>{canInstall ? "Le navigateur est prêt : installez le cockpit pour le retrouver comme une application autonome." : "Depuis le navigateur, utilisez l’action d’installation lorsqu’elle est proposée. Les données restent attachées à cet appareil."}</p><button className="primary-button pwa-install-button" onClick={onInstall}><Download size={16} />{canInstall ? "Installer l’application" : "Voir les options d’installation"}</button></div><ShieldCheck size={34} /></article></div></motion.div>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="filter-select"><span>{label}</span><NebulaSelect value={value} onChange={onChange} options={options} emptyLabel="Tous" /></label>; }
function EmptyState({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) { return <div className="empty-state"><span><Sparkles size={19} /></span><div><b>{title}</b><p>{text}</p>{action && onAction && <button className="text-button" onClick={onAction}>{action}<ArrowRight size={15} /></button>}</div></div>; }

function SearchOverlay({ query, setQuery, results, onClose, onOpen }: { query: string; setQuery: (value: string) => void; results: { module: typeof MODULES[number]; record: RecordItem; index: number }[]; onClose: () => void; onOpen: (module: ModuleKey) => void }) { return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.section className="search-dialog" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}><div className="search-dialog__input"><Search size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une activité, un incident, un projet…" /><button onClick={onClose}><X size={18} /></button></div><div className="search-dialog__results">{query ? results.length ? results.map(({ module, record, index }) => <button key={`${module.key}-${index}`} onClick={() => onOpen(module.key)}><span>{module.label}</span><b>{record[module.primaryField] || "Ligne correspondante"}</b><small>{record.Statut || record.Priorité || record.Date || "Ouvrir le registre"}</small><ChevronRight size={16} /></button>) : <p>Aucun résultat correspondant.</p> : <p>Saisissez au moins deux caractères pour explorer tous les registres.</p>}</div></motion.section></motion.div>; }

function ExportDialog({ kind, data, filters, bounds, previewRef, onClose, onKindChange, onFilterChange, onPdf, onXlsx }: { kind: "dashboard" | "report"; data: AppData; filters: Filters; bounds: ReturnType<typeof getDateBounds>; previewRef: React.RefObject<HTMLElement | null>; onClose: () => void; onKindChange: (kind: "dashboard" | "report") => void; onFilterChange: (filters: Filters) => void; onPdf: () => void; onXlsx: () => void }) { return <motion.div className="modal-backdrop export-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.section className="export-dialog" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}><header><div><p className="eyebrow"><FileDown size={14} /> Centre d’export</p><h2>Prévisualiser avant de diffuser.</h2><p>Le document conserve le contexte de période et adopte la charte du cockpit.</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></header><div className="export-dialog__controls"><div className="export-kind-switch" role="tablist" aria-label="Vue à exporter"><button role="tab" aria-selected={kind === "dashboard"} className={kind === "dashboard" ? "is-selected" : ""} onClick={() => onKindChange("dashboard")}>Vue direction</button><button role="tab" aria-selected={kind === "report"} className={kind === "report" ? "is-selected" : ""} onClick={() => onKindChange("report")}>Rapport hebdo</button></div><div className="export-dialog__period"><span><CalendarDays size={13} />Période active</span><DoubleRangeSlider min={bounds.min} max={bounds.max} ticks={bounds.ticks} from={filters.from} to={filters.to} compact onChange={(from, to) => onFilterChange({ ...filters, from, to })} /></div></div><div className="export-dialog__preview"><ExportPreview ref={previewRef} kind={kind} data={data} filters={filters} /></div><footer><button className="soft-button" onClick={onClose}>Annuler</button><button className="soft-button" onClick={onXlsx}><FileSpreadsheet size={16} />Classeur XLSX</button><button className="primary-button" onClick={onPdf}><Download size={16} />Télécharger le PDF</button></footer></motion.section></motion.div>; }

function RecordEditor({ dialog, onClose, onChange, onSubmit }: { dialog: NonNullable<RecordDialog>; onClose: () => void; onChange: (value: RecordItem) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { const module = MODULE_BY_KEY[dialog.module]; const createsEquipment = dialog.module === "achats" && dialog.values["Ajouter à l’inventaire"] === "Oui"; const fields = createsEquipment ? [...module.fields, ...purchaseEquipmentFields] : module.fields; return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.form className="record-dialog" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} onSubmit={onSubmit} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); event.currentTarget.requestSubmit(); } }}><header><div><p className="eyebrow">{module.eyebrow}</p><h2>{dialog.index === null ? "Nouvelle entrée" : "Modifier l’entrée"}</h2></div><button className="icon-button" type="button" onClick={onClose}><X size={18} /></button></header>{dialog.module === "achats" && <div className={`equipment-switcher ${createsEquipment ? "is-active" : ""}`}><div><span>Équipement à inventorier</span><small>Crée automatiquement l’actif associé dans le registre Équipements.</small></div><button type="button" role="switch" aria-checked={createsEquipment} onClick={() => onChange({ ...dialog.values, "Ajouter à l’inventaire": createsEquipment ? "Non" : "Oui" })}><i /></button></div>}<div className="record-dialog__fields">{fields.map((field) => <label className={field.type === "textarea" ? "field field--wide" : "field"} key={field.key}><span>{field.label}{field.required && <b>*</b>}</span>{field.type === "textarea" ? <textarea value={dialog.values[field.key] || ""} onChange={(event) => onChange({ ...dialog.values, [field.key]: event.target.value })} placeholder={field.placeholder} /> : field.type === "select" ? <NebulaSelect value={dialog.values[field.key] || ""} onChange={(value) => onChange({ ...dialog.values, [field.key]: value })} options={field.options || []} emptyLabel="Sélectionner" /> : field.type === "date" ? <NebulaDatePicker value={dialog.values[field.key] || ""} onChange={(value) => onChange({ ...dialog.values, [field.key]: value })} placeholder={field.placeholder || `Choisir ${field.label.toLowerCase()}`} required={field.required} /> : field.type === "number" ? <NebulaNumberInput value={dialog.values[field.key] || ""} onChange={(value) => onChange({ ...dialog.values, [field.key]: value })} placeholder={field.placeholder || "0"} /> : <input type="text" value={dialog.values[field.key] || ""} onChange={(event) => onChange({ ...dialog.values, [field.key]: event.target.value })} placeholder={field.placeholder} />}</label>)}</div><footer><span className="form-shortcut"><kbd>Ctrl</kbd><span>+</span><kbd>↵</kbd> Enregistrer</span><button type="button" className="soft-button" onClick={onClose}>Annuler</button><button type="submit" className="primary-button" title="Ctrl/⌘ + Entrée"><Check size={16} />Enregistrer</button></footer></motion.form></motion.div>; }

function AnimatedNumber({ value }: { value: number }) { const [display, setDisplay] = useState(value); const previous = useRef(value); useEffect(() => { const start = previous.current; const target = value; previous.current = target; if (start === target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplay(target); return; } const duration = 520; const startedAt = performance.now(); let frame = 0; const tick = (now: number) => { const progress = Math.min((now - startedAt) / duration, 1); const eased = 1 - Math.pow(1 - progress, 4); setDisplay(Math.round(start + (target - start) * eased)); if (progress < 1) frame = requestAnimationFrame(tick); }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame); }, [value]); return <motion.strong className="animated-number" initial={{ opacity: 0.55, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}>{display}</motion.strong>; }
