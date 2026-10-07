import { isVisibleForGroup, SESSIONS } from '../data/sessions'

const DEFAULT_DELAY_MS = 400 // simule un vrai temps de réponse réseau

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Volontairement séparée du hook : facile à mocker en test, et remplaçable
// par un vrai fetch() plus tard sans toucher au reste.
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
