# Rattrapage WEB2 — Océane GOHIER--TALLON

Sujet MATRiCE. Modules : **F1 · F2 · F3 · B1 · C1 · C2 · I3**. Chaque module a son dossier.

| Module | Dossier |
|---|---|
| F1 · F2 · F3 — application React | [`react-app/`](react-app/) |
| B1 — base de données | [`b1-database/`](b1-database/) |
| C1 — AWS | [`c1-aws/`](c1-aws/) |
| C2 — CI/CD | [`c2-cicd/`](c2-cicd/) |
| I3 — flux de données | [`i3-flux/`](i3-flux/) |

Mes choix : [`JUSTIFICATIONS.md`](JUSTIFICATIONS.md) · usage de l'IA : [`SOURCES_IA.md`](SOURCES_IA.md).

## Prérequis

- **Node.js 22.12 ou plus** (avec npm)
- **PostgreSQL 17** pour B1 (un `docker-compose.yml` est fourni)
- **bash** pour les scripts `.sh` (Git Bash sous Windows)

Aucun compte AWS ou GitHub n'est nécessaire, et aucun secret n'est dans le dépôt.

## F1 · F2 · F3 — Application React

```bash
cd react-app
npm ci          # installation
npm run dev     # lancement : http://localhost:5173
npm test        # 13 tests
```

Pour voir les cas difficiles dans le navigateur :
- `http://localhost:5173/?scenario=erreur` : une erreur, puis le bouton « Réessayer » ;
- `http://localhost:5173/?scenario=desordre` : choisir Groupe A puis vite Groupe B, l'écran reste sur B.

## B1 — Base de données

```bash
cd b1-database
cp .env.example .env
docker compose --env-file .env up -d
set -a; . ./.env; set +a
./scripts/init.sh                                               # crée la base
psql -X -f sql/06-demo-operations.sql                           # les 5 opérations
psql -X -v ON_ERROR_STOP=1 -f tests/test-entrees-invalides.sql  # entrées refusées
./tests/test-concurrence.sh                                     # test de concurrence
```

## C1 — AWS

Le livrable est le document [`c1-aws/dossier-aws.md`](c1-aws/dossier-aws.md). Pour refaire le calcul des coûts :

```bash
cd c1-aws/estimation
node --max-old-space-size=4096 estimer-couts.mjs
```

## C2 — CI/CD

Le workflow est dans [`c2-cicd/.github/workflows/`](c2-cicd/.github/workflows/front-ci-cd.yml). Il est placé hors de la racine, donc GitHub ne l'exécute pas, comme le demande le sujet. Pour rejouer les étapes en local :

```bash
cd c2-cicd
./simulation/simuler-pipeline.sh livrer v1.0.0     # succès
./simulation/simuler-pipeline.sh echec v1.2.0      # échec : rien n'est livré
./simulation/simuler-pipeline.sh rollback v1.0.0   # retour à la version précédente
```

## I3 — Flux de données

```bash
cd i3-flux
node pipeline.js data/seances.ndjson sortie   # crée sortie/acceptes.ndjson, rejets.ndjson, stats.json
npm test                                      # 25 tests
```

## Structure

```
.
├── react-app/     F1 · F2 · F3
├── b1-database/   B1
├── c1-aws/        C1
├── c2-cicd/       C2
└── i3-flux/       I3
```

Chaque dossier contient son propre `README.md` et un dossier `preuves/` (sauf C1, qui est un document).
