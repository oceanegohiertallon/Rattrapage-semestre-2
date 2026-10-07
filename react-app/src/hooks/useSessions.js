import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadSessions } from '../api/loadSessions'

// Tout l'état du planning est ici : filtres, chargement, erreurs, statuts.
// Permet de tester la logique sans avoir à monter l'UI.
export function useSessions() {
  const [group, setGroup] = useState('')
  const [domain, setDomain] = useState('')
  const [search, setSearch] = useState('')

  const [sessions, setSessions] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)

  // sert à ignorer les réponses "en retard" (ex: A répond après B)
  const requestIdRef = useRef(0)

  const fetchSessions = useCallback(async (currentGroup) => {
    const requestId = ++requestIdRef.current
    setStatus('loading')
    setError(null)

    try {
      const data = await loadSessions({ group: currentGroup })

      if (requestId !== requestIdRef.current) return // plus la requête la plus récente, on jette

      setSessions(data)
      setStatus('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err.message || 'Erreur inconnue')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchSessions(group)
  }, [group, fetchSessions])

  const retry = useCallback(() => {
    fetchSessions(group)
  }, [group, fetchSessions])

  // domaine/recherche : filtrés côté client, pas besoin de recharger
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesDomain = !domain || session.domain === domain
      const matchesSearch =
        !search ||
        session.title.toLowerCase().includes(search.toLowerCase()) ||
        session.domain.toLowerCase().includes(search.toLowerCase())
      return matchesDomain && matchesSearch
    })
  }, [sessions, domain, search])

  // une seule source de vérité -> liste et détail restent toujours synchro
  const updateSessionStatus = useCallback((sessionId, newStatus) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s)),
    )
  }, [])

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
