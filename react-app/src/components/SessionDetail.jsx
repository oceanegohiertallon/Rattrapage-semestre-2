import { useEffect, useRef } from 'react'
import { TEACHERS } from '../data/sessions'
import { StatusBadge } from './StatusBadge'

export function SessionDetail({ session, onClose, onStatusChange }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  // À l'ouverture : mémorise l'élément qui avait le focus (la carte cliquée)
  // et déplace le focus dans la modale. À la fermeture : rend le focus
  // à cet élément, pour ne jamais perdre le fil au clavier.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement
    closeButtonRef.current?.focus()

    return () => {
      previouslyFocusedRef.current?.focus?.()
    }
  }, [])

  // Fermeture au clavier avec Échap.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!session) return null

  const teacherName = session.teacherId ? TEACHERS[session.teacherId] : 'Aucun formateur'
  const canConfirm = Boolean(session.teacherId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="session-detail-title" className="text-lg font-semibold text-gray-900">
            {session.title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer le détail de la séance"
            className="shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Statut</span>
            <StatusBadge status={session.status} />
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Domaine</span>
            <span className="text-gray-900">{session.domain}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Groupe</span>
            <span className="text-gray-900">{session.group}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Date</span>
            <span className="text-gray-900">
              {session.date} ({session.period === 'am' ? 'matin' : 'après-midi'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Formateur</span>
            <span className="text-gray-900">{teacherName}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          {session.status === 'proposed' && (
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => onStatusChange(session.id, 'confirmed')}
              title={!canConfirm ? 'Un formateur est requis pour confirmer' : undefined}
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              Confirmer la séance
            </button>
          )}
          {session.status === 'confirmed' && (
            <button
              type="button"
              onClick={() => onStatusChange(session.id, 'proposed')}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              Remettre en proposition
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
