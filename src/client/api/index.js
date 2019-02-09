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

let api = {}

api.tickets = {}
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

export default api
