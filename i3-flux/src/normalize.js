// Validation + normalisation d'UNE ligne. Fonction pure : même entrée -> même sortie,
// aucune dépendance à l'horloge ni au fuseau horaire de la machine.

const PERIODS = { matin: 'am', am: 'am', 'après-midi': 'pm', 'apres-midi': 'pm', pm: 'pm' }
const STATUSES = { proposed: 'proposed', propose: 'proposed', confirmed: 'confirmed', confirme: 'confirmed' }
const GROUPS = new Set(['A', 'B', 'Promotion'])
const MODES = new Set(['DG', 'CE', 'AUTO'])
const TEACHERS = new Set(['t1', 't2', 't3'])

// Erreur de validation : son message devient le « motif » écrit dans rejets.ndjson
export class InvalidLine extends Error {}

function fail(motif) {
  throw new InvalidLine(motif)
}

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${field} manquant ou vide`)
  return value.trim()
}

// YYYY-MM-DD ou DD/MM/YYYY -> YYYY-MM-DD, en vérifiant que la date existe.
// Calcul arithmétique, sans new Date(texte) : le fuseau de la machine n'intervient pas.
export function normalizeDate(value) {
  if (typeof value !== 'string') fail('date manquante')
  let year, month, day
  let match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    ;[year, month, day] = match.slice(1).map(Number)
  } else if ((match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) {
    ;[day, month, year] = match.slice(1).map(Number)
  } else {
    fail(`date au format inconnu : ${value}`)
  }
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
    fail(`date inexistante : ${value}`)
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function normalizeRecord(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) fail("la ligne n'est pas un objet JSON")

  const id = nonEmptyString(raw.id, 'id')
  const date = normalizeDate(raw.date)

  const period = PERIODS[raw.period]
  if (!period) fail(`période invalide : ${raw.period}`)

  if (!GROUPS.has(raw.group)) fail(`groupe invalide : ${raw.group}`)
  if (!MODES.has(raw.mode)) fail(`mode invalide : ${raw.mode}`)

  const title = nonEmptyString(raw.title, 'title')
  const domain = nonEmptyString(raw.domain, 'domain')

  // champ absent traité comme null ; toute autre valeur doit être t1/t2/t3
  const teacherId = raw.teacherId ?? null
  if (teacherId !== null && !TEACHERS.has(teacherId)) fail(`teacherId invalide : ${raw.teacherId}`)

  const status = STATUSES[raw.status]
  if (!status) fail(`statut invalide : ${raw.status}`)

  // règles métier croisées
  if (raw.mode === 'AUTO' && (teacherId !== null || status !== 'proposed')) {
    fail('AUTO exige teacherId null et status proposed')
  }
  if (status === 'confirmed' && teacherId === null) fail('confirmed exige un formateur')

  // ordre des clés fixe -> sortie identique d'une exécution à l'autre
  return { id, date, period, group: raw.group, mode: raw.mode, title, domain, teacherId, status }
}
