import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
    // scénario du sujet : A (t=0, répond à 800ms) vs B (t=100ms, répond à 200ms)
    loadSessions.mockImplementation(({ group }) => {
      const delay = group === 'A' ? 800 : group === 'B' ? 200 : 0
      return new Promise((resolve) => setTimeout(() => resolve(makeSession(group || 'init')), delay))
    })

    const { result } = renderHook(() => useSessions())

    // laisse le fetch initial (montage) se résoudre
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    // t=0 : groupe A
    act(() => {
      result.current.setGroup('A')
    })

    // t=100 : on change pour B avant que A ait répondu
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    act(() => {
      result.current.setGroup('B')
    })

    // t=800 : B a déjà répondu (t=300), A pas encore
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })

    expect(result.current.sessions).toEqual(makeSession('B'))
    expect(result.current.status).toBe('success')

    // la réponse tardive de A arrive maintenant -> doit être ignorée
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
