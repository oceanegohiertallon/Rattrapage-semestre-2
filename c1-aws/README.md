# C1 — AWS

Un document qui propose une architecture AWS pour MATRiCE. Aucun compte ni déploiement réel n'est utilisé.

| Fichier | Contenu |
|---|---|
| [`dossier-aws.md`](dossier-aws.md) | le dossier : architectures comparées, schéma, sécurité, sauvegardes, coûts, incidents |
| [`estimation/resultat-estimation.md`](estimation/resultat-estimation.md) | le détail des coûts, ligne par ligne |
| `estimation/estimer-couts.mjs` | le script qui calcule les coûts à partir des tarifs officiels AWS |

## Refaire le calcul des coûts

Il faut Node 18 ou plus. Aucun compte AWS : les tarifs sont publics.

```bash
cd c1-aws/estimation
node --max-old-space-size=4096 estimer-couts.mjs > resultat-estimation.md
```

La première fois, le script télécharge environ 270 Mo de fichiers de tarifs. Les prix changent avec le temps ; la date de chaque tarif est indiquée dans le résultat.
