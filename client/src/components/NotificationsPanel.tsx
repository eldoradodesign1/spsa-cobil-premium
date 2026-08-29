import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  AlertTriangle,
  Siren,
  Activity,
  Orbit,
  ReceiptText,
  Building2,
  MonitorCog,
  ShieldCheck,
  CheckCheck,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Clock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { AppData, ModuleKey, isPast, formatDate } from "@/lib/business";

export type NotificationCategory = "all" | "urgent" | "operations" | "system";
export type NotificationSeverity = "critical" | "warning" | "info" | "success";

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  moduleKey?: ModuleKey | "settings" | "dashboard" | "report";
  moduleLabel: string;
  title: string;
  description: string;
  date?: string;
  timestamp?: string;
  actionLabel?: string;
  badge?: string;
};

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  vaultStatus: "unprotected" | "locked" | "secured";
  onNavigate: (view: any) => void;
  readIds: Set<string>;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function generateNotifications(
  data: AppData,
  vaultStatus: string
): NotificationItem[] {
  const items: NotificationItem[] = [];

  // 1. Incidents non résolus
  data.modules.incidents.forEach((incident, index) => {
    const isResolved = (incident.Statut || "").toLowerCase() === "résolu";
    if (!isResolved) {
      const isCritical =
        ["critique", "bloquant", "haute", "urgente"].includes(
          (incident.Priorité || "").toLowerCase()
        ) || (incident.Statut || "").toLowerCase() === "ouvert";

      items.push({
        id: `incident-${index}-${incident.ID || incident.Date || index}`,
        category: isCritical ? "urgent" : "operations",
        severity: isCritical ? "critical" : "warning",
        moduleKey: "incidents",
        moduleLabel: "Incidents",
        title: incident.Description || `Incident déclaré #${index + 1}`,
        description: `Site: ${incident.Site || "Non spécifié"} · Priorité: ${
          incident.Priorité || "Normale"
        } · Statut: ${incident.Statut || "En cours"}`,
        date: incident.Date,
        actionLabel: "Voir dans le registre",
        badge: incident.Priorité || incident.Statut,
      });
    }
  });

  // 2. Activités de suivi (échéances dépassées ou en attente)
  data.modules.suivi.forEach((activity, index) => {
    const isDone = (activity.Statut || "").toLowerCase() === "terminé";
    if (!isDone) {
      const isLate =
        (activity.Statut || "").toLowerCase() === "en retard" ||
        (activity.Échéance && isPast(activity.Échéance));

      if (isLate) {
        items.push({
          id: `suivi-late-${index}-${activity.Échéance || index}`,
          category: "urgent",
          severity: "critical",
          moduleKey: "suivi",
          moduleLabel: "Suivi permanent",
          title: `Échéance dépassée · ${
            activity["Activité / Demande"] || "Activité sans titre"
          }`,
          description: `Échéance: ${formatDate(activity.Échéance)} · Resp: ${
            activity.Responsable || "Non assigné"
          } · Site: ${activity.Site || "Global"}`,
          date: activity.Échéance,
          actionLabel: "Consulter la demande",
          badge: "Retard",
        });
      } else if (activity.Échéance) {
        // Échéance proche (dans les 7 prochains jours)
        const dueTime = new Date(`${activity.Échéance}T23:59:59`).getTime();
        const now = Date.now();
        const diffDays = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          items.push({
            id: `suivi-soon-${index}-${activity.Échéance}`,
            category: "operations",
            severity: "warning",
            moduleKey: "suivi",
            moduleLabel: "Suivi permanent",
            title: `Échéance à J-${diffDays} · ${
              activity["Activité / Demande"] || "Activité"
            }`,
            description: `Date limite: ${formatDate(activity.Échéance)} · Resp: ${
              activity.Responsable || "Non assigné"
            }`,
            date: activity.Échéance,
            actionLabel: "Voir l'activité",
            badge: `J-${diffDays}`,
          });
        }
      }
    }
  });

  // 3. Projets en retard ou à surveiller
  data.modules.projets.forEach((project, index) => {
    const isDone = ["terminé", "livré", "clôturé"].includes(
      (project.Statut || "").toLowerCase()
    );
    if (!isDone) {
      const isLate =
        (project.Statut || "").toLowerCase() === "en retard" ||
        (project.Échéance && isPast(project.Échéance));

      if (isLate) {
        items.push({
          id: `projet-late-${index}-${project.Projet || index}`,
          category: "urgent",
          severity: "critical",
          moduleKey: "projets",
          moduleLabel: "Projets IT",
          title: `Projet en retard · ${project.Projet || "Projet IT"}`,
          description: `Date cible: ${formatDate(project.Échéance)} · Chef: ${
            project["Chef de projet"] || "Non spécifié"
          } · Statut: ${project.Statut || "En cours"}`,
          date: project.Échéance,
          actionLabel: "Voir la fiche projet",
          badge: "Échéance dépassée",
        });
      }
    }
  });

  // 4. Achats IT en attente d'approbation
  data.modules.achats.forEach((purchase, index) => {
    const isWaiting = (purchase.Statut || "").toLowerCase() === "en attente";
    if (isWaiting) {
      items.push({
        id: `achat-waiting-${index}-${purchase["Équipement / Service"] || index}`,
        category: "operations",
        severity: "warning",
        moduleKey: "achats",
        moduleLabel: "Achats IT",
        title: `Validation en attente · ${
          purchase["Équipement / Service"] || "Achat IT"
        }`,
        description: `Montant: ${
          purchase["Montant USD"] ? `${purchase["Montant USD"]} USD` : "Non spécifié"
        } · Demandeur: ${purchase.Demandeur || "N/A"}`,
        date: purchase.Date,
        actionLabel: "Examiner l'achat",
        badge: "En attente",
      });
    }
  });

  // 5. Fournisseurs à relancer
  data.modules.fournisseurs.forEach((vendor, index) => {
    const needsFollowUp = ["à relancer", "en attente"].includes(
      (vendor.Statut || "").toLowerCase()
    );
    if (needsFollowUp) {
      items.push({
        id: `vendor-${index}-${vendor.Fournisseur || index}`,
        category: "operations",
        severity: "warning",
        moduleKey: "fournisseurs",
        moduleLabel: "Fournisseurs",
        title: `Relance fournisseur requise · ${
          vendor.Fournisseur || "Fournisseur"
        }`,
        description: `Prestation: ${
          vendor.Prestation || "Contrat récurrent"
        } · Statut: ${vendor.Statut}`,
        actionLabel: "Voir le contrat",
        badge: vendor.Statut,
      });
    }
  });

  // 6. Équipements nécessitant réparation ou réforme
  data.modules.equipements.forEach((eq, index) => {
    const isDamaged = ["à réparer", "en panne", "réformé"].includes(
      (eq.État || "").toLowerCase()
    );
    if (isDamaged) {
      items.push({
        id: `equipment-${index}-${eq["Asset ID"] || index}`,
        category: "operations",
        severity: "warning",
        moduleKey: "equipements",
        moduleLabel: "Équipements",
        title: `Matériel ${eq.État?.toLowerCase()} · ${
          eq["Marque / Modèle"] || eq["Asset ID"] || "Équipement"
        }`,
        description: `Asset ID: ${eq["Asset ID"] || "—"} · Site: ${
          eq.Site || "Non localisé"
        }`,
        actionLabel: "Voir l'inventaire",
        badge: eq.État,
      });
    }
  });

  // 7. Alertes de sécurité & Système
  if (vaultStatus === "unprotected") {
    items.push({
      id: "system-vault-unprotected",
      category: "system",
      severity: "info",
      moduleKey: "settings",
      moduleLabel: "Sécurité",
      title: "Coffre local non chiffré",
      description:
        "Activez le chiffrement AES-256 dans les Préférences pour sceller vos données de pilotage sur cet appareil.",
      actionLabel: "Configurer le coffre",
      badge: "Recommandé",
    });
  }

  // Info classeur chargé
  if (data.sourceName) {
    items.push({
      id: "system-workbook-status",
      category: "system",
      severity: "success",
      moduleKey: "dashboard",
      moduleLabel: "Espace de travail",
      title: `Données actives · ${data.sourceName}`,
      description: data.updatedAt
        ? `Dernière synchronisation locale : ${formatDate(data.updatedAt)}`
        : "Données prêtes pour l'analyse et l'export.",
      actionLabel: "Vue de direction",
      badge: "En mémoire",
    });
  }

  return items;
}

