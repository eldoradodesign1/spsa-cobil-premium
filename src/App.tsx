/**
 * SPSA COBIL — COMPOSANT RACINE
 *
 * Ce fichier fait le lien entre le point d'entrée `main.tsx` et la première
 * vraie page de l'application : `Home`.
 *
 * Il est tentant de penser que `App` doit contenir toute l'application.
 * En React, ce n'est généralement PAS le cas.
 *
 * 🧠 On peut voir les composants comme un arbre :
 *
 *     main.tsx
 *        │
 *        ▼
 *       App
 *        │
 *        ▼
 *     ErrorBoundary
 *        │
 *        ▼
 *       Home
 *        │
 *        ├── composants d'interface
 *        ├── formulaires
 *        ├── tableaux
 *        └── etc.
 *
 * `App` sert donc ici de petite couche d'assemblage.
 */

import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

/**
 * Composant racine de SPSA COBIL.
 *
 * Un composant React est simplement une fonction qui retourne ce que React
 * doit afficher. Ici, la fonction ne possède même pas d'état : elle assemble
 * deux autres composants.
 */
export default function App() {
  return (
    // ------------------------------------------------------------------------
    // ERROR BOUNDARY
    // ------------------------------------------------------------------------
    //
    // `ErrorBoundary` est une "barrière" autour de notre interface.
    // Si un composant enfant rencontre une erreur de rendu compatible avec
    // ce mécanisme, cette barrière peut afficher un écran d'erreur au lieu
    // de laisser toute l'interface devenir inutilisable sans explication.
    //
    // 🧠 Le principe est comparable à un `try/catch`, mais au niveau de
    // l'arbre de composants React. Ce n'est pas exactement la même mécanique,
    // donc il ne faut pas remplacer tous les `try/catch` par des boundaries.
    //
    // Tout ce qui est placé entre les balises :
    //
    //     <ErrorBoundary>
    //         ...
    //     </ErrorBoundary>
    //
    // devient ce que l'on appelle les `children` du composant.
    //
    // Ici, notre seul enfant est `Home`.
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}
