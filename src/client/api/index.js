/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import axios from 'axios'

axios.defaults.headers.post['Content-Type'] = 'application/json'
const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
axios.defaults.headers['CSRF-TOKEN'] = token

const api = {}

api.dashboard = {}
api.dashboard.getData = payload => {
  const timespan = payload.timespan || 30
  return axios.get(`/api/v1/tickets/stats/${timespan}`).then(res => {
    return res.data
  })
}
api.dashboard.getTopGroups = payload => {
  const timespan = payload.timespan || 30
  return axios.get(`/api/v1/tickets/count/topgroups/${timespan}/5`).then(res => {
    return res.data
  })
}
api.dashboard.getTopTags = payload => {
  const timespan = payload.timespan || 30
  return axios.get(`/api/v1/tickets/count/tags/${timespan}`).then(res => {
    return res.data
  })
}
api.dashboard.getOverdueTickets = () => {
  return axios.get('/api/v1/tickets/overdue').then(res => {
    return res.data
  })
}

api.tickets = {}
api.tickets.getWithPage = payload => {
  const limit = payload.limit ? payload.limit : 50
  const page = payload.page ? payload.page : 0
  const type = payload.type ? payload.type : 'all'
  const filter = payload.filter ? encodeURIComponent(JSON.stringify(payload.filter, null, 2)) : undefined
  const fullFilter = filter ? `&filter=${filter}` : undefined
  return axios.get(`/api/v2/tickets?type=${type}&page=${page}&limit=${limit}${fullFilter}`).then(res => {
    return res.data
  })
}
api.tickets.search = payload => {
  return axios.get(`/api/v1/tickets/search/?search=${payload.searchString}&limit=100`).then(res => {
    return res.data
  })
}
api.tickets.create = payload => {
  return axios.post('/api/v1/tickets/create', payload).then(res => {
    return res.data
  })
}

api.tickets.delete = ({ id }) => {
  return axios.delete(`/api/v1/tickets/${id}`).then(res => {
    return res.data
  })
}

api.tickets.renameTicketType = (id, name) => {
  return axios.put('/api/v1/tickets/types/' + id, { name }).then(res => {
    return res.data
  })
}

api.tickets.createTicketType = ({ name }) => {
  return axios.post('/api/v1/tickets/types/create', { name }).then(res => {
    return res.data
  })
}

api.tickets.addPriorityToType = ({ typeId, priority }) => {
  return axios
    .post(`/api/v1/tickets/type/${typeId}/addpriority`, {
      priority
    })
    .then(res => {
      return res.data
    })
}

api.tickets.removePriorityFromType = ({ typeId, priority }) => {
  return axios
    .post(`/api/v1/tickets/type/${typeId}/removepriority`, {
      priority
    })
    .then(res => {
      return res.data
    })
}

api.tickets.deleteTicketType = ({ id, newTypeId }) => {
  return axios.delete(`/api/v1/tickets/types/${id}`, { data: { newTypeId } }).then(res => {
    return res.data
  })
}

api.tickets.fetchPriorities = () => {
  return axios.get('/api/v1/tickets/priorities').then(res => {
    return res.data
  })
}
api.tickets.createPriority = ({ name, overdueIn, htmlColor }) => {
  return axios
    .post('/api/v1/tickets/priority/create', {
      name,
      overdueIn,
      htmlColor
    })
    .then(res => {
      return res.data
    })
}
api.tickets.updatePriority = ({ id, name, overdueIn, htmlColor }) => {
  return axios
    .put(`/api/v1/tickets/priority/${id}`, {
      name,
      overdueIn,
      htmlColor
    })
    .then(res => {
      return res.data
    })
}

api.tickets.createStatus = ({ name, htmlColor }) => {
  return axios
    .post('/api/v1/tickets/status/create', {
      name,
      htmlColor
    })
    .then(res => {
      return res.data
    })
}
api.tickets.updateStatus = ({ id, name, htmlColor, isResolved, slatimer }) => {
  return axios
    .put(`/api/v1/tickets/status/${id}`, {
      name,
      htmlColor,
      isResolved,
      slatimer
    })
    .then(res => {
      return res.data
    })
}
api.tickets.getStatus = () => {
  return axios.get('/api/v1/tickets/status').then(res => {
    return res.data
  })
}

