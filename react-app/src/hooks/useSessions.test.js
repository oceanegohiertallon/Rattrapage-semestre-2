import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSessions } from '../api/loadSessions'
import { useSessions } from './useSessions'

vi.mock('../api/loadSessions', () => ({
  loadSessions: vi.fn(),
}))

function makeSession(group) {
  return [{ id: `s-${group}`, title: `Séance ${group}`, group, domain: 'web', teacherId: 't1', status: 'confirmed' }]
}

describe('useSessions - réponses réseau dans le désordre', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('affiche toujours les données de la dernière requête lancée (B), même si sa réponse arrive avant celle d\'une requête plus ancienne (A) qui répond plus tard', async () => {
    vi.useFakeTimers()
    // Scénario du sujet :
    // A lancé à t=0 répond à 800ms ; B lancé à t=100ms répond à 200ms (donc à t=300ms).
    // À t=800ms, l'écran doit toujours représenter B.
    loadSessions.mockImplementation(({ group }) => {
      const delay = group === 'A' ? 800 : group === 'B' ? 200 : 0
      return new Promise((resolve) => setTimeout(() => resolve(makeSession(group || 'init')), delay))
    })

    const { result } = renderHook(() => useSessions())

    // Laisse la requête initiale (montage, group='') se résoudre.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    // t=0 : on sélectionne le groupe A.
    act(() => {
      result.current.setGroup('A')
    })

    // t=100 : on change pour le groupe B avant que A ait répondu.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    act(() => {
      result.current.setGroup('B')
    })

    // On avance jusqu'à t=800 (B a eu le temps de répondre à t=300, A pas encore à ce stade).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })

    expect(result.current.sessions).toEqual(makeSession('B'))
    expect(result.current.status).toBe('success')

    // On avance encore pour laisser la réponse tardive de A arriver (t=800+) :
    // elle doit être ignorée, l'écran doit toujours montrer B.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    expect(result.current.sessions).toEqual(makeSession('B'))
  })

  it('passe par un état "loading" pendant le chargement', async () => {
    vi.useFakeTimers()
    loadSessions.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 300)))

    const { result } = renderHook(() => useSessions())

    expect(result.current.status).toBe('loading')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(result.current.status).toBe('success')
  })

  it('passe en état "error" en cas d\'échec, puis repasse en succès après une nouvelle tentative (retry)', async () => {
    loadSessions
      .mockRejectedValueOnce(new Error('Erreur réseau simulée'))
      .mockResolvedValueOnce(makeSession('A'))

    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toMatch(/Erreur réseau simulée/)

    act(() => {
      result.current.retry()
    })

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.sessions).toEqual(makeSession('A'))
  })
})
