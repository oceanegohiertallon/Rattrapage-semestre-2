# Justifications techniques

Pour chaque module : choix, alternatives écartées, preuves et limites. Les modules B1, C1 et C2
ont un document détaillé dans leur dossier ; cette page en résume l'essentiel.

---

## F1 — React avancé

Code : `react-app/src/hooks/useSessions.js`, `src/api/loadSessions.js`, `src/api/demoScenarios.js`, `src/App.jsx`.

### Choix

- **Un hook `useSessions` centralise l'état** : filtres, chargement, erreur, statuts. `App.jsx` reste un simple assemblage, et la logique se teste sans monter toute l'interface.
- **`loadSessions({ group })` est interchangeable.** Le hook la reçoit en paramètre (`useSessions(loader)`, `<App loader>`). Le vrai chargeur, un mock de test et les scénarios de démonstration (`?scenario=erreur`, `?scenario=desordre`) sont trois implémentations d'une même interface.
- **Réponses dans le désordre.** Chaque requête reçoit un numéro (`requestIdRef`). Au retour, la réponse est ignorée si elle n'est plus la dernière demandée. Dans le scénario du sujet (A lancé à t=0 répond à 800 ms, B lancé à t=100 ms répond à 200 ms), la réponse de A arrive après celle de B et elle est jetée : à t=800 ms, l'écran montre toujours B.

### État local, valeurs calculées, effets, nettoyage, clés

| Notion | Où | Pourquoi |
|---|---|---|
| **État local** | `group`, `domain`, `search`, `sessions`, `status`, `error`, `statusOverrides` (hook) ; `openSessionId` (App) | le strict minimum ; tout le reste s'en déduit |
| **Valeurs calculées** | la liste affichée (`useMemo` : statuts modifiés appliqués, puis filtres domaine et recherche) ; la séance ouverte (`sessions.find(id)`) ; le compteur « N séances affichées » | jamais copiées dans un état : impossible qu'elles se désynchronisent |
| **Effet** | changer de groupe relance `loadSessions` | le groupe est le seul filtre côté « serveur » ; domaine et recherche filtrent en local, sans rechargement |
| **Nettoyage** | le `return` de l'effet incrémente `requestIdRef` : la requête en vol devient obsolète si le groupe change ou si le composant disparaît. Dans la modale, nettoyage des écouteurs clavier et restitution du focus | aucune mise à jour d'état par une réponse périmée |
| **Clés stables** | `key={session.id}` | l'index du tableau changerait à chaque filtrage et mélangerait l'état des cartes |

**Cohérence liste / détail.** Le détail n'a pas de copie de la séance : il est retrouvé par son id dans la liste calculée. Une modification de statut passe par `statusOverrides`, une table « id → statut » appliquée au moment du calcul. Elle survit donc aussi à un rechargement (changement de groupe). La règle « une confirmation exige un formateur » est vérifiée dans le hook, pas seulement par le bouton désactivé.

### Alternatives écartées

- **`AbortController`** pour annuler la requête. Pas retenu : `loadSessions` est une simulation locale (pas un vrai `fetch`), donc il n'y a rien à annuler côté réseau. Le numéro de requête suffit et marche aussi avec un loader qui ne sait pas s'annuler. Avec un vrai `fetch`, on combinerait les deux.
- **Bibliothèque de cache (TanStack Query)**. Elle gère nativement le désordre et le cache, mais elle masquerait justement ce que F1 évalue.
- **Reducer / contexte global.** Disproportionné pour un seul écran ; le hook reste lisible.

### Preuves

- Scénario « filtres combinés » : test *combine les filtres groupe + domaine + recherche texte* (B, puis projet, puis « revue » : 1 séance). À la main : *Groupe B*, *Domaine Projet*, rechercher « revue ».
- Scénario « réponses dans le désordre » :
  - test du hook avec de faux timers ;
  - à la main avec `?scenario=desordre` ;
  - mesure dans un vrai Chrome dans `react-app/preuves/trace-navigateur.txt` (à t≈800 ms le filtre est sur B et les cartes sont celles de B, toujours B après la réponse de A).

