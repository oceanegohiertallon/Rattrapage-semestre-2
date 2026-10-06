import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadSessions } from '../api/loadSessions'

/**
 * Centralise l'état du planning : chargement des séances (par groupe),
 * filtres (domaine, recherche texte), gestion des réponses réseau dans
 * le désordre, et modification locale du statut d'une séance.
 */
export function useSessions() {
  const [group, setGroup] = useState('')
  const [domain, setDomain] = useState('')
  const [search, setSearch] = useState('')

  const [sessions, setSessions] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)

  // Compteur de requêtes : on n'accepte que la réponse de la DERNIÈRE requête
  // lancée, pour ignorer les réponses "en retard" (cas B arrivé après A).
  const requestIdRef = useRef(0)

  const fetchSessions = useCallback(async (currentGroup) => {
    const requestId = ++requestIdRef.current
    setStatus('loading')
    setError(null)

    try {
      const data = await loadSessions({ group: currentGroup })

      // Si une requête plus récente a été lancée entre-temps, on jette ce résultat.
      if (requestId !== requestIdRef.current) return

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

  // Filtres domaine + recherche texte appliqués sur les séances déjà chargées
  // (valeur calculée, pas besoin de re-déclencher une requête réseau).
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

  // Modification locale du statut : une seule source de vérité (le tableau
  // `sessions`), donc liste et détail restent automatiquement cohérents.
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
