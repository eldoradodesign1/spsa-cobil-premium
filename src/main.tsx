/**
 * SPSA COBIL — POINT DE DÉPART DE L'APPLICATION
 *
 * Ce fichier est volontairement petit.
 * Son rôle n'est PAS de contenir la logique métier de l'application.
 * Il sert simplement à démarrer React et à lui dire quel composant afficher.
 *
 * 🧠 À retenir :
 * Une application React possède généralement un point d'entrée.
 * Le navigateur charge d'abord le fichier JavaScript produit par Vite,
 * puis ce fichier crée le "root" React et monte notre composant principal.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ============================================================================
// 1. SERVICE WORKER : FONCTIONNEMENT PWA
// ============================================================================
//
// Un Service Worker est un petit programme JavaScript exécuté par le
// navigateur en arrière-plan. Dans notre cas, il sert notamment à permettre
// à SPSA COBIL de se comporter comme une PWA et à gérer un cache local.
//
// `"serviceWorker" in navigator` signifie :
// "Est-ce que le navigateur actuel sait gérer les Service Workers ?"
//
// `import.meta.env.PROD` est une variable fournie par Vite.
// Elle vaut `true` lorsque l'application a été construite pour la production.
//
// On ne veut donc enregistrer le Service Worker qu'en production.
// En développement, cela pourrait conserver de vieux fichiers en cache et
// nous donner l'impression qu'une modification de code ne fonctionne pas.
// ============================================================================

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  // On attend que la page soit complètement chargée avant d'enregistrer
  // le Service Worker. Ce n'est pas obligatoire dans tous les projets,
  // mais cela évite de faire passer cette opération avant le chargement
  // initial de l'interface.
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", {
        // Demande au navigateur de ne pas utiliser son cache HTTP pour
        // rechercher le fichier du Service Worker.
        // Cela facilite la prise en compte d'une nouvelle version de sw.js.
        updateViaCache: "none",
      })
      .catch(() => undefined);

    // ⚠️ Pourquoi `.catch(() => undefined)` ?
    //
    // `register()` renvoie une Promise.
    // Une Promise représente une opération qui se terminera plus tard.
    // Si l'enregistrement échoue, `.catch(...)` permet d'éviter une erreur
    // non gérée dans la console.
    //
    // Ici l'erreur est volontairement ignorée. C'est fonctionnel, mais ce
    // n'est pas idéal pour le diagnostic : plus tard, nous pourrons décider
    // d'y afficher une vraie erreur utile au développeur.
  });
}

// ============================================================================
// 2. DÉVELOPPEMENT : DÉSACTIVER LES ANCIENS SERVICE WORKERS
// ============================================================================
//
// En développement, nous faisons exactement l'inverse : nous supprimons
// les Service Workers déjà enregistrés.
//
// Pourquoi ?
// Parce qu'un Service Worker peut servir une ancienne version de l'application
// depuis son cache. C'est pratique en production, mais très pénible pendant
// le développement : on modifie le code, on recharge la page... et le
// navigateur continue parfois à nous montrer l'ancienne version.
//
// `getRegistrations()` renvoie une Promise contenant la liste des Service
// Workers actuellement enregistrés pour le site.
//
// Puis :
//   `.then((registrations) => ...)`
// signifie :
//   "Quand tu as fini de récupérer cette liste, fais ceci."
// ============================================================================

if ("serviceWorker" in navigator && import.meta.env.DEV) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      // `forEach` parcourt chaque élément du tableau.
      // Ici, pour chaque Service Worker trouvé, on demande sa désinscription.
      registrations.forEach((registration) => registration.unregister());
    });
}

// ============================================================================
// 3. CRÉATION DU "ROOT" REACT
// ============================================================================
//
// C'est probablement LA ligne la plus importante de ce fichier.
//
// Dans notre HTML, nous avons un élément ressemblant à ceci :
//
//     <div id="root"></div>
//
// React va prendre possession de ce conteneur et y dessiner toute notre
// interface.
//
// `document.getElementById("root")` est du JavaScript navigateur classique :
// il cherche dans le HTML l'élément dont l'id est "root".
//
// Le `!` après la parenthèse est une syntaxe TypeScript appelée "non-null
// assertion". Elle signifie en gros :
//
//     "TypeScript, je te garantis que cet élément existe."
//
// ⚠️ Si le `<div id="root">` n'existait réellement pas, cette garantie serait
// fausse et l'application pourrait planter. Le `!` ne crée pas l'élément ;
// il ne fait que rassurer TypeScript.
// ============================================================================

createRoot(document.getElementById("root")!).render(
  // `StrictMode` est un outil de React destiné au développement.
  // Il aide notamment à détecter certains comportements problématiques.
  // Il ne constitue pas une "page" ou un élément visuel de notre application.
  <StrictMode>
    {/*
     * `App` est le composant racine de NOTRE application.
     *
     * À partir de lui, React va descendre dans l'arbre des composants :
     *
     *     App
     *      ↓
     *     Home
     *      ↓
     *     composants...
     *
     * C'est donc ici que notre code personnel entre réellement dans React.
     */}
    <App />
  </StrictMode>
);
