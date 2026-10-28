import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { emptyData, getDateBounds, getMetrics, getNextEquipmentId, getWeeklyTrend, importPreviewToData, importWorkbook, matchesFilters, migrateAppData, priorityTone } from "@/lib/business";
import { createVault, unlockVault } from "@/lib/secureStorage";
import { parseAppDataCsv, serializeAppData } from "@/lib/localRecovery";

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
    data.modules.achats = [{ Date: "2026-08-05", "Équipement / Service": "Switch", Statut: "En attente", "Montant USD": "1 250,50" }, { Date: "2026-08-12", "Équipement / Service": "Firewall", Statut: "Approuvé", "Montant USD": "300" }];
    const filters = { from: "2026-08-01", to: "2026-08-09", responsible: "", site: "" };
    const metrics = getMetrics(data, filters);
    expect(metrics.activitiesDone).toBe(1);
    expect(metrics.actionsWaiting).toBe(1);
    expect(metrics.incidentsOpen).toBe(1);
    expect(metrics.projectsInProgress).toBe(1);
    expect(metrics.purchasesWaiting).toBe(1);
    expect(metrics.totalPurchaseAmount).toBe(1250.5);
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

  it("ne décale pas les incidents quand la feuille source ne contient pas la colonne ID", async () => {
    const workbook = XLSX.utils.book_new();
    const incidents = XLSX.utils.aoa_to_sheet([
      ["Incidents"],
      [],
      ["Date", "Utilisateur / Service", "Description", "Catégorie", "Priorité", "Statut"],
      [new Date("2026-10-26T12:00:00"), "Charroi", "Land cruiser 4230 BV 01", "Application", "Haute", "Résolu"],
    ]);
    XLSX.utils.book_append_sheet(workbook, incidents, "Incidents");
    const file = new File([XLSX.write(workbook, { type: "array", bookType: "xlsx" })], "incidents-sans-id.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const data = await importWorkbook(file);
    expect(data.modules.incidents[0]).toMatchObject({
      Date: "2026-10-26",
      "Utilisateur / Service": "Charroi",
      Description: "Land cruiser 4230 BV 01",
      Catégorie: "Application",
      Priorité: "Haute",
      Statut: "Résolu",
    });
    expect(data.modules.incidents[0].ID).toBe("");
  });

  it("répare les incidents déjà stockés avec les trois premières valeurs décalées", () => {
    const data = emptyData();
    data.modules.incidents = [{ Date: "Land cruiser 4230 BV 01", "Utilisateur / Service": "2026-10-26", Description: "Charroi", Catégorie: "Application", Priorité: "Haute", Statut: "Résolu" }];
    expect(migrateAppData(data).modules.incidents[0]).toMatchObject({ Date: "2026-10-26", "Utilisateur / Service": "Charroi", Description: "Land cruiser 4230 BV 01" });
  });

  it("reconstitue les données métier depuis le CSV de récupération", () => {
    const data = emptyData("session CSV");
    data.modules.incidents = [{ Date: "2026-10-26", Description: "Serveur, baie 2", Statut: "Ouvert" }];
    data.report.realisations = "Accès rétabli\navec preuve";
    const restored = parseAppDataCsv(serializeAppData(data));
    expect(restored?.sourceName).toBe("session CSV");
    expect(restored?.modules.incidents[0]).toMatchObject({ Date: "2026-10-26", Description: "Serveur, baie 2", Statut: "Ouvert" });
    expect(restored?.report.realisations).toBe("Accès rétabli\navec preuve");
  });

  it("importe uniquement les feuilles et lignes retenues dans la revue Excel", () => {
    const data = importPreviewToData({ fileName: "sélection.xlsx", sheets: [
      { id: "suivi", sourceName: "Suivi permanent", target: "suivi", selected: true, headers: ["ID", "Date", "Activité / Demande"], rows: [{ index: 0, selected: true, values: { ID: "1", Date: "2026-08-03", "Activité / Demande": "Accès VPN" } }, { index: 1, selected: false, values: { ID: "2", Date: "2026-08-04", "Activité / Demande": "Audit réseau" } }] },
      { id: "ignore", sourceName: "Notes", target: "ignore", selected: false, headers: ["Note"], rows: [{ index: 0, selected: false, values: { Note: "Ne pas importer" } }] },
    ] });
    expect(data.modules.suivi).toHaveLength(1);
    expect(data.modules.suivi[0]["Activité / Demande"]).toBe("Accès VPN");
    expect(data.modules.projets).toHaveLength(0);
  });

  it("génère le prochain identifiant d’équipement sans écraser les formats importés", () => {
    const data = emptyData();
    data.modules.equipements = [{ "Asset ID": "EQ-0003" }, { "Asset ID": "IT-2026-014" }, { "Asset ID": "manuel" }];
    expect(getNextEquipmentId(data)).toBe("EQ-0015");
  });

  it("chiffre les données locales et impose la phrase secrète pour les restituer", async () => {
    const data = emptyData("jeu de test chiffré");
    data.modules.achats = [{ Date: "2026-08-19", "Équipement / Service": "Routeur sécurisé" }];
    const { vault } = await createVault(data, "phrase-secrete-de-test-2026");
    expect(vault.ciphertext).not.toContain("Routeur sécurisé");
    await expect(unlockVault(vault, "phrase-invalide-2026")).rejects.toBeDefined();
    const restored = await unlockVault(vault, "phrase-secrete-de-test-2026");
    expect(restored.data.modules.achats[0]["Équipement / Service"]).toBe("Routeur sécurisé");
  });
});
