import { TEACHERS } from '../data/sessions'
import { StatusBadge } from './StatusBadge'

export function SessionCard({ session, onOpenDetail }) {
  const teacherName = session.teacherId ? TEACHERS[session.teacherId] : 'Aucun formateur'

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(session.id)}
      className="w-full text-left rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-violet-300 transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{session.title}</h3>
        <StatusBadge status={session.status} />
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-gray-600">
        <div className="flex gap-1">
          <dt className="font-medium text-gray-500">Domaine :</dt>
          <dd>{session.domain}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-medium text-gray-500">Groupe :</dt>
          <dd>{session.group}</dd>
        </div>
        <div className="col-span-2 flex gap-1">
          <dt className="font-medium text-gray-500">Formateur :</dt>
          <dd>{teacherName}</dd>
        </div>
      </dl>
    </button>
  )
}
