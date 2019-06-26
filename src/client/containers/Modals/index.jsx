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
 *  Updated:    2/3/19 8:28 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

// Modals
import NoticeAlertModal from './NoticeAlertModal'
import CreateTicketTypeModal from './CreateTicketTypeModal'
import DeleteTicketTypeModal from './DeleteTicketTypeModal'
import FilterTicketModal from './FilterTicketsModal'
import AddPriorityToTypeModal from './AddPriorityToTypeModal'
import CreatePriorityModal from './CreatePriorityModal'
import DeletePriorityModal from './DeletePriorityModal'
import CreateTagModal from './CreateTagModal'
import AddTagsModal from './AddTagsModal'
import CreateTicketModal from './CreateTicketModal'
import CreateRoleModal from './CreateRoleModal'
import DeleteRoleModal from './DeleteRoleModal'
import ViewAllNotificationsModal from './ViewAllNotificationsModal'
import CreateAccountModal from './CreateAccountModal'
import EditAccountModal from './EditAccountModal'
import CreateGroupModal from './CreateGroupModal'
import EditGroupModal from './EditGroupModal'
import CreateTeamModal from './CreateTeamModal'
import EditTeamModal from './EditTeamModal'
import CreateDepartmentModal from './CreateDepartmentModal'
import EditDepartmentModal from './EditDepartmentModal'

const MODAL_COMPONENTS = {
  NOTICE_ALERT: NoticeAlertModal,
  CREATE_TICKET: CreateTicketModal,
  CREATE_TICKET_TYPE: CreateTicketTypeModal,
  DELETE_TICKET_TYPE: DeleteTicketTypeModal,
  FILTER_TICKET: FilterTicketModal,
  ADD_PRIORITY_TO_TYPE: AddPriorityToTypeModal,
  CREATE_PRIORITY: CreatePriorityModal,
  DELETE_PRIORITY: DeletePriorityModal,
  CREATE_TAG: CreateTagModal,
  ADD_TAGS_MODAL: AddTagsModal,
  CREATE_ROLE: CreateRoleModal,
  DELETE_ROLE: DeleteRoleModal,
  VIEW_ALL_NOTIFICATIONS: ViewAllNotificationsModal,
  CREATE_ACCOUNT: CreateAccountModal,
  EDIT_ACCOUNT: EditAccountModal,
  CREATE_GROUP: CreateGroupModal,
  EDIT_GROUP: EditGroupModal,
  CREATE_TEAM: CreateTeamModal,
  EDIT_TEAM: EditTeamModal,
  CREATE_DEPARTMENT: CreateDepartmentModal,
  EDIT_DEPARTMENT: EditDepartmentModal
}

const ModalRoot = ({ modalType, modalProps }) => {
  if (!modalType) {
    return <div id={'modal-wrap'} />
  }

  const SpecificModal = MODAL_COMPONENTS[modalType]
  return <SpecificModal {...modalProps} />
}

ModalRoot.propTypes = {
  modalType: PropTypes.string,
  modalProps: PropTypes.object
}

export default connect(state => state.modal)(ModalRoot)
