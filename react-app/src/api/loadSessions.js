import { isVisibleForGroup, SESSIONS } from '../data/sessions'

// Délai par défaut pour simuler une vraie requête réseau.
const DEFAULT_DELAY_MS = 400

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Charge les séances, filtrées par groupe, avec un délai artificiel.
 *
 * Interchangeable : signature pensée pour qu'on puisse remplacer cette
 * implémentation (données locales) par un vrai fetch() vers une API,
 * sans rien changer côté composants/hook qui l'appellent.
 * C'est aussi ce qui permet de la mocker facilement dans les tests (F2).
 *
 * @param {Object} params
 * @param {string} [params.group] - 'A' | 'B' | 'Promotion' | undefined (= tout afficher)
 * @param {number} [params.delayMs] - délai artificiel en ms (par défaut 400ms)
 * @param {boolean} [params.simulateError] - force une erreur (pour tester le cas d'erreur)
 * @returns {Promise<Array>} la liste des séances visibles pour ce groupe
 */
export async function loadSessions({
  group,
  delayMs = DEFAULT_DELAY_MS,
  simulateError = false,
} = {}) {
  await wait(delayMs)

  if (simulateError) {
    throw new Error('Impossible de charger les séances. Veuillez réessayer.')
  }

  return SESSIONS.filter((session) => isVisibleForGroup(session, group))
}
