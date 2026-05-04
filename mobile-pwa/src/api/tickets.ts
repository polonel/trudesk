import api from './axios'
import type { Ticket, TicketListResponse, TicketStatus, TicketType } from '../types/ticket'
import type { TicketGroup } from '../types/ticket'
import type { User } from '../types/user'

export async function getTickets(params: {
  type?: string
  limit?: number
  page?: number
  filter?: string
}): Promise<TicketListResponse> {
  const res = await api.get('/api/v2/tickets', { params })
  return res.data
}

export async function getTicket(uid: number | string): Promise<Ticket> {
  const res = await api.get(`/api/v2/tickets/${uid}`)
  return res.data.ticket
}

export async function createTicket(data: {
  subject: string
  issue: string
  type: string
  priority: string
  group?: string
  tags?: string[]
}): Promise<Ticket> {
  const res = await api.post('/api/v2/tickets/create', data)
  return res.data.ticket
}

export async function updateTicket(uid: number | string, patch: Record<string, unknown>): Promise<Ticket> {
  const res = await api.put(`/api/v2/tickets/${uid}`, { ticket: patch })
  return res.data.ticket
}

export async function postComment(ticketId: string, comment: string, ownerId: string): Promise<void> {
  await api.post('/api/v2/tickets/addcomment', { _id: ticketId, comment, ownerId })
}

export async function postNote(ticketId: string, note: string): Promise<void> {
  await api.post('/api/v2/tickets/addnote', { ticketid: ticketId, note })
}

export async function getStatuses(): Promise<TicketStatus[]> {
  const res = await api.get('/api/v2/tickets/status')
  return res.data.status ?? []
}

export async function getTypes(): Promise<{ ticketTypes: TicketType[] }> {
  const res = await api.get('/api/v2/tickets/info/types')
  return res.data
}

export async function getGroups(): Promise<TicketGroup[]> {
  const res = await api.get('/api/v2/groups', { params: { type: 'all' } })
  return res.data.groups
}

export async function getTags(): Promise<string[]> {
  const res = await api.get('/api/v2/tags/limit')
  return res.data.tags ?? []
}

export async function getAgents(): Promise<User[]> {
  const res = await api.get('/api/v2/accounts', { params: { type: 'agents', limit: -1 } })
  return res.data.accounts ?? []
}
