import type { User } from './user'

export interface TicketStatus {
  _id: string
  name: string
  htmlColor: string
  isResolved: boolean
}

export interface TicketType {
  _id: string
  name: string
  priorities?: TicketPriority[]
}

export interface TicketPriority {
  _id: string
  name: string
  htmlColor: string
  ticketType: string
}

export interface TicketGroup {
  _id: string
  name: string
  members?: Array<{ _id: string; fullname: string; username: string; image?: string }>
}

export interface TicketComment {
  _id: string
  owner: User
  comment: string
  date: string
}

export interface TicketNote {
  _id: string
  owner: User
  note: string
  date: string
}

export interface TicketTag {
  _id: string
  name: string
  normalized?: string
}

export interface Ticket {
  _id: string
  uid: number
  subject: string
  issue: string
  status: TicketStatus
  type: TicketType
  priority: TicketPriority
  group: TicketGroup
  owner: User
  assignee?: User
  tags: TicketTag[]
  comments: TicketComment[]
  notes: TicketNote[]
  date: string
  updated: string
}

export interface TicketListResponse {
  tickets: Ticket[]
  count: number
  totalCount: number
  page: number
  prevPage: number | null
  nextPage: number | null
}

export type TicketFilterType = 'all' | 'active' | 'my' | 'closed' | 'unassigned'
