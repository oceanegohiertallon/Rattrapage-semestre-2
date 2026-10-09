# C2 — CI/CD

Une chaîne automatique pour livrer le front React : installation, tests, construction, livraison et retour en arrière.

| Fichier | Contenu |
|---|---|
| [`.github/workflows/front-ci-cd.yml`](.github/workflows/front-ci-cd.yml) | le workflow GitHub Actions, commenté |
| [`note-cicd.md`](note-cicd.md) | la note explicative |
| `preuves/` | les traces de succès, d'échec et de retour arrière |
| `simulation/simuler-pipeline.sh` | rejoue les étapes du workflow en local |

Le workflow est rangé dans ce dossier, pas à la racine du dépôt. GitHub ne l'exécute donc pas, ce qui respecte la consigne « pas de déploiement réel ».

## Rejouer les traces

Il faut bash, Node 22.12+ et npm. Aucun compte n'est nécessaire.

```bash
cd c2-cicd
./simulation/simuler-pipeline.sh livrer v1.0.0     # succès
./simulation/simuler-pipeline.sh livrer v1.1.0     # succès
./simulation/simuler-pipeline.sh echec v1.2.0      # un test échoue : rien n'est livré
./simulation/simuler-pipeline.sh rollback v1.0.0   # retour à la version précédente
```
