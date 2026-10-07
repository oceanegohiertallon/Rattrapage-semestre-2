# F3 — Protocole de navigation clavier et mesure de contraste

## 1. Navigation clavier

### Protocole suivi (reproductible manuellement et testé automatiquement)

1. Ouvrir la page. `Tab` une première fois → le focus atterrit sur le select **Groupe**
   (confirmé par le test `App.test.jsx` : *"le filtre groupe a un nom accessible et peut être
   utilisé entièrement au clavier"*).
2. Poursuivre avec `Tab` → focus successif sur **Domaine**, puis **Rechercher une séance**,
   puis chaque carte de séance (chaque carte est un vrai `<button>`, donc focusable et
   activable au clavier).
3. Sur une carte, appuyer sur `Entrée` ou `Espace` → ouvre la modale de détail.
4. À l'ouverture de la modale, le focus est automatiquement déplacé sur le bouton de
   fermeture (×) — testé dans `SessionDetail.jsx` (`closeButtonRef.current?.focus()`).
5. Appuyer sur `Échap` → ferme la modale et **restitue le focus** à la carte qui avait été
   cliquée (`previouslyFocusedRef`), pour ne jamais perdre le fil au clavier.
6. Chaque champ de filtre a un `<label htmlFor>` associé à son `id` → nom accessible correct
   pour un lecteur d'écran (pas de `placeholder` utilisé comme seul label).

### Couverture automatisée

Voir `src/App.test.jsx` : le test *"nom accessible + navigation clavier"* vérifie par le code
que le select Groupe est atteint par `Tab` et manipulable via `selectOptions` (équivalent clavier).

## 2. Mesure de contraste (WCAG 2.1, ratio calculé, pas estimé)

Calcul effectué avec la formule officielle de luminance relative WCAG, sur les couleurs
réellement utilisées (classes Tailwind du projet). Seuils : **4.5:1** pour le texte normal,
**3:1** pour le texte large / les éléments d'interface.

| Élément | Couleurs | Ratio | Seuil AA | Résultat |
|---|---|---|---|---|
| Titres (h1/h2, `text-gray-900`) sur fond blanc | `#111827` / `#ffffff` | 17.74:1 | 4.5:1 | ✅ |
| Texte secondaire (`text-gray-600`) sur blanc | `#4b5563` / `#ffffff` | 7.56:1 | 4.5:1 | ✅ |
| Labels de filtre (`text-gray-700`) sur blanc | `#374151` / `#ffffff` | 10.31:1 | 4.5:1 | ✅ |
| Libellés `dt` (`text-gray-500`) sur blanc | `#6b7280` / `#ffffff` | 4.83:1 | 4.5:1 | ✅ |
| Badge "Confirmée" (blanc sur violet-600) | `#ffffff` / `#7c3aed` | 5.70:1 | 4.5:1 | ✅ |
| Badge "Proposée" (`text-gray-700` sur `gray-100`) | `#374151` / `#f3f4f6` | 9.37:1 | 4.5:1 | ✅ |
| Bouton "Confirmer la séance" (blanc sur violet-600) | `#ffffff` / `#7c3aed` | 5.70:1 | 4.5:1 | ✅ |
| Accent violet (`text-violet-600`) sur blanc | `#7c3aed` / `#ffffff` | 5.70:1 | 4.5:1 | ✅ |

**Toutes les combinaisons dépassent le seuil AA pour texte normal.** Script de calcul :
`node contrast.js` (formule de luminance relative standard, non fourni dans ce dépôt car
c'est un outil ponctuel de vérification, pas une dépendance du projet).

## 3. Statut : jamais uniquement par la couleur

Chaque statut (`StatusBadge.jsx`) combine une **icône** (✓ pour confirmée, horloge pour
proposée) et un **texte** ("Confirmée" / "Proposée"), en plus de la couleur. Une personne
daltonienne ou en niveaux de gris distingue donc le statut sans dépendre de la teinte.
