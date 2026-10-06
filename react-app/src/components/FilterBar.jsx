const GROUPS = [
  { value: '', label: 'Tous les groupes' },
  { value: 'A', label: 'Groupe A' },
  { value: 'B', label: 'Groupe B' },
  { value: 'Promotion', label: 'Promotion entière' },
]

const DOMAINS = [
  { value: '', label: 'Tous les domaines' },
  { value: 'web', label: 'Web' },
  { value: 'data', label: 'Data' },
  { value: 'cyber', label: 'Cybersécurité' },
  { value: 'projet', label: 'Projet' },
]

export function FilterBar({
  group,
  onGroupChange,
  domain,
  onDomainChange,
  search,
  onSearchChange,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="flex-1 min-w-[160px]">
        <label htmlFor="filter-group" className="block text-sm font-medium text-gray-700 mb-1">
          Groupe
        </label>
        <select
          id="filter-group"
          value={group}
          onChange={(e) => onGroupChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          {GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[160px]">
        <label htmlFor="filter-domain" className="block text-sm font-medium text-gray-700 mb-1">
          Domaine
        </label>
        <select
          id="filter-domain"
          value={domain}
          onChange={(e) => onDomainChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          {DOMAINS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-[2] min-w-[200px]">
        <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700 mb-1">
          Rechercher une séance
        </label>
        <input
          id="filter-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Titre, domaine..."
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        />
      </div>
    </div>
  )
}
