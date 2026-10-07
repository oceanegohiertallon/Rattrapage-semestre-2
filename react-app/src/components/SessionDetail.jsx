import { useEffect, useRef } from 'react'
import { GROUP_LABELS, TEACHERS } from '../data/sessions'
import { DomainBadge } from './DomainBadge'
import { StatusBadge } from './StatusBadge'

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function SessionDetail({ session, onClose, onStatusChange }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  // garde le focus précédent pour le rendre à la fermeture
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement
    closeButtonRef.current?.focus()

    return () => {
      previouslyFocusedRef.current?.focus?.()
    }
  }, [])

  // après "Confirmer" / "Remettre", le bouton cliqué disparaît : on garde le focus dans la modale
  useEffect(() => {
    if (!dialogRef.current?.contains(document.activeElement)) {
      closeButtonRef.current?.focus()
    }
  }, [session?.status])

  // Échap ferme la modale, Tab reste piégé dedans
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return

      const focusables = dialogRef.current.querySelectorAll(FOCUSABLE)
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-t-lg bg-white p-6 shadow-xl sm:rounded-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="session-detail-title" className="min-w-0 break-words text-lg font-semibold text-gray-900">
            {session.title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer le détail de la séance"
            className="shrink-0 rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-medium text-gray-600">Statut</dt>
            <dd>
              <StatusBadge status={session.status} />
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-medium text-gray-600">Domaine</dt>
            <dd>
              <DomainBadge domain={session.domain} />
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="font-medium text-gray-600">Groupe</dt>
            <dd className="text-gray-900">{GROUP_LABELS[session.group] ?? session.group}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="font-medium text-gray-600">Date</dt>
            <dd className="text-gray-900">
              {session.date} ({session.period === 'am' ? 'matin' : 'après-midi'})
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="font-medium text-gray-600">Formateur</dt>
            <dd className="text-gray-900">{teacherName}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col items-stretch gap-2 sm:items-end">
          {session.status === 'proposed' && (
            <>
              <button
                type="button"
                disabled={!canConfirm}
                aria-describedby={!canConfirm ? 'confirm-hint' : undefined}
                onClick={() => onStatusChange(session.id, 'confirmed')}
                className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-600"
              >
                Confirmer la séance
              </button>
              {!canConfirm && (
                <p id="confirm-hint" className="text-sm text-gray-600">
                  Un formateur est requis pour confirmer.
                </p>
              )}
            </>
          )}
          {session.status === 'confirmed' && (
            <button
              type="button"
              onClick={() => onStatusChange(session.id, 'proposed')}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
            >
              Remettre en proposition
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