api.tickets.deleteStatus = ({ id, newStatusId }) => {
  return axios.post(`/api/v1/tickets/status/${id}/delete`, { newStatusId }).then(res => {
    return res.data
  })
}

api.tickets.deletePriority = ({ id, newPriority }) => {
  return axios
    .post(`/api/v1/tickets/priority/${id}/delete`, {
      newPriority
    })
    .then(res => {
      return res.data
    })
}

api.tickets.getTagsWithPage = ({ limit, page }) => {
  limit = limit ? limit : 10
  page = page ? page : 0
  return axios.get(`/api/v1/tags/limit?limit=${limit}&page=${page}`).then(res => {
    return res.data
  })
}

api.tickets.createTag = ({ name }) => {
  return axios.post(`/api/v1/tags/create`, { tag: name }).then(res => {
    return res.data
  })
}

api.tickets.transferToThirdParty = ({ uid }) => {
  return axios.post(`/api/v2/tickets/transfer/${uid}`).then(res => {
    return res.data
  })
}

api.tickets.fetchTicketTypes = () => {
  return axios.get('/api/v2/tickets/info/types').then(res => {
    return res.data
  })
}

api.accounts = {}
api.accounts.create = payload => {
  return axios.post('/api/v2/accounts', payload).then(res => {
    return res.data
  })
}

api.accounts.getWithPage = payload => {
  const limit = payload && payload.limit ? payload.limit : 25
  const page = payload && payload.page ? payload.page : 0
  const type = payload && payload.type ? payload.type : 'all'
  let search = payload && payload.search ? payload.search : ''
  if (search) search = `&search=${search}`
  const showDeleted = payload && payload.showDeleted ? payload.showDeleted : false

  return axios
    .get(`/api/v2/accounts?type=${type}&limit=${limit}&page=${page}${search}&showDeleted=${showDeleted}`)
    .then(res => {
      return res.data
    })
}
api.accounts.updateUser = payload => {
  return axios.put(`/api/v2/accounts/${payload.username}`, payload).then(res => {
    return res.data
  })
}
api.accounts.deleteAccount = ({ username }) => {
  return axios.delete(`/api/v1/users/${username}`).then(res => {
    return res.data
  })
}
api.accounts.enableAccount = ({ username }) => {
  return axios.get(`/api/v1/users/${username}/enable`).then(res => {
    return res.data
  })
}

api.accounts.saveProfile = payload => {
  return axios.put(`/api/v2/accounts/profile`, payload).then(res => {
    return res.data
  })
}
api.accounts.generateMFA = payload => {
  return axios.post(`/api/v2/accounts/profile/mfa`, payload).then(res => {
    return res.data
  })
}

api.groups = {}
api.groups.create = payload => {
  return axios.post('/api/v2/groups', payload).then(res => {
    return res.data
  })
}
api.groups.get = payload => {
  const limit = payload && payload.limit ? payload.limit : 1000
  const page = payload && payload.page ? payload.page : 0
  const type = payload && payload.type ? `&type=${payload.type}` : ''

  return axios.get(`/api/v2/groups?limit=${limit}&page=${page}${type}`).then(res => {
    return res.data
  })
}
api.groups.update = payload => {
  return axios.put(`/api/v2/groups/${payload._id}`, payload).then(res => {
    return res.data
  })
}
api.groups.delete = ({ _id }) => {
  return axios.delete(`/api/v2/groups/${_id}`).then(res => {
    return res.data
  })
}

api.teams = {}
api.teams.getWithPage = payload => {
  const limit = payload && payload.limit ? payload.limit : 100
  const page = payload && payload.page ? payload.page : 0
  return axios.get(`/api/v2/teams?limit=${limit}&page=${page}`).then(res => {
    return res.data
  })
}
api.teams.create = payload => {
  return axios.post('/api/v2/teams', payload).then(res => {
    return res.data
  })
}
api.teams.updateTeam = payload => {
  return axios.put(`/api/v2/teams/${payload._id}`, payload).then(res => {
    return res.data
  })
}
api.teams.deleteTeam = ({ _id }) => {
  return axios.delete(`/api/v2/teams/${_id}`).then(res => {
    return res.data
  })
}

