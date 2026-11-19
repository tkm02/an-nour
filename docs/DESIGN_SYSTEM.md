# Design system — An-Nour site public

> Formalisé à partir des styles **réellement utilisés** (2026-11-19). Palette commune proposée pour les 3 interfaces :
> dépôt Backend, `docs/DESIGN_SYSTEM.md` (tokens `--an-*`). **Aucun style n'a été modifié.**

## 1. Variables existantes (`src/index.css`, `:root`)
Couleurs `--primary-blue #1e3a8a`, `--secondary-blue #3b82f6`, `--light-blue #60a5fa`, `--green-highlight #a3e635`,
`--yellow-accent #fbbf24`, gris (`--light-gray`, `--medium-gray`, `--dark-gray`, `--text-dark`) ; espacements
`--spacing-xs…xl` (0,5 → 6 rem) ; ombres `--shadow-sm…xl` ; rayons `--radius-*`.
→ Ces variables de couleur (palette **bleue**) ne correspondent pas aux couleurs réellement affichées (palette
**sarcelle/vert**, écrite en dur dans les CSS de composants). Les variables d'espacement, d'ombre et de rayon sont
une bonne base à conserver.

## 2. Couleurs écrites en dur
| Couleur | Occurrences | Où | Token cible proposé |
|---|---|---|---|
| `#0F766E` | 46 | 11 fichiers CSS (Landing, Registration, pages) | `--an-teal-700` |
| `#14B8A6` | 23 | mêmes fichiers (dégradés) | `--an-teal-700` (variante claire décorative) |
| `#A3E635` | 19 | Hero, Pricing, Program, Landing, Feedback, `index.css` | `--an-green-500` |
| `#FFD700` | 18 | Hero, Pricing, Program, Landing | décoratif ; `--an-warning` si porteur de sens |
| `#0A3D2E` | 16 | Landing, FAQ, Visiteurs | `--an-blue-900` (fond sombre) |
| `#6B7280` | 15 | FAQ, Pricing, Program, Dortoir, Identité, Visiteurs | `--an-neutral-500` |
| `#991B1B`, `#EF4444` | 8, 5 | Dortoir, Paiement, `index.css`, Visiteurs | `--an-error` |
| `#10B981`, `#065F46` | 7, 6 | Confirmation, Paiement, `index.css`, Visiteurs | `--an-success` |
| `#E2E8F0`, `#F0FDF4`, `#F9FAFB` | 7, 5, 4 | divers | `--an-neutral-200` / `--an-neutral-50` |

## 3. Typographie
Trois familles chargées depuis Google Fonts : **Plus Jakarta Sans** (texte), **Inter** (`index.css`), **Playfair
Display** (titres décoratifs) + `monospace`. Cible : une famille de texte + une famille de titres au plus (ADR commun).

## 4. Mise en conformité proposée (tâches futures)
1. Redéfinir les variables `:root` sur les tokens communs `--an-*`.
2. Remplacer les couleurs en dur par les variables, écran par écran (Landing, puis Registration).
3. Vérifier les contrastes (texte blanc sur `#14B8A6` ≈ 2,5:1 : insuffisant pour du texte).
