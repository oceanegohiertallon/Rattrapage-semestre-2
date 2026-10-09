import { createReadStream, createWriteStream, mkdirSync, writeFileSync } from 'node:fs'
import { once } from 'node:events'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { InvalidLine, normalizeRecord } from './normalize.js'

// lecture -> validation -> normalisation -> déduplication -> sortie
//
// Usage mémoire : le fichier est lu en FLUX, ligne par ligne (readline). On ne garde
// jamais le fichier entier : seulement la ligne courante, les compteurs et l'ensemble
// des id déjà acceptés (nécessaire pour détecter les doublons). La mémoire croît donc
// avec le nombre d'id DISTINCTS acceptés, pas avec la taille du fichier : quelques
// dizaines d'octets par id, soit ~ 100 Mo pour un million d'id. Les sorties sont
// écrites au fil de l'eau (en respectant la contre-pression des flux d'écriture).
export async function runPipeline(inputPath, outDir) {
  mkdirSync(outDir, { recursive: true })
  const accepted = createWriteStream(join(outDir, 'acceptes.ndjson'), 'utf8')
  const rejected = createWriteStream(join(outDir, 'rejets.ndjson'), 'utf8')

  const stats = { lus: 0, acceptes: 0, rejets: 0, doublons: 0 }
  const seenIds = new Set()

  const lines = createInterface({ input: createReadStream(inputPath, 'utf8'), crlfDelay: Infinity })

  for await (const rawLine of lines) {
    stats.lus++
    const sourceLine = stats.lus
    // BOM UTF-8 éventuel (fichier enregistré sous Windows) : ne rend pas la 1re ligne invalide
    const line = sourceLine === 1 ? rawLine.replace(/^﻿/, '') : rawLine

    try {
      if (line.trim() === '') throw new InvalidLine('ligne vide')

      let raw
      try {
        raw = JSON.parse(line)
      } catch {
        throw new InvalidLine('JSON malformé')
      }

      // validation AVANT déduplication : une ligne invalide ne « réserve » pas son id
      const record = normalizeRecord(raw)

      if (seenIds.has(record.id)) {
        stats.doublons++
        continue
      }
      seenIds.add(record.id)
      stats.acceptes++
      await write(accepted, { source_line: sourceLine, ...record })
    } catch (err) {
      if (!(err instanceof InvalidLine)) throw err // vrai bug : on ne le masque pas en « rejet »
      stats.rejets++
      await write(rejected, { source_line: sourceLine, motif: err.message, contenu: line })
    }
  }

  accepted.end()
  rejected.end()
  await Promise.all([once(accepted, 'finish'), once(rejected, 'finish')])

  if (stats.lus !== stats.acceptes + stats.rejets + stats.doublons) {
    throw new Error(`invariant violé : ${JSON.stringify(stats)}`)
  }
  writeFileSync(join(outDir, 'stats.json'), JSON.stringify(stats, null, 2) + '\n', 'utf8')
  return stats
}

async function write(stream, obj) {
  if (!stream.write(JSON.stringify(obj) + '\n')) await once(stream, 'drain')
}
