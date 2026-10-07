import { DOMAIN_LABELS } from '../data/sessions'

// le libellé porte l'information, la couleur n'est qu'un repère visuel
const DOMAIN_STYLES = {
  web: 'bg-sky-50 text-sky-800 border-sky-200',
  data: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cyber: 'bg-rose-50 text-rose-800 border-rose-200',
  projet: 'bg-amber-50 text-amber-800 border-amber-200',
}

export function DomainBadge({ domain }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${DOMAIN_STYLES[domain] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}
    >
      <span className="sr-only">Domaine : </span>
      {DOMAIN_LABELS[domain] ?? domain}
    </span>
  )
}