api.departments = {}
api.departments.get = () => {
  return axios.get('/api/v2/departments').then(res => {
    return res.data
  })
}
api.departments.create = payload => {
  return axios.post('/api/v2/departments', payload).then(res => {
    return res.data
  })
}
api.departments.update = payload => {
  return axios.put(`/api/v2/departments/${payload._id}`, payload).then(res => {
    return res.data
  })
}
api.departments.delete = ({ _id }) => {
  return axios.delete(`/api/v2/departments/${_id}`).then(res => {
    return res.data
  })
}

api.messages = {}
api.messages.getConversations = () => {
  return axios.get('/api/v2/messages/conversations').then(res => {
    return res.data
  })
}
api.messages.getSingleConversation = ({ _id }) => {
  return axios.get(`/api/v2/messages/conversations/${_id}`).then(res => {
    return res.data
  })
}
api.messages.deleteConversation = payload => {
  return axios.delete(`/api/v1/messages/conversation/${payload.convoId}`, payload).then(res => {
    return res.data
  })
}
api.messages.send = payload => {
  return axios.post('/api/v1/messages/send', payload).then(res => {
    return res.data
  })
}

api.notices = {}
api.notices.create = payload => {
  return axios.post('/api/v2/notices', payload).then(res => {
    return res.data
  })
}

api.notices.get = () => {
  return axios.get('/api/v2/notices').then(res => {
    return res.data
  })
}

api.notices.update = payload => {
  return axios.put(`/api/v2/notices/${payload._id}`, payload).then(res => {
    return res.data
  })
}

api.notices.delete = ({ _id }) => {
  return axios.delete(`/api/v2/notices/${_id}`).then(res => {
    return res.data
  })
}

api.reports = {}
api.reports.generate = payload => {
  return axios.post(`/api/v1/reports/generate/${payload.type}`, payload)
}

api.search = {}
api.search.search = ({ limit, term }) => {
  const l = limit || 25
  return axios.get(`/api/v2/es/search?limit=${l}&q=${term}`).then(res => {
    return res.data
  })
}

api.settings = {}
api.settings.update = settings => {
  return axios.put('/api/v1/settings', settings).then(res => {
    return res.data
  })
}
api.settings.hasMongoDBTools = () => {
  return axios.get('/api/v1/backup/hastools').then(res => {
    return res.data
  })
}
api.settings.fetchBackups = () => {
  return axios.get('/api/v1/backups').then(res => {
    return res.data
  })
}
api.settings.backupNow = () => {
  return axios.post('/api/v1/backup').then(res => {
    return res.data
  })
}
api.settings.getBackups = () => {
  return axios.get('/api/v1/backups').then(res => {
    return res.data
  })
}
api.settings.fetchDeletedTickets = () => {
  return axios.get('/api/v1/tickets/deleted').then(res => {
    return res.data
  })
}
api.settings.restoreDeletedTicket = ({ _id }) => {
  return axios.post('/api/v1/tickets/deleted/restore', { _id }).then(res => {
    return res.data
  })
}
api.settings.permDeleteTicket = ({ _id }) => {
  return axios.delete(`/api/v2/tickets/deleted/${_id}`).then(res => {
    return res.data
  })
}
api.settings.updateRoleOrder = ({ roleOrder }) => {
  return axios
    .put('/api/v1/settings/updateroleorder', {
      roleOrder
    })
    .then(res => {
      return res.data
    })
}
api.settings.updatePermissions = payload => {
  return axios.put(`/api/v1/roles/${payload._id}`, payload).then(res => {
    return res.data
  })
}
api.settings.createRole = ({ name }) => {
  return axios.post('/api/v1/roles', { name }).then(res => {
    return res.data
  })
}
api.settings.deleteRole = ({ _id, newRoleId }) => {
  return axios.delete(`/api/v1/roles/${_id}`, { data: { newRoleId } }).then(res => {
    return res.data
  })
}
api.settings.buildSass = () => {
  return axios.get(`/api/v1/settings/buildsass`).then(res => {
    return res.data
  })
}

api.common = {}
api.common.getSessionUser = () => {
  return axios.get('/api/v2/login').then(res => {
    return res.data
  })
}
api.common.fetchRoles = () => {
  return axios.get('/api/v1/roles').then(res => {
    return res.data
  })
}
api.common.fetchViewData = () => {
  return axios.get('/api/v2/viewdata').then(res => {
    return res.data
  })
}

export default api
