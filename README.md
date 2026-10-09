# Rattrapage WEB2 — Océane GOHIER--TALLON

Sujet individuel MATRiCE. Modules attribués : **F1 · F2 · F3 · B1 · C1 · C2 · I3**.
Chaque module est indépendant et a son propre dossier, avec ses commandes et ses preuves.

| Module | Dossier | Contenu | Commande principale |
|---|---|---|---|
| F1 React avancé · F2 Tests front · F3 Bibliothèques UI | [`react-app/`](react-app/) | une seule application React + Vite, ses tests et ses preuves | `npm ci && npm run dev` · `npm test` |
| B1 Base de données | [`b1-database/`](b1-database/) | schéma PostgreSQL, opérations, test de concurrence, plans d'exécution | `./scripts/init.sh` · `./tests/test-concurrence.sh` |
| C1 AWS | [`c1-aws/`](c1-aws/) | dossier d'architecture + estimation des coûts à partir des tarifs officiels | `node estimation/estimer-couts.mjs` |
| C2 CI/CD | [`c2-cicd/`](c2-cicd/) | workflow GitHub Actions commenté, note, traces succès/échec/rollback | `./simulation/simuler-pipeline.sh livrer v1.0.0` |
| I3 Structuration de flux | [`i3-flux/`](i3-flux/) | pipeline CLI NDJSON : validation, normalisation, déduplication | `node pipeline.js data/seances.ndjson` · `npm test` |

Choix techniques, alternatives, preuves et limites : [`JUSTIFICATIONS.md`](JUSTIFICATIONS.md) ·
usages de l'IA : [`SOURCES_IA.md`](SOURCES_IA.md).

## Prérequis

| Outil | Version | Modules |
|---|---|---|
| Node.js + npm | **22.12+** (Vitest 5 l'exige ; testé avec 22.15.0) | F1/F2/F3, C1, C2, I3 (I3 seul : Node 20+) |
| PostgreSQL + `psql` | 17 (via `docker compose`, fichier fourni, ou installation locale) | B1 |
| bash | Git Bash sous Windows, ou bash Linux/macOS | B1, C2 (scripts `.sh`) |
| Chrome ou Edge | installé | F3, uniquement pour régénérer les captures |

Aucun compte AWS ni GitHub n'est nécessaire. Aucun secret n'est versionné (`b1-database/.env.example` seulement).

---

## Projet React — F1 + F2 + F3

```bash
cd react-app
npm ci              # installe exactement les versions de package-lock.json
npm run dev         # http://localhost:5173
npm test            # 13 tests, non interactif (vitest run), code ≠ 0 en cas d'échec
```

Scénarios F1 reproductibles dans le navigateur :

| URL | Ce qu'on observe |
|---|---|
| `http://localhost:5173/` | chargement (environ 400 ms), puis les 6 séances |
| `http://localhost:5173/?scenario=erreur` | premier chargement en erreur → bouton **Réessayer** → les séances |
| `http://localhost:5173/?scenario=desordre` | A répond en 800 ms, B en 200 ms : choisir *Groupe A* puis vite *Groupe B* → l'écran reste sur B |

Autres commandes :

```bash
npm run build && npm run preview   # version de production, http://localhost:4173
npm run contrast                   # ratios de contraste WCAG sur les couleurs Tailwind utilisées
npm run captures                   # (avec preview lancé) captures 360/1280 px + scénarios dans Chrome
npm run lint                       # oxlint
```

Index des preuves F1 / F2 / F3 : [`react-app/README.md`](react-app/README.md).

## B1 — Base de données

```bash
cd b1-database
cp .env.example .env && docker compose --env-file .env up -d
set -a; . ./.env; set +a                                        # variables PG* pour psql
./scripts/init.sh                                               # schéma + données du sujet + opérations
psql -X -f sql/06-demo-operations.sql                           # les 5 opérations
psql -X -v ON_ERROR_STOP=1 -f tests/test-entrees-invalides.sql  # 18 refus + 5 acceptations
./tests/test-concurrence.sh                                     # sessions parallèles réelles
./scripts/init.sh --volume && psql -X -f sql/05-explain.sql     # 10 000 séances + plans
```

Détails : [`b1-database/README.md`](b1-database/README.md) · conception : [`b1-database/conception.md`](b1-database/conception.md).

## C1 — AWS

Livrable documentaire : [`c1-aws/dossier-aws.md`](c1-aws/dossier-aws.md). Pour recalculer l'estimation des coûts :

```bash
cd c1-aws/estimation
node --max-old-space-size=4096 estimer-couts.mjs > resultat-estimation.md   # télécharge ~270 Mo la 1re fois
```

## C2 — CI/CD

Workflow : [`c2-cicd/.github/workflows/front-ci-cd.yml`](c2-cicd/.github/workflows/front-ci-cd.yml).
Il est volontairement hors de la racine `.github/`, donc GitHub ne l'exécute pas (pas de déploiement réel).
Note : [`c2-cicd/note-cicd.md`](c2-cicd/note-cicd.md).

```bash
cd c2-cicd
./simulation/simuler-pipeline.sh livrer v1.0.0     # succès
./simulation/simuler-pipeline.sh echec v1.2.0      # test rouge : rien n'est livré, code 1
./simulation/simuler-pipeline.sh rollback v1.0.0   # retour à l'artefact précédent
```

## I3 — Structuration de flux

```bash
cd i3-flux
node pipeline.js data/seances.ndjson sortie   # -> sortie/acceptes.ndjson, rejets.ndjson, stats.json
npm test                                      # 25 tests (node --test), aucune dépendance à installer
```

Détails : [`i3-flux/README.md`](i3-flux/README.md).

## Structure du dépôt

```
.
├── README.md · JUSTIFICATIONS.md · SOURCES_IA.md
├── react-app/        F1 · F2 · F3  (src/, tests, scripts/, preuves/)
├── b1-database/      B1  (sql/, tests/, scripts/, preuves/, conception.md, docker-compose.yml)
├── c1-aws/           C1  (dossier-aws.md, estimation/)
├── c2-cicd/          C2  (.github/workflows/, simulation/, preuves/, note-cicd.md)
└── i3-flux/          I3  (data/, src/, tests/, preuves/, pipeline.js)
```
