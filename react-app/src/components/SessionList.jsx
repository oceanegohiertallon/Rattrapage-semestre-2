import { SessionCard } from './SessionCard'

function Results({ sessions, status, error, onRetry, onOpenDetail, onResetFilters }) {
  if (status === 'loading') {
    return (
      <div className="py-12 text-center text-gray-600">
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
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center">
        <p className="font-medium text-gray-900">Une erreur est survenue</p>
        <p className="mt-1 text-sm text-gray-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-gray-600">
        <p>Aucune séance ne correspond à ces filtres.</p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
        >
          Réinitialiser les filtres
        </button>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <li key={session.id}>
          <SessionCard session={session} onOpenDetail={onOpenDetail} />
        </li>
      ))}
    </ul>
  )
}

export function SessionList(props) {
  const { sessions, status } = props
  const count = sessions.length

  return (
    <section aria-labelledby="sessions-title">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sessions-title" className="text-base font-semibold text-gray-900">
          Séances de la semaine
        </h2>
        {/* annoncé aux lecteurs d'écran à chaque changement de filtre */}
        <p role="status" className="text-sm text-gray-600">
          {status === 'loading' && 'Chargement…'}
          {status === 'success' && `${count} séance${count > 1 ? 's' : ''} affichée${count > 1 ? 's' : ''}`}
        </p>
      </div>
      <Results {...props} />
    </section>
  )
}
