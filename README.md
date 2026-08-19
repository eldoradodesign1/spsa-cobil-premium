# SPSA COBIL · Pilotage IT

Cockpit de pilotage IT conçu pour agréger les registres opérationnels SPSA COBIL, préparer le rapport hebdomadaire et exporter des livrables de direction en **XLSX** et **PDF**.

## Fonctions livrées

| Domaine | Fonctionnalités |
| --- | --- |
| Pilotage | Synthèse des activités, incidents, projets et achats avec indicateurs et alertes d’échéance. |
| Périmètre | Double curseur de période, filtres de responsable et de site, relais de la période dans la topbar au défilement. |
| Registres | Consultation, création, édition, recherche et suppression dans les six registres IT. |
| Rapport | Rapport hebdomadaire éditable, structuré en réalisations, vigilances, actions, décisions, ressources et contexte. |
| Exports | Prévisualisation HTML de direction, PDF A4 et XLSX avec feuilles, formats, filtres, volets et styles Excel. |
| Usage | Thèmes clair et sombre, lavalamp animée, navigation desktop first et adaptation smartphone/tablette. |
| Installation | Manifeste et service worker PWA, actifs uniquement en production. |

## Développement local

```bash
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm build
```

## GitHub Pages

Le projet est compatible avec un déploiement sous-répertoire, grâce à des chemins relatifs. Le workflow livré compile puis publie automatiquement le site à chaque `push` sur `main`.

1. Créez un dépôt GitHub et poussez le contenu du projet.
2. Dans **Settings → Pages**, choisissez **GitHub Actions** comme source.
3. Vérifiez que la branche de publication est `main`, ou adaptez l’évènement dans `.github/workflows/deploy-pages.yml`.
4. Après exécution du workflow, ouvrez l’URL GitHub Pages ; le navigateur proposera l’installation PWA lorsqu’il la prend en charge.

## Données et confidentialité

Les données restent dans le navigateur, dans son stockage local, jusqu’à import, modification ou réinitialisation par l’utilisateur. L’application ne transmet pas le contenu du classeur importé à un service distant. Les exports reprennent uniquement le périmètre actif à l’écran.

## Import attendu

L’import accepte les fichiers `.xlsx` et `.xls` comportant les feuilles historiques : `Rapport hebdomadaire`, `Suivi permanent`, `Incidents`, `Projets`, `Fournisseurs`, `Équipements` et `Achats IT`. Les en-têtes métier sont rapprochés de façon tolérante pour permettre les évolutions mineures de libellés.

## Vérifications effectuées

Les règles de filtrage, agrégats et import sont couvertes par une suite de tests. Le parcours a également été validé avec le classeur de référence fourni : import, filtres, thèmes, prévisualisation, export XLSX et export PDF.
