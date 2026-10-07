import { GROUP_LABELS, TEACHERS } from '../data/sessions'
import { DomainBadge } from './DomainBadge'
import { StatusBadge } from './StatusBadge'

export function SessionCard({ session, onOpenDetail }) {
  const teacherName = session.teacherId ? TEACHERS[session.teacherId] : 'Aucun formateur'

  // le bouton du titre s'étend sur toute la carte (after:inset-0) :
  // toute la surface est cliquable, mais le nom accessible reste le titre seul
  return (
    <article className="relative h-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:shadow-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-600 has-[:focus-visible]:ring-offset-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 font-semibold text-gray-900">
          <button
            type="button"
            onClick={() => onOpenDetail(session.id)}
            className="text-left break-words after:absolute after:inset-0 after:rounded-lg focus:outline-none"
          >
            {session.title}
          </button>
        </h3>
        <StatusBadge status={session.status} />
      </div>
      <div className="mt-2">
        <DomainBadge domain={session.domain} />
      </div>
      <dl className="mt-3 space-y-1 text-sm text-gray-600">
        <div className="flex flex-wrap gap-x-1">
          <dt className="font-medium text-gray-500">Groupe :</dt>
          <dd>{GROUP_LABELS[session.group] ?? session.group}</dd>
        </div>
        <div className="flex flex-wrap gap-x-1">
          <dt className="font-medium text-gray-500">Formateur :</dt>
          <dd>{teacherName}</dd>
        </div>
      </dl>
    </article>
  )
}
