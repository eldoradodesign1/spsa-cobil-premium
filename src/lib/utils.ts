// ============================================================================
// 🧰 UTILITAIRE DE CLASSES CSS
// ============================================================================
//
// Ce fichier contient une toute petite fonction, mais elle revient souvent
// dans les projets React utilisant Tailwind CSS.
//
// Si tu rencontres `cn(...)` ailleurs dans le projet, pense :
//
//     cn = "combine class names proprement"
//
// Elle utilise deux bibliothèques :
//
//   1. `clsx`
//      Permet de construire une chaîne de classes CSS à partir de plusieurs
//      valeurs, y compris des conditions.
//
//   2. `tailwind-merge`
//      Comprend les classes Tailwind qui se contredisent et essaie de garder
//      la classe qui doit réellement avoir priorité.
//
// Exemple conceptuel :
//
//     cn("p-4", condition && "p-8")
//
// peut produire une liste de classes adaptée à la situation.
//
// 🧠 Pourquoi ne pas simplement écrire une chaîne ?
// Parce que dans une interface React, les classes sont très souvent
// conditionnelles : couleur selon l'état, taille selon le mode compact,
// style différent si un élément est sélectionné, etc.
// ============================================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine plusieurs valeurs de classes CSS et nettoie les conflits Tailwind.
 *
 * `ClassValue` est un type fourni par `clsx`.
 *
 * Le `...inputs` est le "rest parameter" de JavaScript/TypeScript :
 * il permet d'appeler cette fonction avec autant d'arguments que nécessaire.
 *
 * Par exemple :
 *
 *     cn("text-sm", "font-bold", condition && "opacity-50")
 *
 * À l'intérieur, `inputs` devient un tableau contenant ces valeurs.
 *
 * `clsx(inputs)` transforme ensuite ces valeurs en une chaîne de classes.
 * `twMerge(...)` analyse cette chaîne et résout certains conflits entre
 * classes Tailwind.
 *
 * 🧠 À retenir : `cn()` ne dessine rien et ne modifie pas directement le DOM.
 * Elle prépare simplement une chaîne de classes CSS que React utilisera
 * ensuite sur un élément comme `<div className={cn(...)} />`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
