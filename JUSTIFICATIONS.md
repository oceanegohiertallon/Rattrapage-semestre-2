# Justifications techniques

Pour chaque module : ce que j'ai choisi, pourquoi, ce que j'ai écarté, les preuves et les limites.

---

## F1 — React avancé

**Choix**
- Tout l'état du planning est dans un seul hook, `useSessions`. `App.jsx` reste simple, et la logique se teste sans afficher l'interface.
- `loadSessions({ group })` est passée en paramètre au hook. On peut donc la remplacer facilement par un mock en test, ou par les scénarios `?scenario=erreur` et `?scenario=desordre`.
- **Réponses dans le désordre** : chaque requête a un numéro. Quand une réponse arrive, on l'ignore si ce n'est pas la dernière requête lancée. Dans l'exemple du sujet, la réponse de A arrive après celle de B, donc elle est ignorée : l'écran reste sur B.

**État, valeurs calculées, effets, nettoyage, clés**
- **État** : seulement le nécessaire (filtres, séances, statut du chargement, erreur, statuts modifiés).
- **Valeurs calculées** : la liste filtrée (`useMemo`), la séance ouverte (retrouvée par son id) et le compteur. Elles ne sont jamais stockées, donc jamais désynchronisées.
- **Effet** : quand le groupe change, on recharge les séances.
- **Nettoyage** : quand le groupe change, la requête en cours devient obsolète. Dans la modale, les écouteurs clavier sont retirés à la fermeture.
- **Clés** : `key={session.id}`, jamais l'index (qui change à chaque filtrage).

**Cohérence liste / détail** : le détail n'est pas une copie, il est retrouvé dans la liste par son id. Un statut modifié est gardé à part (par id) et appliqué à la liste, donc il reste aussi après un rechargement.

**Écarté** : `AbortController`, car `loadSessions` est une simulation sans vraie requête à annuler ; une bibliothèque comme TanStack Query, car elle cacherait ce que F1 évalue.

**Preuves** : un test pour les filtres combinés ; un test pour le désordre, avec de faux timers ; la mesure dans Chrome (`react-app/preuves/trace-navigateur.txt`).

**Limites**
- Pas de cache.
- Les statuts modifiés sont perdus si on recharge la page (pas de backend).
- 2 avertissements du linter, sans conséquence.

---

## F2 — Tests front

**Choix** : Vitest + Testing Library. Vitest fonctionne directement avec Vite. Les tests cherchent les éléments comme un utilisateur (par rôle et par libellé), ce qui vérifie aussi l'accessibilité. Le chargeur est remplacé dans les tests pour contrôler les délais et les erreurs.

**Tableau des scénarios** (13 tests)

| Scénario | Entrée | Attente | Risque couvert |
|---|---|---|---|
| Chargement | ouverture de l'app | message « Chargement… » | écran vide pendant la requête |
| Succès | chargement normal | les 6 séances | données non affichées |
| A + Promotion | groupe A | s01, s03, s06 visibles, s02 absente | règle du sujet cassée |
| Filtres combinés | B + projet + « revue » | seulement s05 | filtres qui s'écrasent |
| Résultat vide | recherche sans résultat | message + bouton « Réinitialiser » | page blanche |
| Erreur + nouvelle tentative | 1er chargement en échec | alerte, puis « Réessayer » affiche les séances | erreur sans issue |
| Désordre | A (800 ms) puis B (200 ms) | l'écran montre B | ancienne réponse qui écrase la nouvelle |
| Accessibilité du filtre | touche `Tab` | « Groupe » a un nom et reçoit le focus | filtre inutilisable au clavier |
| Détail au clavier | `Tab`, `Entrée`, `Échap` | focus dans la modale, puis rendu à la carte | focus perdu |
| Détail = carte | clic sur une carte | mêmes informations | mauvais détail affiché |
| Statut cohérent | confirmer s04 | « Confirmée » dans le détail et sur la carte | deux vues différentes |
| AUTO | ouvrir s06 | bouton « Confirmer » désactivé | règle « confirmation = formateur » cassée |

**Configuration** : `vite.config.js` (bloc `test`) ; dépendances verrouillées par `package-lock.json` ; commande non interactive `npm test` (= `vitest run`).

**Rouge puis vert** : avec 2 bugs volontaires (protection anti-désordre retirée, règle Promotion retirée), 3 tests deviennent rouges. Après correction, les 13 passent. Traces dans `react-app/preuves/`.

**Limites** : les tests tournent dans un faux navigateur (jsdom) ; les flèches du clavier sur une liste déroulante ne peuvent pas y être testées, je les ai vérifiées à la main.

---

## F3 — Bibliothèques UI

**Choix** : Tailwind CSS v4. Le style est écrit directement dans le HTML, et je garde la main sur l'accessibilité (pas de composants tout faits).

