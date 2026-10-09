#!/usr/bin/env node
// Usage : node pipeline.js <entree.ndjson> [dossier_sortie]
// Sortie par défaut : ./sortie  (acceptes.ndjson, rejets.ndjson, stats.json)
import { existsSync } from 'node:fs'
import { runPipeline } from './src/pipeline.js'

const [inputPath, outDir = 'sortie'] = process.argv.slice(2)

if (!inputPath) {
  console.error('Usage : node pipeline.js <entree.ndjson> [dossier_sortie]')
  process.exit(2)
}
if (!existsSync(inputPath)) {
  console.error(`Fichier introuvable : ${inputPath}`)
  process.exit(2)
}

const stats = await runPipeline(inputPath, outDir)
console.log(`${inputPath} -> ${outDir}/`)
console.log(JSON.stringify(stats))
