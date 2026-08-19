/** SPSA COBIL — Nebula : prévisualisation éditoriale fidèle au document de direction. */
import { forwardRef } from "react";
import { AppData, Filters, REPORT_SECTIONS, formatDate, getMetrics, getWeeklyTrend } from "@/lib/business";
import { AppLogo } from "@/components/AppLogo";

type ExportPreviewProps = { kind: "dashboard" | "report"; data: AppData; filters: Filters };

export const ExportPreview = forwardRef<HTMLElement, ExportPreviewProps>(function ExportPreview({ kind, data, filters }, ref) {
  const metrics = getMetrics(data, filters); const trend = getWeeklyTrend(data, filters);
  const heading = kind === "dashboard" ? "Synthèse de pilotage IT" : "Rapport hebdomadaire";
  return <article className="export-document" ref={ref}>
    <div className="export-document__veil" /><div className="export-document__topline" />
    <header className="export-document__header"><div className="export-document__brand"><AppLogo /><span>Nebula Edition · Pilotage IT</span></div><div className="export-document__meta"><span>Document de direction</span><time>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date())}</time></div></header>
    <section className="export-document__title"><p>IT Operations · SPSA COBIL</p><h2>{heading}</h2><span>Période active · {filters.from ? formatDate(filters.from) : "début libre"} — {filters.to ? formatDate(filters.to) : "fin libre"}</span></section>
    {kind === "dashboard" ? <>
      <div className="export-kpis"><div><b>{metrics.activitiesDone}</b><span>Activités terminées</span></div><div><b>{metrics.incidentsOpen}</b><span>Incidents ouverts</span></div><div><b>{metrics.projectsInProgress}</b><span>Projets en cours</span></div><div><b>{metrics.purchasesWaiting}</b><span>Achats en attente</span></div></div>
      <section className="export-document__section"><div className="export-section-head"><span>01</span><h3>Lecture de la période</h3></div><div className="export-trend">{trend.length ? trend.map((point) => <div key={point.key}><span style={{ height: `${Math.max(10, point.activities * 14)}px` }} /><small>{point.label}</small></div>) : <p>La tendance apparaîtra ici dès l’import des activités et incidents datés.</p>}</div></section>
      <section className="export-document__section"><div className="export-section-head"><span>02</span><h3>Échéances et points d’attention</h3></div>{metrics.alerts.length ? <div className="export-alerts">{metrics.alerts.map((alert) => <p key={`${alert.module}-${alert.label}`}><b>{alert.module}</b><span>{alert.label}</span><time>{formatDate(alert.date)}</time></p>)}</div> : <p className="export-empty">Aucune échéance renseignée pour la période active.</p>}</section>
    </> : <div className="export-report-sections">{REPORT_SECTIONS.map((section, index) => <section className="export-document__section" key={section.key}><div className="export-section-head"><span>{String(index + 1).padStart(2, "0")}</span><h3>{section.label}</h3></div><p>{data.report[section.key] || "Aucune information renseignée pour cette section."}</p></section>)}</div>}
    <footer className="export-document__footer"><span>Confidentiel · Usage de pilotage interne</span><span>Préparé depuis SPSA COBIL</span></footer>
  </article>;
});