**Trois décisions**
1. **Carte / détail** : la carte montre l'essentiel (titre, statut, domaine, groupe, formateur). Le détail ajoute la date et les actions. Sur mobile, le détail s'ouvre en bas de l'écran.
2. **Statuts lisibles** : chaque badge a une icône, un texte et une couleur. On le comprend même sans voir les couleurs. Tous les contrastes sont conformes (19/19, `npm run contrast`).
3. **Accès aux actions** :
   - toute la carte est cliquable, et le bouton porte le titre de la séance ;
   - la modale met le focus sur « Fermer », garde le focus à l'intérieur, se ferme avec `Échap` et rend le focus à la carte ;
   - les états vide et erreur proposent toujours un bouton.

**Preuves** : captures à 360 px et 1280 px, aucun débordement horizontal, protocole clavier et tableau de contraste dans `react-app/preuves/`.

**Ce que la mesure a corrigé** : la bordure des champs et la croix de fermeture étaient trop pâles ; mon premier tableau de contraste utilisait les couleurs de Tailwind v3 au lieu de v4.

**Limites** : pas de test avec un vrai lecteur d'écran, pas de mode sombre.

---

## B1 — Base de données

Détails : [`b1-database/conception.md`](b1-database/conception.md).

- **PostgreSQL plutôt que MongoDB** : les données sont liées entre elles (formateurs, semaines, séances, acquis), et la règle principale compare plusieurs séances. Une base relationnelle le gère naturellement.
- **Un formateur ne peut pas avoir deux séances sur le même créneau** : c'est garanti par un index unique dans la base. Si deux personnes affectent le même formateur en même temps, la deuxième attend, puis elle est refusée.
- **Écarté** : vérifier dans le code avant d'écrire. Ce n'est pas fiable, car les deux requêtes peuvent vérifier en même temps et écrire toutes les deux (le test le montre).
- **Toutes les règles sont dans la base** : valeurs autorisées, AUTO sans formateur, confirmation avec formateur.
- **Preuves** : test de concurrence avec de vraies sessions, 18 entrées invalides refusées, résultats des requêtes, plans d'exécution sur 10 000 séances.
- **Limites** : rien n'empêche un même groupe d'avoir deux séances en même temps (non demandé) ; la durée d'une séance est fixée à 3 h 30.

## C1 — AWS

Détails : [`c1-aws/dossier-aws.md`](c1-aws/dossier-aws.md).

- **Choix** : API Gateway + Lambda (environ 25 $/mois) plutôt qu'un serveur EC2 (environ 109 $/mois). Avec peu d'utilisateurs, payer un serveur allumé en permanence ne vaut pas le coup. Le défaut : la première requête après une pause est plus lente (environ 1 s).
- **Front** sur S3 + CloudFront ; **base** RDS PostgreSQL, la plus petite instance.
- **Sécurité** : la base n'est pas accessible depuis Internet, il n'y a pas de mot de passe dans le code, chaque service a ses propres droits limités.
- **Coûts** calculés à partir des tarifs officiels AWS, avec leur date.
- **Limites** : les volumes sont des estimations ; rien n'a été déployé.

## C2 — CI/CD

Détails : [`c2-cicd/note-cicd.md`](c2-cicd/note-cicd.md).

- **Principe** : on construit et on teste une seule fois, puis on livre exactement ce qui a été testé.
- **Un test rouge bloque la livraison.** Chaque version est archivée, ce qui permet de revenir à la précédente.
- **Sécurité** : droits minimaux, aucun secret stocké, le code venant de l'extérieur (fork) ne peut pas déployer.
- **Preuves** : le workflow est validé par actionlint ; 5 traces réelles (succès, échec bloquant, retour arrière…).
- **Limites** : le workflow n'a pas tourné sur GitHub (interdit par le sujet) ; le déploiement est simulé par des dossiers locaux.

## I3 — Structuration de flux

Détails : [`i3-flux/README.md`](i3-flux/README.md).

- **Node, sans dépendance**, comme le projet React.
- Le fichier est **lu ligne par ligne** : une ligne fausse est rejetée avec son numéro et la raison, puis on continue.
- On **valide avant de retirer les doublons**, comme demandé : si la première occurrence d'un id est invalide, la suivante peut quand même être acceptée.
- **Même fichier = même résultat** : les dates sont vérifiées par calcul, sans dépendre du fuseau horaire de la machine.
- **Mémoire** : le fichier n'est jamais chargé en entier ; on garde seulement la liste des id déjà acceptés.
- **Preuves** : 12 lignes lues = 6 acceptées + 4 rejetées + 2 doublons ; 25 tests verts.
- **Limites** : avec des dizaines de millions d'id différents, la liste ne tiendrait plus en mémoire.