### Limites

- Pas de cache : chaque changement de groupe recharge.
- Les statuts modifiés sont en mémoire, ils sont perdus au rechargement de la page (il n'y a pas de backend, par définition du sujet).
- `oxlint` signale 2 avertissements dans `useSessions.js`. L'un concerne `setStatus('loading')` dans l'effet ; l'autre `requestIdRef.current` utilisé dans le nettoyage, ce qui est voulu ici car ce ref est un compteur, pas un nœud DOM.

---

## F2 — Tests front

Code : `react-app/src/App.test.jsx` (10 tests), `src/hooks/useSessions.test.js` (3 tests).

### Choix

- **Vitest + Testing Library + user-event.** Vitest s'intègre nativement à Vite : la configuration tient en un bloc `test` dans `vite.config.js`. Les tests interrogent l'interface comme une personne (rôles, libellés), ce qui teste aussi l'accessibilité.
- **Le chargeur est injecté** (mock ou chargeur instantané) pour contrôler précisément les délais, les erreurs et l'ordre des réponses, impossibles à garantir avec de vrais timers.
- **Faux timers** (`vi.useFakeTimers`) pour le désordre réseau : on avance le temps à 0, 100 et 800 ms exactement comme dans l'énoncé.

### Tableau des scénarios

| Scénario | Entrée | Attente | Risque couvert |
|---|---|---|---|
| Chargement | montage de l'app | « Chargement des séances… » visible, puis disparaît | écran vide ou figé pendant la requête |
| Succès | chargement normal | les 6 séances et « 6 séances affichées » | données non affichées après réponse |
| A inclut Promotion | groupe = A | s01, s03, s06 visibles ; s02 absente | règle « A affiche A + Promotion » cassée |
| Filtres combinés | B, puis domaine projet, puis « revue » | s05 seule, « 1 séance affichée » | filtres qui s'écrasent au lieu de se combiner |
| Résultat vide | recherche sans correspondance | message « Aucune séance… », puis « Réinitialiser » rétablit la liste | page blanche, impasse sans action |
| Erreur puis nouvelle tentative (UI) | chargeur qui échoue une fois | `role="alert"` avec le message, puis « Réessayer » → séances, chargeur appelé 2 fois | erreur silencieuse, bouton sans effet |
| Erreur puis nouvelle tentative (hook) | rejet puis succès | `status` passe à error, puis success | état d'erreur jamais réinitialisé |
| Réponses dans le désordre | A : 800 ms à t=0 ; B : 200 ms à t=100 ms | à t=800 ms, données de B ; toujours B après la réponse de A | réponse périmée qui écrase la plus récente |
| Nom accessible + clavier | `Tab` puis sélection | « Groupe » trouvé par son rôle et son nom, focus au premier `Tab`, filtrage appliqué | filtre inutilisable au lecteur d'écran ou au clavier |
| Détail au clavier | `Tab` ×4, `Entrée`, `Tab`, `Échap` | focus sur « Fermer », piégé dans la modale, rendu à la carte | perte du focus, navigation clavier cassée |
| Détail = carte | clic sur une carte | même formateur, domaine, statut | détail d'une autre séance |
| Statut liste/détail | confirmer s04, puis changer de groupe | « Confirmée » dans le détail et sur la carte, conservé après rechargement | deux vues divergentes |
| AUTO non confirmable | ouvrir s06 | bouton désactivé, raison lue par le lecteur d'écran | violation de la règle « confirmation = formateur » |

### Configuration et exécution

- `vite.config.js` (environnement `jsdom`, fichier `src/test/setup.js` pour les matchers jest-dom).
- Dépendances verrouillées par `package-lock.json` (`npm ci`).
- Commande non interactive : `npm test` = `vitest run`. Elle s'arrête d'elle-même et renvoie un code ≠ 0 en cas d'échec ; c'est la commande utilisée par le workflow C2.

### Preuve rouge / vert

Deux bugs volontaires :
- la garde anti-désordre est commentée ;
- la règle Promotion est retirée.

Résultat : **3 tests rouges** (désordre, A + Promotion, filtres combinés), les 10 autres restent verts. Après restauration des deux lignes : **13/13 verts**. Traces dans `react-app/preuves/tests-ROUGE-avant-correction.txt` et `tests-VERT-apres-correction.txt`.

### Limites

- Tout tourne dans `jsdom`, pas dans un vrai navigateur. Le comportement réel (focus, débordements, désordre) est vérifié à part par `npm run captures` dans Chrome, mais ce n'est pas une suite end-to-end complète.
- Un `<select>` natif ne se pilote pas aux flèches dans `jsdom`. Le test clavier vérifie le focus au `Tab` puis utilise `selectOptions` ; les flèches sont vérifiées à la main (protocole F3).
- Les tests d'intégration utilisent le vrai chargeur (400 ms), d'où une suite d'environ 20 s ; les plus récents utilisent un chargeur instantané.

---

## F3 — Bibliothèques UI

Code : `react-app/src/components/*`, Tailwind CSS v4.

### Choix de la bibliothèque

**Tailwind CSS v4.**
- Les classes utilitaires gardent le style à côté du balisage, sans fichier CSS à maintenir.
- La palette par défaut permet de mesurer les contrastes.
- Il n'y a pas de composants « boîte noire » : le HTML reste sémantique et on contrôle l'accessibilité.

MUI apporterait des composants accessibles tout faits, mais plus lourds, et le sujet évalue justement la maîtrise du focus et des noms accessibles.

### Trois décisions

1. **Hiérarchie carte / détail.**
   - La carte montre ce qui sert à parcourir le planning : titre (`h3`), badge de statut, badge de domaine, groupe, formateur.
   - Le détail (modale) ajoute la date, la demi-journée et les actions.
   - La liste est une vraie liste (`ul`/`li`) sous un titre « Séances de la semaine » (`h2`), et le compteur est annoncé aux lecteurs d'écran (`role="status"`).
   - Sur mobile, la modale devient un panneau en bas, pleine largeur, avec défilement interne.
2. **Lisibilité des statuts.**
   - Chaque badge combine **icône + texte + forme** : plein violet pour « Confirmée », gris bordé avec une horloge pour « Proposée ». Il reste compréhensible en niveaux de gris ou pour une personne daltonienne.
   - Le domaine a son propre badge, dont le libellé porte l'information.
   - Tous les contrastes sont conformes AA (19/19, mesurés par `npm run contrast`).
3. **Accès aux actions.**
   - Le titre de chaque carte est un vrai `<button>` étendu à toute la carte (`after:inset-0`). Toute la surface est cliquable, mais le nom accessible reste le titre seul, et le HTML est valide : la première version mettait un `h3` et un `dl` dans un bouton, ce qui est interdit.
   - La modale :
     - place le focus sur « Fermer » ;
     - piège `Tab` ;
     - se ferme avec `Échap` ;
     - rend le focus à la carte ;
     - garde le focus en son sein après « Confirmer ».
   - Le bouton « Confirmer » désactivé explique pourquoi (`aria-describedby`, texte visible).
   - Les états vide et erreur proposent toujours une action (« Réinitialiser les filtres », « Réessayer »).

### Preuves

- Captures réelles à 360 px et 1280 px, liste et détail : `react-app/preuves/capture-*.png`.
- Débordement horizontal mesuré dans Chrome : **0 px** aux deux largeurs (`trace-navigateur.txt`).
- Protocole clavier et tableau de contraste : `react-app/preuves/protocole-clavier-contraste.md`.

**La mesure a corrigé deux défauts.**
- La bordure des champs (gray-300, 1,47:1) et l'icône × (gray-400) étaient sous le seuil de 3:1 exigé pour les composants d'interface (critère WCAG 1.4.11).
- Le premier tableau de contraste utilisait par erreur les couleurs de Tailwind **v3**, alors que le projet est en v4 (couleurs en `oklch`). Le script lit désormais les vraies valeurs dans `node_modules/tailwindcss/theme.css`.

### Limites

- Pas d'audit par un lecteur d'écran réel (NVDA, VoiceOver). Les noms accessibles sont vérifiés par les tests (rôles et noms) et par la lecture du code.
- Pas de mode sombre.

---

## B1 — Base de données

Détail complet : [`b1-database/conception.md`](b1-database/conception.md).

- **PostgreSQL plutôt que MongoDB.** Les données sont reliées (formateur, semaine, séance, acquis) et la règle principale est une contrainte d'unicité **entre** entités. Le relationnel la garantit nativement. En documentaire, imbriquer les séances dans la semaine rend cette unicité impossible, et la reporter dans l'application ne tient pas sous concurrence.
- **Règle du créneau.** Elle repose sur l'index unique partiel `(formateur_id, date, periode) WHERE formateur_id IS NOT NULL`. Une seconde transaction sur la même clé attend la fin de la première, puis échoue (`23505`), quel que soit le niveau d'isolation. Alternatives écartées :
  - `SELECT … FOR UPDATE` : il ne verrouille pas les lignes qui n'existent pas encore ;
  - `SERIALIZABLE` : l'application doit rejouer les transactions, et une transaction oubliée contourne la règle ;
  - verrou applicatif : il ne protège que le code qui pense à le prendre ;
  - contrainte d'exclusion : inutile pour des créneaux discrets.
- **Toutes les règles sont dans le schéma** : valeurs autorisées (`CHECK`), AUTO sans formateur, confirmation avec formateur, semaine déduite de la date (colonne générée + clé étrangère).
- **Preuves** :
  - concurrence réelle : la session 2 est bloquée environ 2 s puis refusée ; sur une rafale de 3 tentatives, 1 seule réussit ; un contre-exemple sans index montre la double affectation ;
  - 18 entrées invalides refusées, chacune avec le SQLSTATE attendu ;
  - résultats des 5 opérations ;
  - plans `EXPLAIN ANALYZE` commentés sur 10 000 séances.
- **Limites** :
  - pas de contrainte sur le chevauchement des **groupes** (absente du sujet) ;
  - durée fixée par défaut à 3 h 30 ;
  - preuves produites avec PostgreSQL 17.6 local et non avec le conteneur, mais les scripts sont identiques.

## C1 — AWS

Détail complet : [`c1-aws/dossier-aws.md`](c1-aws/dossier-aws.md).

- **API Gateway + Lambda (retenue) contre ALB + EC2.** Environ **25 $/mois** contre environ **109 $/mois**. Pour 20 requêtes/s en pointe et une activité concentrée sur les heures de formation, payer un load balancer, une NAT Gateway et une instance allumés en continu ne se justifie pas. Le défaut accepté est le démarrage à froid d'environ 1 s.
- **Front** sur S3 privé + CloudFront dans les deux cas. **Base** : RDS PostgreSQL `db.t4g.micro` Single-AZ. Le Multi-AZ ajouterait 15,80 $/mois (+62 %) pour une bascule que le RTO de 4 h n'exige pas.
- **Sécurité** :
  - pas de sous-réseau public ni de NAT ;
  - la base se connecte par jeton IAM, donc sans mot de passe applicatif ;
  - un rôle IAM par usage, avec OIDC pour la CI ;
  - MFA obligatoire, aucun compte partagé.
- **Coûts** calculés par un script à partir de l'API publique de tarification AWS (région Paris), avec la date de publication de chaque fichier source. On peut les recalculer.
- **Limites** : volumes supposés (à remplacer par des mesures), prix à la demande sans offre gratuite, durées de démarrage à froid et de restauration à mesurer.

## C2 — CI/CD

Détail complet : [`c2-cicd/note-cicd.md`](c2-cicd/note-cicd.md).

- **On construit une fois et on livre l'artefact construit.** Le job `validate` installe (`npm ci`), audite, teste et construit, puis produit un artefact versionné avec son empreinte SHA-256. Le job `deploy` ne reconstruit rien : il contrôle l'empreinte, publie, lance un smoke test et revient automatiquement en arrière en cas d'échec.
- **Rollback** : le même job `deploy`, alimenté par une version archivée de façon immuable. Le chemin de retour est donc exercé à chaque livraison.
- **Contributions non fiables** :
  - on utilise `pull_request` et non `pull_request_target` : le code d'un fork n'accède à aucun secret ;
  - `persist-credentials: false` ;
  - `npm ci --ignore-scripts` ;
  - le déploiement est exclu des PR.
- **Permissions** : `contents: read` par défaut, `id-token: write` uniquement pour le déploiement (OIDC, aucune clé stockée).
- **Preuves** :
  - le workflow passe actionlint sans erreur ;
  - 5 traces réelles produites par un script qui exécute les mêmes commandes : 2 succès, 1 échec qui bloque la livraison, 1 rollback, 1 refus de republier une version existante.
- **Limites** : le workflow n'a jamais tourné sur GitHub (le sujet l'exclut) ; S3 et CloudFront sont simulés par des dossiers locaux ; le smoke test vérifie la disponibilité et la version, pas le fonctionnement métier.

