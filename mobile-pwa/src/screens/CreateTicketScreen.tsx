import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createTicket, getTypes, getGroups } from '../api/tickets'
import BottomSheet from '../components/BottomSheet'
import { ArrowLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline'

type Sheet = 'type' | 'priority' | 'group' | null

export default function CreateTicketScreen() {
  const navigate = useNavigate()

  const { data: typesData } = useQuery({ queryKey: ['ticket-types'], queryFn: getTypes, staleTime: Infinity })
  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: getGroups, staleTime: 60_000 })

  const [subject, setSubject] = useState('')
  const [issue, setIssue] = useState('')
  const [typeId, setTypeId] = useState('')
  const [priorityId, setPriorityId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [openSheet, setOpenSheet] = useState<Sheet>(null)
  const [groupSearch, setGroupSearch] = useState('')

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

  // Clear search when sheet changes
  useEffect(() => {
    setGroupSearch('')
  }, [openSheet])

  const availablePriorities =
    typesData?.ticketTypes.find(t => t._id === typeId)?.priorities ?? []

  const selectedType = typesData?.ticketTypes.find(t => t._id === typeId)
  const selectedPriority = availablePriorities.find(p => p._id === priorityId)
  const selectedGroup = (groups ?? []).find(g => g._id === groupId)

  const closeSheet = () => setOpenSheet(null)

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
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">New Ticket</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-6 px-4 pt-4 space-y-4">

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            Subject <span className="text-red-400">*</span>
          </label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Brief summary of the issue"
            required
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Ticket Details Card */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            Details
          </label>
          <div className="rounded-xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">

            {/* Type */}
            <SelectorRow
              label="Type"
              required
              value={selectedType?.name ?? '—'}
              onClick={() => setOpenSheet('type')}
            />

            {/* Priority */}
            <SelectorRow
              label="Priority"
              required
              value={selectedPriority ? (
                <span className="flex items-center gap-1.5">
                  {selectedPriority.htmlColor && (
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: selectedPriority.htmlColor }}
                    />
                  )}
                  {selectedPriority.name}
                </span>
              ) : '—'}
              onClick={() => setOpenSheet('priority')}
              disabled={availablePriorities.length === 0}
            />

            {/* Group */}
            <SelectorRow
              label="Group"
              value={selectedGroup?.name ?? 'No group'}
              valueClass={!selectedGroup ? 'text-gray-400 dark:text-gray-500' : undefined}
              onClick={() => setOpenSheet('group')}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={issue}
            onChange={e => setIssue(e.target.value)}
            rows={6}
            placeholder="Describe the issue in detail…"
            required
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && (
          <p className="text-red-500 dark:text-red-400 text-sm font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !subject.trim() || !issue.trim() || !typeId || !priorityId}
          className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 active:opacity-80 transition-opacity"
        >
          {submitting ? 'Creating…' : 'Create Ticket'}
        </button>
      </form>

      {/* ── Bottom Sheets ── */}

      {/* Type */}
      <BottomSheet open={openSheet === 'type'} onClose={closeSheet} title="Select Type">
        <div className="py-2">
          {(typesData?.ticketTypes ?? []).map(t => (
            <PickerRow
              key={t._id}
              label={t.name}
              selected={typeId === t._id}
              onSelect={() => { setTypeId(t._id); closeSheet() }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Priority */}
      <BottomSheet open={openSheet === 'priority'} onClose={closeSheet} title="Select Priority">
        <div className="py-2">
          {availablePriorities.map(p => (
            <PickerRow
              key={p._id}
              label={p.name}
              selected={priorityId === p._id}
              icon={
                p.htmlColor ? (
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.htmlColor }} />
                ) : undefined
              }
              onSelect={() => { setPriorityId(p._id); closeSheet() }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Group */}
      <BottomSheet open={openSheet === 'group'} onClose={closeSheet} title="Select Group">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <input
            type="search"
            placeholder="Search groups…"
            value={groupSearch}
            onChange={e => setGroupSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="py-1">
          <PickerRow
            label="No group"
            selected={!groupId}
            onSelect={() => { setGroupId(''); closeSheet() }}
          />
          {(groups ?? [])
            .filter(g => groupSearch === '' || g.name.toLowerCase().includes(groupSearch.toLowerCase()))
            .map(g => (
              <PickerRow
                key={g._id}
                label={g.name}
                selected={groupId === g._id}
                onSelect={() => { setGroupId(g._id); closeSheet() }}
              />
            ))}
        </div>
      </BottomSheet>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

interface SelectorRowProps {
  label: string
  required?: boolean
  value: React.ReactNode
  valueClass?: string
  onClick: () => void
  disabled?: boolean
}

function SelectorRow({ label, required, value, valueClass, onClick, disabled }: SelectorRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left active:bg-gray-50 dark:active:bg-gray-700/40 disabled:opacity-40 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </p>
        <div className={`text-sm font-medium ${valueClass ?? 'text-gray-800 dark:text-gray-200'}`}>
          {value}
        </div>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
    </button>
  )
}

interface PickerRowProps {
  label: string
  selected?: boolean
  icon?: React.ReactNode
  onSelect: () => void
}

function PickerRow({ label, selected, icon, onSelect }: PickerRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
    >
      {icon && icon}
      <span className={`flex-1 text-left text-sm ${selected ? 'font-semibold text-primary' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
        {label}
      </span>
      {selected && <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />}
    </button>
  )
}
