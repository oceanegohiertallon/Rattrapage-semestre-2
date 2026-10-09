# C1 — AWS

Module indépendant, document uniquement : aucun compte ni déploiement AWS réel.

| Livrable | Fichier |
|---|---|
| Dossier (3 à 5 pages) : 2 architectures, EC2/S3/Lambda, schéma, IAM, secrets, sauvegardes, logs, alertes, retour arrière, protocoles, RPO/RTO | [`dossier-aws.md`](dossier-aws.md) |
| Estimation détaillée par poste, avec sources datées | [`estimation/resultat-estimation.md`](estimation/resultat-estimation.md) |
| Script de calcul (tarifs officiels AWS Price List API) | [`estimation/estimer-couts.mjs`](estimation/estimer-couts.mjs) |

## Refaire l'estimation

Prérequis : Node 18+ (utilise `fetch`). Pas de compte AWS : l'API de tarification est publique.

```bash
cd c1-aws/estimation
node --max-old-space-size=4096 estimer-couts.mjs > resultat-estimation.md
```

La première exécution télécharge environ 270 Mo de fichiers d'offres (dont environ 250 Mo pour EC2) dans
`estimation/.cache/`, qui n'est pas versionné. Les volumes supposés sont en tête du script (`VOLUMES`).
Les tarifs AWS évoluent : la sortie indique la date de publication de chaque fichier utilisé.
