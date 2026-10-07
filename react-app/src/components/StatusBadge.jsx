// icône + texte, jamais la couleur seule (daltonisme)
const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmée',
    className: 'bg-violet-600 text-white',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  proposed: {
    label: 'Proposée',
    className: 'bg-gray-100 text-gray-700 border border-gray-300',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .199.079.39.22.53l3.5 3.5a.75.75 0 1 0 1.06-1.06l-3.28-3.28V5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-700',
    icon: null,
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  )
}
