# Rattrapage WEB2 — Océane GOHIER-TALLON

Modules attribués : **F1 · F2 · F3 · B1 · C1 · C2 · I3**

Sujet : MATRiCE (planning pédagogique). Voir énoncé complet fourni par l'enseignant.

## Structure du dépôt

| Dossier | Module(s) | Contenu |
|---|---|---|
| `react-app/` | F1, F2, F3 | Application React unique (planning, filtres, détail, tests) |
| `b1-database/` | B1 | Modélisation BDD, scripts, preuves de concurrence |
| `c1-aws/` | C1 | Dossier d'architecture AWS (document) |
| `c2-cicd/` | C2 | Workflow GitHub Actions + note explicative |
| `i3-flux/` | I3 | Pipeline CLI de normalisation de flux NDJSON |

## Installation et lancement

### F1 / F2 / F3 — Application React

```bash
cd react-app
npm install
npm run dev        # lance l'appli
npm test -- --run   # lance les tests (non interactif)
```

### B1 — Base de données

Voir `b1-database/README.md` (à compléter).

### C1 — AWS

Document uniquement, voir `c1-aws/`.

### C2 — CI/CD

Voir `c2-cicd/.github/workflows/` et `c2-cicd/README.md`.

### I3 — Structuration de flux

```bash
cd i3-flux
node pipeline.js data/seances.ndjson   # ou commande équivalente, voir i3-flux/README.md
```

## Structure utile du projet

```
.
├── react-app/        # F1 + F2 + F3
├── b1-database/       # B1
├── c1-aws/            # C1
├── c2-cicd/           # C2
├── i3-flux/           # I3
├── JUSTIFICATIONS.md
├── SOURCES_IA.md
└── README.md
```

## Preuves

Les preuves (captures, traces, résultats) sont dans les dossiers `preuves/` de chaque module concerné.
