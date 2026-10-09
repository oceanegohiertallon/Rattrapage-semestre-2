# F3 — Protocole de navigation clavier et mesure de contraste

## 1. Navigation clavier

### Protocole (à refaire à la main sur `npm run dev`, sans souris)

| # | Action | Attendu | Vérifié par |
|---|---|---|---|
| 1 | Charger la page, `Tab` | focus sur le select **Groupe** (anneau violet visible) | test *le filtre groupe a un nom accessible…* |
| 2 | `Flèche bas` sur le select | le groupe change sans recharger la page ; le compteur « N séances affichées » est annoncé (`role="status"`) | à la main |
| 3 | `Tab`, `Tab` | **Domaine**, puis **Rechercher une séance** | à la main |
| 4 | `Tab` | titre de la première carte (vrai `<button>`) ; l'anneau entoure toute la carte | test *ouvre le détail au clavier…* |
| 5 | `Entrée` (ou `Espace`) | ouverture du détail, focus sur **Fermer le détail de la séance** | test + `trace-navigateur.txt` |
| 6 | `Tab` répété | le focus tourne dans la modale (×, action), sans jamais repartir sur la page derrière | test (piège à focus) |
| 7 | `Entrée` sur **Confirmer la séance** | le badge du détail **et** celui de la carte passent à « Confirmée » ; le focus reste dans la modale | test *une modification de statut reste cohérente…* |
| 8 | `Échap` | fermeture, focus rendu à la carte d'origine | test + `trace-navigateur.txt` |
| 9 | Séance « Travail autonome » (AUTO) | bouton **Confirmer** désactivé ; la raison est lue par le lecteur d'écran (`aria-describedby`) | test *une séance sans formateur (AUTO)…* |
| 10 | `?scenario=erreur` | bouton **Réessayer** atteignable au `Tab`, annonce `role="alert"` | test *affiche une erreur avec un bouton "Réessayer"…* |

### Noms accessibles

- **Champs de filtre** : `<label htmlFor>` donne « Groupe », « Domaine », « Rechercher une séance ». Le placeholder n'est pas le seul libellé.
- **Carte** : le bouton porte uniquement le titre de la séance (« React composants »), pas tout le contenu de la carte.
- **Modale** : `role="dialog"`, `aria-modal="true"`, nommée par son titre (`aria-labelledby`).
- **Bouton ×** : `aria-label="Fermer le détail de la séance"` ; l'icône SVG est `aria-hidden`.
- **Badges domaine** : un texte caché « Domaine : » donne son sens à « Web » hors contexte.

## 2. Mesure de contraste (WCAG 2.1 AA)

Commande : **`npm run contrast`** (`scripts/contrast.mjs`). Le script :
1. lit les couleurs dans `node_modules/tailwindcss/theme.css` (Tailwind v4 les définit en `oklch`) ;
2. les convertit en sRGB ;
3. applique la formule de luminance relative WCAG.

Seuils : **4,5:1** pour le texte, **3:1** pour les composants d'interface (bordures de champs, icônes, anneau de focus — critère 1.4.11).

Résultat de la commande :

