import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { emptyData, getDateBounds, getMetrics, getWeeklyTrend, importWorkbook, matchesFilters, priorityTone } from "@/lib/business";

describe("logique métier SPSA COBIL", () => {
  it("applique simultanément le filtre de période, de responsable et de site", () => {
    const record = { Date: "2026-08-06", Responsable: "Aline", Site: "Kinshasa" };
    expect(matchesFilters(record, { from: "2026-08-01", to: "2026-08-09", responsible: "Aline", site: "Kinshasa" })).toBe(true);
    expect(matchesFilters(record, { from: "2026-08-07", to: "2026-08-09", responsible: "Aline", site: "Kinshasa" })).toBe(false);
    expect(matchesFilters(record, { from: "2026-08-01", to: "2026-08-09", responsible: "Paul", site: "Kinshasa" })).toBe(false);
  });

  it("agrège les KPI de pilotage dans le périmètre actif", () => {
    const data = emptyData("jeu de test");
    data.modules.suivi = [
      { Date: "2026-08-03", "Activité / Demande": "Accès VPN", Statut: "Terminé", Responsable: "Aline" },
      { Date: "2026-08-04", "Activité / Demande": "Audit réseau", Statut: "En attente", Responsable: "Aline", Échéance: "2026-08-07" },
    ];
    data.modules.incidents = [{ Date: "2026-08-05", Description: "Messagerie", Statut: "Ouvert" }];
    data.modules.projets = [{ "Date début": "2026-08-02", Projet: "WAN", Statut: "En cours", Échéance: "2026-08-12" }];
    data.modules.achats = [{ Date: "2026-08-05", "Équipement / Service": "Switch", Statut: "En attente" }];
    const filters = { from: "2026-08-01", to: "2026-08-09", responsible: "", site: "" };
    const metrics = getMetrics(data, filters);
    expect(metrics.activitiesDone).toBe(1);
    expect(metrics.actionsWaiting).toBe(1);
    expect(metrics.incidentsOpen).toBe(1);
    expect(metrics.projectsInProgress).toBe(1);
    expect(metrics.purchasesWaiting).toBe(1);
    expect(metrics.alerts).toHaveLength(2);
    expect(getWeeklyTrend(data, filters)).toHaveLength(1);
  });

  it("déduit des bornes de période fiables à partir du contenu métier", () => {
    const data = emptyData();
    data.modules.suivi = [{ Date: "2026-07-30", "Activité / Demande": "Sauvegarde" }];
    data.report.endDate = "2026-08-09";
    expect(getDateBounds(data)).toEqual({ min: "2026-07-30", max: "2026-08-09", ticks: ["2026-07-30", "2026-08-09"] });
  });

  it("associe chaque niveau de priorité à sa tonalité de lecture", () => {
    expect(priorityTone("Critique")).toBe("rose");
    expect(priorityTone("Haute")).toBe("violet");
    expect(priorityTone("Normale")).toBe("blue");
    expect(priorityTone("Basse")).toBe("blue");
  });

  it("importe les colonnes clés et le rapport hebdomadaire depuis un classeur", async () => {
    const workbook = XLSX.utils.book_new();
    const suivi = XLSX.utils.aoa_to_sheet([["Titre"], [], ["ID", "Date", "Activité / Demande", "Demandeur / Service", "Catégorie", "Priorité", "Responsable", "Statut"], [1, new Date("2026-08-04T12:00:00"), "Connexion VPN", "Finance", "Sécurité", "Haute", "Aline", "En cours"]]);
    const report = XLSX.utils.aoa_to_sheet([["Titre"], [], ["Semaine", new Date("2026-08-03T12:00:00"), "au", new Date("2026-08-09T12:00:00")], [], [], [], [], [], [], ["Mise à jour du VPN"]]);
    XLSX.utils.book_append_sheet(workbook, suivi, "Suivi permanent");
    XLSX.utils.book_append_sheet(workbook, report, "Rapport hebdomadaire");
    const file = new File([XLSX.write(workbook, { type: "array", bookType: "xlsx" })], "source.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const data = await importWorkbook(file);
    expect(data.modules.suivi).toHaveLength(1);
    expect(data.modules.suivi[0]["Activité / Demande"]).toBe("Connexion VPN");
    expect(data.report.startDate).toBe("2026-08-03");
    expect(data.report.realisations).toBe("Mise à jour du VPN");
  });
});
