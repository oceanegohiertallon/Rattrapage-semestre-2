// Mesure de contraste WCAG 2.1 sur les couleurs Tailwind v4 réellement utilisées.
// Lance : npm run contrast
// Les couleurs sont lues dans node_modules/tailwindcss/theme.css (format oklch),
// converties en sRGB (OKLab -> sRGB linéaire, valeurs hors gamut écrêtées),
// puis comparées avec la formule de luminance relative WCAG.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const themePath = join(dirname(require.resolve('tailwindcss/package.json')), 'theme.css')
const theme = readFileSync(themePath, 'utf8')

function tw(name) {
  if (name === 'white') return [1, 1, 1]
  const match = theme.match(new RegExp(`--color-${name}: oklch\\(([\\d.]+)% ([\\d.]+) ([\\d.]+)\\)`))
  if (!match) throw new Error(`Couleur introuvable : ${name}`)
  const [L, C, h] = [match[1] / 100, Number(match[2]), (match[3] * Math.PI) / 180]
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clip = (v) => Math.min(1, Math.max(0, v))
  // sRGB linéaire = directement ce qu'utilise la luminance WCAG
  return [
    clip(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clip(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clip(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

function toHex(linear) {
  const encode = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
  return '#' + linear.map((v) => Math.round(encode(v) * 255).toString(16).padStart(2, '0')).join('')
}

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b

function ratio(fg, bg) {
  const [l1, l2] = [luminance(tw(fg)), luminance(tw(bg))].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// [élément, texte/icône, fond, seuil AA]
const PAIRS = [
  ['Titres h1/h2/h3', 'gray-900', 'white', 4.5],
  ['Titre "Séances de la semaine" sur fond de page', 'gray-900', 'gray-50', 4.5],
  ['Texte secondaire, compteur, chargement', 'gray-600', 'gray-50', 4.5],
  ['Texte secondaire sur carte/modale', 'gray-600', 'white', 4.5],
  ['Labels des filtres', 'gray-700', 'white', 4.5],
  ['Libellés dt des cartes', 'gray-500', 'white', 4.5],
  ['Placeholder de la recherche', 'gray-500', 'white', 4.5],
  ['Badge "Confirmée" / boutons principaux', 'white', 'violet-600', 4.5],
  ['Bouton principal survolé', 'white', 'violet-700', 4.5],
  ['Badge "Proposée"', 'gray-700', 'gray-100', 4.5],
  ['Accent "MATRiCE" dans le titre', 'violet-600', 'white', 4.5],
  ['Badge domaine Web', 'sky-800', 'sky-50', 4.5],
  ['Badge domaine Data', 'emerald-800', 'emerald-50', 4.5],
  ['Badge domaine Cybersécurité', 'rose-800', 'rose-50', 4.5],
  ['Badge domaine Projet', 'amber-800', 'amber-50', 4.5],
  ['Message d\'erreur', 'gray-700', 'red-50', 4.5],
  ['Icône × de fermeture (composant UI)', 'gray-600', 'white', 3],
  ['Anneau de focus (composant UI)', 'violet-600', 'white', 3],
  ['Bordure des champs (composant UI)', 'gray-500', 'white', 3],
]

let failures = 0
console.log('| Élément | Couleurs Tailwind | Hex (sRGB) | Ratio | Seuil AA | Résultat |')
console.log('|---|---|---|---|---|---|')
for (const [label, fg, bg, threshold] of PAIRS) {
  const r = ratio(fg, bg)
  const ok = r >= threshold
  if (!ok) failures++
  console.log(
    `| ${label} | \`${fg}\` / \`${bg}\` | \`${toHex(tw(fg))}\` / \`${toHex(tw(bg))}\` | ${r.toFixed(2)}:1 | ${threshold}:1 | ${ok ? '✅' : '❌'} |`,
  )
}
console.log(`\n${PAIRS.length - failures}/${PAIRS.length} combinaisons conformes AA.`)
