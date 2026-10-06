# I3 — Structuration de flux

Module indépendant. Pipeline CLI : lecture → validation → normalisation → déduplication → sortie.

## À faire

- [ ] Recréer `data/seances.ndjson` depuis les deux tableaux du sujet (lignes 1-11 + ligne 12 malformée)
- [ ] Pipeline CLI
- [ ] Sorties : `acceptes.ndjson`, `rejets.ndjson` (+ motif), `stats.json`
- [ ] Invariant : lus = acceptés + rejetés + doublons
- [ ] Tests : valide / invalide / doublon / JSON malformé / fichier vide
- [ ] Commentaire sur l'usage mémoire

## Lancement

```bash
node pipeline.js data/seances.ndjson
```

*(commande à ajuster selon l'implémentation finale)*