| Élément | Couleurs Tailwind | Hex (sRGB) | Ratio | Seuil AA | Résultat |
|---|---|---|---|---|---|
| Titres h1/h2/h3 | `gray-900` / `white` | `#101828` / `#ffffff` | 17.75:1 | 4.5:1 | ✅ |
| Titre "Séances de la semaine" sur fond de page | `gray-900` / `gray-50` | `#101828` / `#f9fafb` | 17.00:1 | 4.5:1 | ✅ |
| Texte secondaire, compteur, chargement | `gray-600` / `gray-50` | `#4a5565` / `#f9fafb` | 7.24:1 | 4.5:1 | ✅ |
| Texte secondaire sur carte/modale | `gray-600` / `white` | `#4a5565` / `#ffffff` | 7.56:1 | 4.5:1 | ✅ |
| Labels des filtres | `gray-700` / `white` | `#364153` / `#ffffff` | 10.31:1 | 4.5:1 | ✅ |
| Libellés dt des cartes | `gray-500` / `white` | `#6a7282` / `#ffffff` | 4.84:1 | 4.5:1 | ✅ |
| Placeholder de la recherche | `gray-500` / `white` | `#6a7282` / `#ffffff` | 4.84:1 | 4.5:1 | ✅ |
| Badge "Confirmée" / boutons principaux | `white` / `violet-600` | `#ffffff` / `#7f22fe` | 5.88:1 | 4.5:1 | ✅ |
| Bouton principal survolé | `white` / `violet-700` | `#ffffff` / `#7008e7` | 7.29:1 | 4.5:1 | ✅ |
| Badge "Proposée" | `gray-700` / `gray-100` | `#364153` / `#f3f4f6` | 9.37:1 | 4.5:1 | ✅ |
| Accent "MATRiCE" dans le titre | `violet-600` / `white` | `#7f22fe` / `#ffffff` | 5.88:1 | 4.5:1 | ✅ |
| Badge domaine Web | `sky-800` / `sky-50` | `#00598a` / `#f0f9ff` | 7.05:1 | 4.5:1 | ✅ |
| Badge domaine Data | `emerald-800` / `emerald-50` | `#006045` / `#ecfdf5` | 7.19:1 | 4.5:1 | ✅ |
| Badge domaine Cybersécurité | `rose-800` / `rose-50` | `#a50036` / `#fff1f2` | 7.20:1 | 4.5:1 | ✅ |
| Badge domaine Projet | `amber-800` / `amber-50` | `#973c00` / `#fffbeb` | 6.88:1 | 4.5:1 | ✅ |
| Message d'erreur | `gray-700` / `red-50` | `#364153` / `#fef2f2` | 9.43:1 | 4.5:1 | ✅ |
| Icône × de fermeture (composant UI) | `gray-600` / `white` | `#4a5565` / `#ffffff` | 7.56:1 | 3:1 | ✅ |
| Anneau de focus (composant UI) | `violet-600` / `white` | `#7f22fe` / `#ffffff` | 5.88:1 | 3:1 | ✅ |
| Bordure des champs (composant UI) | `gray-500` / `white` | `#6a7282` / `#ffffff` | 4.84:1 | 3:1 | ✅ |

19/19 combinaisons conformes AA.

> **Corrections apportées grâce à la mesure.**
> - La première version utilisait `border-gray-300` pour les champs (1,47:1, non conforme au critère 1.4.11) et `text-gray-400` pour l'icône × (sous 3:1). Les champs passent en `border-gray-500` (4,84:1) et l'icône en `text-gray-600` (7,56:1).
> - Le premier tableau de ce fichier reprenait par erreur les couleurs de Tailwind v3. Les valeurs ci-dessus sont celles de la v4, réellement utilisée.
>
> **Limite.** violet-600 (`oklch(54.1% 0.281 293)`) dépasse légèrement le gamut sRGB. Le script écrête les valeurs, comme un écran sRGB, ce qui donne `#7f22fe`, la valeur hexadécimale publiée par Tailwind. Sur un écran P3, le violet est un peu plus saturé, ce qui ne réduit pas le contraste avec le blanc.

## 3. Le statut ne dépend jamais de la seule couleur

`StatusBadge.jsx` combine :
- une **icône** : coche pour « Confirmée », horloge pour « Proposée » ;
- un **texte** ;
- un **fond différent** : plein violet, ou gris bordé.

En niveaux de gris, ou pour une personne daltonienne, le texte suffit à lui seul. Même principe pour les domaines (`DomainBadge.jsx`) : la couleur n'est qu'un repère, le libellé porte l'information.

## 4. Débordements à 360 px et 1280 px

Mesure dans Chrome (`npm run captures`, voir `trace-navigateur.txt`) : `document.documentElement.scrollWidth - window.innerWidth = 0px` aux deux largeurs.

À 360 px :
- les filtres s'empilent ;
- les cartes passent sur une colonne ;
- les titres longs passent à la ligne (`break-words`) ;
- la modale s'ouvre en panneau bas pleine largeur, avec défilement interne si besoin.