## I3 — Structuration de flux

Code : `i3-flux/src/normalize.js`, `src/pipeline.js`, `pipeline.js`.

- **Node, sans dépendance.** Même outillage que le projet React ; `readline` et `node:test` suffisent.
- **Lecture en flux, ligne par ligne.** Une ligne fautive (JSON malformé, valeur invalide) devient un rejet avec son numéro de ligne, son motif et son contenu brut, et la lecture continue.
- **Valider avant de dédupliquer.** Une première occurrence invalide ne « réserve » pas son id, et la première occurrence **valide** est retenue. Un test vérifie précisément ce cas : il échoue si on inverse l'ordre des étapes.
- **Déterminisme.**
  - Les dates sont validées par calcul (mois, années bissextiles) et jamais par `new Date(texte)`, qui dépend du fuseau de la machine.
  - L'ordre des clés est fixe en sortie.
  - Un test compare les sorties octet par octet sous trois fuseaux (UTC, UTC+14, UTC-8).
- **Usage mémoire.** Le fichier n'est jamais chargé en entier : seuls la ligne courante, les compteurs et l'ensemble des id acceptés restent en mémoire. La mémoire croît avec le nombre d'id distincts (environ 100 Mo pour un million), pas avec la taille du fichier. Les sorties sont écrites au fil de l'eau, en respectant la contre-pression.
- **Choix d'interprétation.**
  - Une ligne vide au milieu du fichier est comptée comme lue puis rejetée (« ligne vide »), pour respecter l'invariant `lus = acceptes + rejets + doublons`. Le saut de ligne final ne compte pas comme une ligne.
  - Un BOM UTF-8 et des fins de ligne Windows sont acceptés.
- **Preuves** : sur le jeu du sujet, **12 lus = 6 acceptés + 4 rejets + 2 doublons** ; 25 tests verts (valide, invalide, doublon, JSON malformé, fichier vide, plus déterminisme). Voir `i3-flux/preuves/`.
- **Limites.**
  - L'ensemble des id grandit sans limite. Au-delà de plusieurs dizaines de millions d'id, il faudrait un tri externe ou un stockage sur disque (SQLite).
  - Le domaine n'est pas contrôlé contre une liste, car le sujet n'en fixe pas.
