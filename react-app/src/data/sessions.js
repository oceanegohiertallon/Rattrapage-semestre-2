// Jeu de données fourni par le sujet MATRiCE.
// Règles : A affiche A + Promotion ; B affiche B + Promotion.
// AUTO impose teacherId nul et status "proposed". Une confirmation exige un formateur.

export const TEACHERS = {
  t1: 'Camille Exemple',
  t2: 'Alex Démonstration',
  t3: 'Sam Fictif',
}

export const SESSIONS = [
  {
    id: 's01',
    date: '2026-10-19',
    period: 'am',
    group: 'A',
    mode: 'DG',
    title: 'React composants',
    domain: 'web',
    teacherId: 't1',
    status: 'confirmed',
  },
  {
    id: 's02',
    date: '2026-10-19',
    period: 'am',
    group: 'B',
    mode: 'DG',
    title: 'React événements',
    domain: 'web',
    teacherId: 't2',
    status: 'confirmed',
  },
  {
    id: 's03',
    date: '2026-10-19',
    period: 'pm',
    group: 'Promotion',
    mode: 'CE',
    title: 'Données et SQL',
    domain: 'data',
    teacherId: 't1',
    status: 'confirmed',
  },
  {
    id: 's04',
    date: '2026-10-20',
    period: 'am',
    group: 'A',
    mode: 'DG',
    title: 'Authentification',
    domain: 'cyber',
    teacherId: 't2',
    status: 'proposed',
  },
  {
    id: 's05',
    date: '2026-10-20',
    period: 'am',
    group: 'B',
    mode: 'DG',
    title: 'Revue de projet',
    domain: 'projet',
    teacherId: 't3',
    status: 'proposed',
  },
  {
    id: 's06',
    date: '2026-10-20',
    period: 'pm',
    group: 'Promotion',
    mode: 'AUTO',
    title: 'Travail autonome',
    domain: 'projet',
    teacherId: null,
    status: 'proposed',
  },
]

/**
 * Détermine si une séance est visible pour un groupe donné.
 * Règle du sujet : A affiche A + Promotion ; B affiche B + Promotion.
 * Pas de filtre groupe (undefined/'') => tout est visible.
 */
export function isVisibleForGroup(session, group) {
  if (!group) return true
  if (group === 'Promotion') return session.group === 'Promotion'
  return session.group === group || session.group === 'Promotion'
}
