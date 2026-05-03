import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createTicket, getTypes, getGroups } from '../api/tickets'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function CreateTicketScreen() {
  const navigate = useNavigate()

  const { data: typesData } = useQuery({ queryKey: ['ticket-types'], queryFn: getTypes })
  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: getGroups })

  const [subject, setSubject] = useState('')
  const [issue, setIssue] = useState('')
  const [typeId, setTypeId] = useState('')
  const [priorityId, setPriorityId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Auto-select first type
  useEffect(() => {
    if (typesData?.ticketTypes.length && !typeId) {
      setTypeId(typesData.ticketTypes[0]._id)
    }
  }, [typesData, typeId])

  // Auto-select first priority for selected type
  useEffect(() => {
    if (typeId && typesData?.ticketTypes) {
      const selectedType = typesData.ticketTypes.find(t => t._id === typeId)
      const available = selectedType?.priorities ?? []
      if (available.length) setPriorityId(available[0]._id)
      else setPriorityId('')
    }
  }, [typeId, typesData])

  const availablePriorities =
    typesData?.ticketTypes.find(t => t._id === typeId)?.priorities ?? []

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !issue.trim() || !typeId || !priorityId) {
      setError('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const ticket = await createTicket({
        subject,
        issue,
        type: typeId,
        priority: priorityId,
        group: groupId || undefined,
      })
      navigate(`/tickets/${ticket.uid}`, { replace: true })
    } catch {
      setError('Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">New Ticket</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
          <select
            value={typeId}
            onChange={e => setTypeId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {(typesData?.ticketTypes ?? []).map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priority *</label>
          <select
            value={priorityId}
            onChange={e => setPriorityId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {availablePriorities.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Group</label>
          <select
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">— No group —</option>
            {(groups ?? []).map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
          <textarea
            value={issue}
            onChange={e => setIssue(e.target.value)}
            rows={6}
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Ticket'}
        </button>
      </form>
    </div>
  )
}
