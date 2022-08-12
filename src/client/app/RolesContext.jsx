import { createContext } from 'react'
import { getSession } from './SessionContext'
import axios from 'api/axios'
import { store } from 'app'

const memory = { roles: null, roleOrder: null }

export const setRoles = (roles, roleOrder) => {
  store.dispatch({ type: 'FETCH_ROLES_SUCCESS', response: { roles, roleOrder } })
  memory.roles = roles
  memory.roleOrder = roleOrder
  return memory
}

export const getRoles = async () => {
  try {
    if (!memory.roles || !memory.roleOrder) {
      const { user } = getSession()
      if (!user) return
      const data = await axios.get('/api/v2/roles').then(res => res.data)
      if (data.roles && data.roleOrder) setRoles(data.roles, data.roleOrder)
    }

    return memory
  } catch (e) {
    console.log(e)
    return memory
  }
}

export const roles = memory.roles
export const roleOrder = memory.roleOrder

const RolesContext = createContext({
  roles: memory.roles,
  roleOrder: memory.roleOrder,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setRoles: () => {}
})

export default RolesContext
