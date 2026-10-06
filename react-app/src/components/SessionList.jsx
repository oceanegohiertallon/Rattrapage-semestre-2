import { SessionCard } from './SessionCard'

export function SessionList({ sessions, status, error, onRetry, onOpenDetail }) {
  if (status === 'loading') {
    return (
      <div role="status" className="py-12 text-center text-gray-500">
        <svg
          className="mx-auto size-6 animate-spin text-violet-600"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
          />
        </svg>
        <p className="mt-2">Chargement des séances…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div role="alert" className="py-12 text-center">
        <p className="text-gray-900 font-medium">Une erreur est survenue</p>
        <p className="mt-1 text-sm text-gray-600">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (status === 'success' && sessions.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>Aucune séance ne correspond à ces filtres.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} onOpenDetail={onOpenDetail} />
      ))}
    </div>
  )
}
