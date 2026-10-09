# F3 — Navigation au clavier et contrastes

## 1. Navigation au clavier

À refaire sur `npm run dev`, sans utiliser la souris :

| Étape | Action | Résultat attendu |
|---|---|---|
| 1 | `Tab` | le focus va sur le filtre **Groupe** |
| 2 | `Flèche bas` | le groupe change, la liste se met à jour |
| 3 | `Tab`, `Tab` | **Domaine**, puis **Rechercher** |
| 4 | `Tab` | la première carte est entourée |
| 5 | `Entrée` | le détail s'ouvre, le focus est sur **Fermer** |
| 6 | `Tab` plusieurs fois | le focus reste dans la fenêtre de détail |
| 7 | `Entrée` sur **Confirmer** | le statut change dans le détail et sur la carte |
| 8 | `Échap` | le détail se ferme, le focus revient sur la carte |
| 9 | ouvrir « Travail autonome » | **Confirmer** est désactivé, avec une explication |
| 10 | `?scenario=erreur` | le bouton **Réessayer** est accessible au clavier |

Les étapes 1, 4, 5, 6, 7, 8, 9 et 10 sont aussi vérifiées automatiquement par les tests.

**Noms accessibles** : chaque filtre a un vrai `<label>` ; le bouton × s'appelle « Fermer le détail de la séance » ; la fenêtre de détail porte le titre de la séance.

## 2. Contrastes (norme WCAG AA)

Commande : `npm run contrast`. Le script lit les vraies couleurs de Tailwind v4 et calcule les ratios.

Seuils : **4,5** pour le texte, **3** pour les éléments d'interface (bordures, icônes).

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

**Corrections faites grâce à cette mesure** : la bordure des champs (ratio de 1,47) et la croix de fermeture étaient trop claires, elles ont été foncées. Mon premier tableau utilisait les couleurs de Tailwind v3 par erreur.

## 3. Statut compréhensible sans la couleur

Chaque badge de statut a une icône (coche ou horloge) et un texte (« Confirmée » ou « Proposée »). On le comprend même en noir et blanc.

## 4. Pas de débordement

Mesuré dans Chrome (`trace-navigateur.txt`) : **0 px** de défilement horizontal, à 360 px comme à 1280 px.
