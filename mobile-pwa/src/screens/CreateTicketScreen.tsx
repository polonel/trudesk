import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createTicket, getTypes, getGroups, getAgents } from '../api/tickets'
import { useAuthStore } from '../store/auth.store'
import BottomSheet from '../components/BottomSheet'
import Avatar from '../components/Avatar'
import { ArrowLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline'

type Sheet = 'type' | 'priority' | 'group' | 'owner' | null

// Minimal shape needed for the owner picker — both agents and group members satisfy this
type OwnerOption = { _id: string; fullname: string; username: string; image?: string }

export default function CreateTicketScreen() {
  const navigate = useNavigate()
  const currentUser = useAuthStore(s => s.user)

  const { data: typesData } = useQuery({ queryKey: ['ticket-types'], queryFn: getTypes, staleTime: Infinity })
  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: getGroups, staleTime: 60_000 })
  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: getAgents, staleTime: 60_000 })

  const [openSheet, setOpenSheet] = useState<Sheet>(null)

  const [subject, setSubject] = useState('')
  const [issue, setIssue] = useState('')
  const [typeId, setTypeId] = useState('')
  const [priorityId, setPriorityId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [ownerId, setOwnerId] = useState(currentUser?._id ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [groupSearch, setGroupSearch] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')

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

  // Clear search terms when sheet changes
  useEffect(() => {
    setGroupSearch('')
    setOwnerSearch('')
  }, [openSheet])

  const availablePriorities = typesData?.ticketTypes.find(t => t._id === typeId)?.priorities ?? []
  const selectedType = typesData?.ticketTypes.find(t => t._id === typeId)
  const selectedPriority = availablePriorities.find(p => p._id === priorityId)
  const selectedGroup = (groups ?? []).find(g => g._id === groupId)

  // Owner candidates:
  //   No group  → agents only
  //   Group set → agents (any group) + group members who are not already agents
  const ownerCandidates = useMemo<OwnerOption[]>(() => {
    const agentList: OwnerOption[] = (agents ?? []).map(a => ({
      _id: a._id,
      fullname: a.fullname,
      username: a.username,
      image: a.image,
    }))

    if (!groupId || !selectedGroup) return agentList

    const agentIds = new Set(agentList.map(a => a._id))
    const nonAgentMembers: OwnerOption[] = (selectedGroup.members ?? [])
      .filter(m => !agentIds.has(m._id))
      .map(m => ({ _id: m._id, fullname: m.fullname, username: m.username, image: m.image }))

    return [...agentList, ...nonAgentMembers]
  }, [agents, groupId, selectedGroup])

  // When group changes, re-validate the selected owner.
  // Agents are always valid; non-agent group members are only valid for their group.
  useEffect(() => {
    if (!ownerId) return
    const agentIds = new Set((agents ?? []).map(a => a._id))
    if (agentIds.has(ownerId)) return // agents are always valid

    if (!groupId) {
      // No group selected — only agents allowed; reset if non-agent was chosen
      setOwnerId(currentUser?._id ?? '')
    } else {
      // Group selected — check member list
      const memberIds = new Set((selectedGroup?.members ?? []).map(m => m._id))
      if (!memberIds.has(ownerId)) setOwnerId(currentUser?._id ?? '')
    }
  }, [groupId, selectedGroup, agents, ownerId, currentUser])

  const filteredOwners = useMemo(() =>
    ownerCandidates.filter(u =>
      ownerSearch === '' ||
      u.fullname.toLowerCase().includes(ownerSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(ownerSearch.toLowerCase())
    ),
    [ownerCandidates, ownerSearch]
  )

  const selectedOwner = useMemo<OwnerOption | null>(() => {
    if (!ownerId) return null
    // Check candidates first, fall back to currentUser so the default is always displayable
    return (
      ownerCandidates.find(u => u._id === ownerId) ??
      (currentUser && ownerId === currentUser._id
        ? { _id: currentUser._id, fullname: currentUser.fullname, username: currentUser.username, image: (currentUser as any).image }
        : null)
    )
  }, [ownerId, ownerCandidates, currentUser])

  const closeSheet = () => setOpenSheet(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !issue.trim() || !typeId || !priorityId || !ownerId) {
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
        owner: ownerId,
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

            {/* Group — select this first to filter the requester list */}
            <SelectorRow
              label="Group"
              value={selectedGroup?.name ?? 'No group'}
              valueClass={!selectedGroup ? 'text-gray-400 dark:text-gray-500' : undefined}
              onClick={() => setOpenSheet('group')}
            />

            {/* Requester */}
            <SelectorRow
              label="Requester"
              required
              value={
                selectedOwner ? (
                  <span className="flex items-center gap-2">
                    <Avatar name={selectedOwner.fullname} image={selectedOwner.image} size="sm" />
                    {selectedOwner.fullname}
                  </span>
                ) : '—'
              }
              onClick={() => setOpenSheet('owner')}
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
          disabled={submitting || !subject.trim() || !issue.trim() || !typeId || !priorityId || !ownerId}
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

      {/* Requester / Owner */}
      <BottomSheet open={openSheet === 'owner'} onClose={closeSheet} title="Select Requester">
        {!groupId && (
          <p className="px-5 pt-3 pb-1 text-xs text-gray-400 dark:text-gray-500">
            Select a group to include non-agent requesters.
          </p>
        )}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <input
            type="search"
            placeholder="Search users…"
            value={ownerSearch}
            onChange={e => setOwnerSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="py-1">
          {filteredOwners.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">No users found</p>
          )}
          {filteredOwners.map(u => (
            <button
              key={u._id}
              type="button"
              onClick={() => { setOwnerId(u._id); closeSheet() }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            >
              <Avatar name={u.fullname} image={u.image} size="sm" />
              <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-medium truncate ${ownerId === u._id ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}>
                  {u.fullname}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.username}</p>
              </div>
              {ownerId === u._id && (
                <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </button>
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
      <div className="min-w-0 flex-1">
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
