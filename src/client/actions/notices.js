import { createAction } from 'redux-actions'
import { FETCH_NOTICES, CREATE_NOTICE, UPDATE_NOTICE, DELETE_NOTICE, UNLOAD_NOTICES } from 'actions/types'

export const fetchNotices = createAction(FETCH_NOTICES.ACTION)
export const createNotice = createAction(CREATE_NOTICE.ACTION)
export const updateNotice = createAction(UPDATE_NOTICE.ACTION)
export const unloadNotices = createAction(
  UNLOAD_NOTICES.ACTION,
  payload => payload,
  () => ({ thunk: true })
)
export const deleteNotice = createAction(DELETE_NOTICE.ACTION)