export function NotificationsPanel({
  isOpen,
  onClose,
  data,
  vaultStatus,
  onNavigate,
  readIds,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsPanelProps) {
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");
  const [filterQuery, setFilterQuery] = useState("");

  const allNotifications = useMemo(
    () => generateNotifications(data, vaultStatus),
    [data, vaultStatus]
  );

  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((item) => {
      const matchTab = activeTab === "all" || item.category === activeTab;
      const matchQuery =
        !filterQuery ||
        item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
        item.moduleLabel.toLowerCase().includes(filterQuery.toLowerCase());
      return matchTab && matchQuery;
    });
  }, [allNotifications, activeTab, filterQuery]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((item) => !readIds.has(item.id)).length;
  }, [allNotifications, readIds]);

  const urgentCount = useMemo(() => {
    return allNotifications.filter(
      (item) => item.category === "urgent" && !readIds.has(item.id)
    ).length;
  }, [allNotifications, readIds]);

  const handleItemClick = (item: NotificationItem) => {
    onMarkAsRead(item.id);
    if (item.moduleKey) {
      onNavigate(item.moduleKey);
    }
    onClose();
  };

  const getModuleIcon = (moduleKey?: string) => {
    switch (moduleKey) {
      case "incidents":
        return Siren;
      case "suivi":
        return Activity;
      case "projets":
        return Orbit;
      case "achats":
        return ReceiptText;
      case "fournisseurs":
        return Building2;
      case "equipements":
        return MonitorCog;
      case "settings":
        return ShieldAlert;
      default:
        return Info;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop notifications-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.section
            className="notifications-flyout glass-panel"
            initial={{ opacity: 0, x: 28, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Centre de notifications et alertes"
          >
            {/* Header */}
            <header className="notifications-flyout__header">
              <div className="notifications-flyout__title-wrap">
                <div className="notifications-flyout__icon-badge">
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="pulse-dot" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2>Notifications & Alertes</h2>
                    {unreadCount > 0 && (
                      <span className="notifications-badge-counter">
                        {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p>Surveillance en temps réel des opérations et échéances IT</p>
                </div>
              </div>
              <div className="notifications-flyout__header-actions">
                {unreadCount > 0 && (
                  <button
                    className="notifications-mark-read-btn"
                    onClick={onMarkAllAsRead}
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck size={14} />
                    <span>Tout marquer comme lu</span>
                  </button>
                )}
                <button
                  className="icon-button"
                  onClick={onClose}
                  aria-label="Fermer les notifications"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {/* Category Filter Tabs */}
            <div className="notifications-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === "all"}
                className={`notifications-tab ${
                  activeTab === "all" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("all")}
              >
                <span>Toutes</span>
                <small>{allNotifications.length}</small>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "urgent"}
                className={`notifications-tab ${
                  activeTab === "urgent" ? "is-active" : ""
                } ${urgentCount > 0 ? "has-urgent" : ""}`}
                onClick={() => setActiveTab("urgent")}
              >
                <AlertTriangle size={13} />
                <span>Urgences & Retards</span>
                {urgentCount > 0 && <small className="urgent-pill">{urgentCount}</small>}
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "operations"}
                className={`notifications-tab ${
                  activeTab === "operations" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("operations")}
              >
                <span>Opérations</span>
                <small>
                  {
                    allNotifications.filter((i) => i.category === "operations")
                      .length
                  }
                </small>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "system"}
                className={`notifications-tab ${
                  activeTab === "system" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("system")}
              >
                <span>Système</span>
                <small>
                  {
                    allNotifications.filter((i) => i.category === "system")
                      .length
                  }
                </small>
              </button>
            </div>

            {/* Notification items list */}
            <div className="notifications-list">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => {
                  const isRead = readIds.has(item.id);
                  const IconComp = getModuleIcon(item.moduleKey);

                  return (
                    <article
                      key={item.id}
                      className={`notification-card notification-card--${
                        item.severity
                      } ${isRead ? "is-read" : "is-unread"}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="notification-card__icon-box">
                        <IconComp size={17} />
                      </div>
                      <div className="notification-card__content">
                        <div className="notification-card__meta">
                          <span className="notification-card__module">
                            {item.moduleLabel}
                          </span>
                          {item.badge && (
                            <span
                              className={`notification-card__pill pill--${item.severity}`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {!isRead && (
                            <span className="notification-card__unread-dot" />
                          )}
                        </div>
                        <h4 className="notification-card__title">
                          {item.title}
                        </h4>
                        <p className="notification-card__desc">
                          {item.description}
                        </p>
                        <div className="notification-card__footer">
                          {item.date && (
                            <span className="notification-card__date">
                              <Calendar size={12} />
                              {formatDate(item.date)}
                            </span>
                          )}
                          <span className="notification-card__action">
                            {item.actionLabel || "Ouvrir"}
                            <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="notifications-empty">
                  <div className="notifications-empty__icon">
                    <Sparkles size={26} />
                  </div>
                  <h3>Aucune notification active</h3>
                  <p>
                    {activeTab === "urgent"
                      ? "Félicitations, aucune échéance critique ou incident bloquant n’est à signaler."
                      : "Toutes les opérations IT sont conformes et sous contrôle."}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="notifications-flyout__footer">
              <div className="notifications-summary-stats">
                <span>
                  <b>{allNotifications.filter((i) => i.severity === "critical").length}</b>{" "}
                  critique(s)
                </span>
                <span>·</span>
                <span>
                  <b>{allNotifications.filter((i) => i.severity === "warning").length}</b>{" "}
                  vigilance(s)
                </span>
                <span>·</span>
                <span>
                  <b>{allNotifications.filter((i) => i.category === "system").length}</b>{" "}
                  système
                </span>
              </div>
              <button
                className="soft-button notifications-close-bottom-btn"
                onClick={onClose}
              >
                Fermer
              </button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
