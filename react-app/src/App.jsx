import { useState } from 'react'
import { FilterBar } from './components/FilterBar'
import { SessionDetail } from './components/SessionDetail'
import { SessionList } from './components/SessionList'
import { useSessions } from './hooks/useSessions'

function App() {
  const {
    group,
    setGroup,
    domain,
    setDomain,
    search,
    setSearch,
    sessions,
    status,
    error,
    retry,
    updateSessionStatus,
  } = useSessions()

  const [openSessionId, setOpenSessionId] = useState(null)
  const openSession = sessions.find((s) => s.id === openSessionId) ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <h1 className="text-xl font-semibold text-gray-900">
            Planning <span className="text-violet-600">MATRiCE</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Consultez les séances de la semaine, filtrez-les et ouvrez le détail d'une séance.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6 rounded-lg bg-white border border-gray-200 p-4">
          <FilterBar
            group={group}
            onGroupChange={setGroup}
            domain={domain}
            onDomainChange={setDomain}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        <SessionList
          sessions={sessions}
          status={status}
          error={error}
          onRetry={retry}
          onOpenDetail={setOpenSessionId}
        />
      </main>

      {openSession && (
        <SessionDetail
          session={openSession}
          onClose={() => setOpenSessionId(null)}
          onStatusChange={updateSessionStatus}
        />
      )}
    </div>
  )
}

export default App
