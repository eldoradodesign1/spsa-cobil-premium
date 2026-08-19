# Analyse métier — SPSA COBIL · Pilotage IT

## Objet de la reconstruction

L’application d’origine est un poste de pilotage local appuyé sur un classeur Excel de référence. Sa valeur métier réside dans la centralisation de six registres opérationnels, dans la synthèse des signaux IT et dans la préparation d’un rapport hebdomadaire à destination de la Direction. La reconstruction ne reproduit pas la structure technique précédente : elle transforme cette logique en un cockpit web responsive, installable et prêt pour une diffusion statique.

## Domaine opérationnel conservé

| Registre | Finalité de gestion | Signaux prioritaires |
| --- | --- | --- |
| Suivi permanent | Consigner les activités et demandes IT du quotidien. | Statut, priorité, responsable, échéance, prochaine action. |
| Incidents | Suivre l’ouverture, la résolution, la cause et l’impact des incidents. | Statut, priorité, temps de résolution, action corrective. |
| Projets | Piloter le portefeuille de projets IT. | Avancement, budget, échéance, risques, responsable. |
| Fournisseurs | Documenter contrats, relances et escalades. | Statut, date de relance, délai attendu, action d’escalade. |
| Équipements | Maintenir le référentiel des actifs IT. | État, site, responsable, garantie, localisation. |
| Achats IT | Suivre les demandes, approbations et commandes. | Montant, statut, approbateur, date d’approbation. |

Le rapport hebdomadaire conserve son rôle de narration managériale. Il rassemble les réalisations majeures, les points de vigilance, les actions à venir, les décisions attendues, les besoins de ressources et les notes de contexte.

## Règles de lecture et de calcul

Le filtre global applique de façon cumulative les bornes temporelles, le responsable et le site. Chaque ligne est positionnée dans le temps à partir de sa première date métier disponible : `Date`, `Date début`, `Date demande`, `Date acquisition` ou `Date approbation`. Le double curseur temporalise la sélection et s’ancre sur les dates réellement présentes ; il conserve des poignées accessibles au clavier et au pointeur.

| Indicateur | Règle appliquée |
| --- | --- |
| Activités terminées | Lignes « Suivi permanent » dont le statut est `Terminé`. |
| Activités en cours | Lignes « Suivi permanent » dont le statut est `En cours`. |
| Actions en attente | Lignes « Suivi permanent » dont le statut est `En attente` ou `En retard`. |
| Incidents ouverts | Lignes « Incidents » dont le statut est `Ouvert` ou `En cours`. |
| Incidents résolus | Lignes « Incidents » dont le statut est `Résolu`. |
| Projets en cours | Lignes « Projets » dont le statut est `En cours`. |
| Achats en attente | Lignes « Achats IT » dont le statut est `En attente`. |
| Alertes d’échéance | Activités et projets ayant une échéance, ordonnés par date ; les échéances passées sont signalées en niveau critique. |

## Décisions de produit

La reconstruction adopte une interface **Lentille Boréale**. Sur desktop, le cockpit occupe la largeur centrale tandis que la navigation encadre l’expérience. Les métriques sont traitées comme des instruments de décision, avec des valeurs tabulaires Manrope ; DM Serif Display est réservée aux titres de synthèse et aux documents. Les thèmes clair et sombre sont autonomes, avec une lavalamp en arrière-plan adaptée au contraste de chaque univers.

Les données sont conservées dans le navigateur tant que l’utilisateur n’importe pas ou ne réinitialise pas son espace de travail. L’import accepte les classeurs Excel compatibles avec la structure historique ; l’export produit un classeur XLSX restructuré et un PDF issu de la prévisualisation éditoriale. Les feuilles, titres, filtres et formats de date sont préparés pour un usage de direction, sans prétendre modifier le fichier importé d’origine octet par octet.

## Validation visuelle — état de contrôle

La première inspection desktop a révélé qu’un voile réservé au menu mobile participait involontairement à la grille desktop et repoussait la surface de commandement sous la navigation. Le voile est désormais masqué hors usage mobile ; le navigateur confirme que l’espace de travail occupe la seconde colonne de la grille et que la page principale s’affiche dans son champ central.
