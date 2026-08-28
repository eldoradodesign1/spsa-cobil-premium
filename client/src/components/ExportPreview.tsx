import { forwardRef } from "react";
import { AppData, Filters, ModuleKey, MODULES, formatDate, getMetrics, getWeeklyTrend, matchesFilters } from "@/lib/business";
import { AppLogo } from "@/components/AppLogo";

type ExportPreviewProps = { kind: "dashboard" | "report"; data: AppData; filters: Filters };

export const ExportPreview = forwardRef<HTMLElement, ExportPreviewProps>(function ExportPreview({ kind, data, filters }, ref) {
  const metrics = getMetrics(data, filters); const trend = getWeeklyTrend(data, filters);
  const heading = kind === "dashboard" ? "Synthèse de pilotage IT" : "Rapport hebdomadaire";
  return <article className="export-document" ref={ref}>
    <div className="export-document__veil" /><div className="export-document__topline" />
    <header className="export-document__header"><div className="export-document__brand"><AppLogo /><span>SPSA COBIL · Pilotage IT</span></div><div className="export-document__meta"><span>Document de direction</span><time>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date())}</time></div></header>
    <section className="export-document__title"><p>IT Operations · SPSA COBIL</p><h2>{heading}</h2><span>Période active · {filters.from ? formatDate(filters.from) : "début libre"} — {filters.to ? formatDate(filters.to) : "fin libre"}</span></section>
    {kind === "dashboard" ? <>
      <div className="export-kpis"><div><b>{metrics.activitiesDone}</b><span>Activités terminées</span></div><div><b>{metrics.incidentsOpen}</b><span>Incidents ouverts</span></div><div><b>{metrics.projectsInProgress}</b><span>Projets en cours</span></div><div><b>{metrics.purchasesWaiting}</b><span>Achats en attente</span></div><div><b>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(metrics.totalPurchaseAmount)}</b><span>Montant des achats</span></div></div>
      <section className="export-document__section"><div className="export-section-head"><span>01</span><h3>Lecture de la période</h3></div><div className="export-trend">{trend.length ? trend.map((point) => <div key={point.key}><span style={{ height: `${Math.max(10, point.activities * 14)}px` }} /><small>{point.label}</small></div>) : <p>La tendance apparaîtra ici dès l’import des activités et incidents datés.</p>}</div></section>
      <section className="export-document__section"><div className="export-section-head"><span>02</span><h3>Échéances et points d’attention</h3></div>{metrics.alerts.length ? <div className="export-alerts">{metrics.alerts.map((alert) => <p key={`${alert.module}-${alert.label}`}><b>{alert.module}</b><span>{alert.label}</span><time>{formatDate(alert.date)}</time></p>)}</div> : <p className="export-empty">Aucune échéance renseignée pour la période active.</p>}</section>
    </> : <div className="export-report-sections">{[
      ["Réalisations majeures", data.report.realisations], ["Points de vigilance", data.report.vigilance], ["Actions à venir", data.report.actions], ["Décisions attendues", data.report.decisions], ["Besoins & ressources", data.report.ressources], ["Notes de contexte", data.report.commentaires],
    ].map(([label, text], index) => <section className="export-document__section" key={label}><div className="export-section-head"><span>{String(index + 1).padStart(2, "0")}</span><h3>{label}</h3></div><p>{text || "Aucune information renseignée pour cette section."}</p></section>)}</div>}
    <footer className="export-document__footer"><span>Confidentiel · Usage de pilotage interne</span><span>Préparé depuis SPSA COBIL</span></footer>
  </article>;
});

export const CompiledExportPreview = forwardRef<HTMLElement, { data: AppData; filters: Filters }>(function CompiledExportPreview({ data, filters }, ref) {
  return <section ref={ref} className="compiled-export"><ExportPreview kind="dashboard" data={data} filters={filters} /><ExportPreview kind="report" data={data} filters={filters} />{MODULES.map((module) => {
    const rows = data.modules[module.key].filter((record) => matchesFilters(record, filters));
    const headers = module.headers.filter((header) => header !== "ID").slice(0, 7);
    return <article className="compiled-module" key={module.key}><header><div><span>Rubrique filtrée</span><h2>{module.label}</h2><p>{module.eyebrow} · {rows.length} entrée{rows.length > 1 ? "s" : ""} · {filters.from ? formatDate(filters.from) : "Début libre"} → {filters.to ? formatDate(filters.to) : "Fin libre"}</p></div><AppLogo compact /></header>{rows.length ? <div className="compiled-module__table"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((record, index) => <tr key={`${module.key}-${index}`}>{headers.map((header) => <td key={header}>{record[header] || "—"}</td>)}</tr>)}</tbody></table></div> : <p className="compiled-module__empty">Aucune entrée dans la période active.</p>}</article>;
  })}</section>;
});

export const ModuleExportPreview = forwardRef<HTMLElement, { data: AppData; filters: Filters; moduleKey: ModuleKey }>(function ModuleExportPreview({ data, filters, moduleKey }, ref) {
  const module = MODULES.find((item) => item.key === moduleKey) || MODULES[0];
  const rows = data.modules[module.key].filter((record) => matchesFilters(record, filters));
  const headers = module.headers.filter((header) => header !== "ID");
  return <article className="export-document export-document--module" ref={ref}>
    <div className="export-document__veil" /><div className="export-document__topline" />
    <header className="export-document__header"><div className="export-document__brand"><AppLogo /><span>SPSA COBIL · Pilotage IT</span></div><div className="export-document__meta"><span>Rubrique détaillée</span><time>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date())}</time></div></header>
    <section className="export-document__title"><p>{module.eyebrow} · Export PDF</p><h2>{module.label}</h2><span>Période active · {filters.from ? formatDate(filters.from) : "début libre"} — {filters.to ? formatDate(filters.to) : "fin libre"}</span></section>
    <section className="export-document__section export-module-summary"><div className="export-section-head"><span>01</span><h3>Détail de la rubrique</h3></div><p>{module.description}</p><strong>{rows.length} entrée{rows.length > 1 ? "s" : ""} dans le périmètre sélectionné</strong></section>
    <section className="export-document__section"><div className="export-section-head"><span>02</span><h3>Liste filtrée</h3></div>{rows.length ? <div className="module-export-table"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((record, index) => <tr key={`${module.key}-${index}`}>{headers.map((header) => <td key={header}>{record[header] || "—"}</td>)}</tr>)}</tbody></table></div> : <p className="export-empty">Aucune entrée dans cette rubrique pour la période active.</p>}</section>
    <footer className="export-document__footer"><span>Confidentiel · Usage de pilotage interne</span><span>Préparé depuis SPSA COBIL</span></footer>
  </article>;
});
