import { loadSessions } from './loadSessions'

// Loaders alternatifs pour reproduire les cas F1 dans le navigateur,
// via l'URL : ?scenario=erreur ou ?scenario=desordre

// 1er appel en échec, les suivants réussissent -> erreur puis "Réessayer"
function createErrorThenSuccessLoader() {
  let calls = 0
  return (params) => {
    calls++
    return loadSessions({ ...params, simulateError: calls === 1 })
  }
}

// délais du sujet : A répond en 800 ms, B en 200 ms
function outOfOrderLoader(params) {
  const delayMs = params.group === 'A' ? 800 : params.group === 'B' ? 200 : 400
  return loadSessions({ ...params, delayMs })
}

export function getLoaderFromUrl(search = window.location.search) {
  const scenario = new URLSearchParams(search).get('scenario')
  if (scenario === 'erreur') return createErrorThenSuccessLoader()
  if (scenario === 'desordre') return outOfOrderLoader
  return loadSessions
}
