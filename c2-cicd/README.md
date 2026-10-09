# C2 — CI/CD

Module indépendant : chaîne CI/CD reproductible pour un front React + Vite
(installation verrouillée, tests bloquants, artefacts versionnés, rollback).

| Livrable | Fichier |
|---|---|
| Workflow GitHub Actions commenté | [`.github/workflows/front-ci-cd.yml`](.github/workflows/front-ci-cd.yml) |
| Note (audit, choix, rollback, limites) | [`note-cicd.md`](note-cicd.md) |
| Traces succès / échec / rollback | [`preuves/`](preuves/) |
| Rejeu local des étapes du workflow | [`simulation/simuler-pipeline.sh`](simulation/simuler-pipeline.sh) |

Le workflow est rangé dans `c2-cicd/.github/workflows/`, et non à la racine du dépôt :
GitHub ne l'exécute donc pas, ce qui respecte le « pas de déploiement GitHub réel » du sujet.

## Rejouer les traces

Prérequis : Git Bash (ou bash Linux/macOS), Node 22.12+, npm. Aucun compte AWS ni GitHub.

```bash
cd c2-cicd
./simulation/simuler-pipeline.sh livrer v1.0.0     # succès
./simulation/simuler-pipeline.sh livrer v1.1.0     # succès
./simulation/simuler-pipeline.sh echec v1.2.0      # test rouge -> code 1, rien livré
./simulation/simuler-pipeline.sh rollback v1.0.0   # retour à l'artefact précédent
```

La cible simulée (`simulation/.cible/`) n'est pas versionnée ; la supprimer pour repartir de zéro.
