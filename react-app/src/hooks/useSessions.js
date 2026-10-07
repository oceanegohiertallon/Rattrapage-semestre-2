import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadSessions as defaultLoader } from '../api/loadSessions'

// Tout l'état du planning est ici : filtres, chargement, erreurs, statuts.
// Permet de tester la logique sans avoir à monter l'UI.
// `loader` est interchangeable (vrai fetch, mock de test, scénario de démo).
export function useSessions(loader = defaultLoader) {
  const [group, setGroup] = useState('')
  const [domain, setDomain] = useState('')
  const [search, setSearch] = useState('')

  const [sessions, setSessions] = useState([])
  const [status, setStatus] = useState('loading') // loading | success | error
  const [error, setError] = useState(null)

  // statuts modifiés localement, par id : survivent à un rechargement
  const [statusOverrides, setStatusOverrides] = useState({})

  // sert à ignorer les réponses "en retard" (ex: A répond après B)
  const requestIdRef = useRef(0)

  const fetchSessions = useCallback(
    async (currentGroup) => {
      const requestId = ++requestIdRef.current
      setStatus('loading')
      setError(null)

      try {
        const data = await loader({ group: currentGroup })

        if (requestId !== requestIdRef.current) return // plus la requête la plus récente, on jette

        setSessions(data)
        setStatus('success')
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        setError(err.message || 'Erreur inconnue')
        setStatus('error')
      }
    },
    [loader],
  )

  useEffect(() => {
    fetchSessions(group)
    // nettoyage : la requête en vol devient obsolète (changement de groupe ou démontage)
    return () => {
      requestIdRef.current++
    }
  }, [group, fetchSessions])

  const retry = useCallback(() => {
    fetchSessions(group)
  }, [group, fetchSessions])

  // domaine/recherche : filtrés côté client, pas besoin de recharger
  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sessions
      .map((s) => (statusOverrides[s.id] ? { ...s, status: statusOverrides[s.id] } : s))
      .filter((session) => {
        const matchesDomain = !domain || session.domain === domain
        const matchesSearch =
          !query ||
          session.title.toLowerCase().includes(query) ||
          session.domain.toLowerCase().includes(query)
        return matchesDomain && matchesSearch
      })
  }, [sessions, statusOverrides, domain, search])

  // une seule source de vérité -> liste et détail restent toujours synchro
  const updateSessionStatus = useCallback(
    (sessionId, newStatus) => {
      const session = sessions.find((s) => s.id === sessionId)
      // règle du sujet : une confirmation exige un formateur
      if (newStatus === 'confirmed' && !session?.teacherId) return
      setStatusOverrides((prev) => ({ ...prev, [sessionId]: newStatus }))
    },
    [sessions],
  )

  return {
    // filtres
    group,
    setGroup,
    domain,
    setDomain,
    search,
    setSearch,
    // données + état réseau
    sessions: filteredSessions,
    status,
    error,
    retry,
    // actions
    updateSessionStatus,
  }
}
