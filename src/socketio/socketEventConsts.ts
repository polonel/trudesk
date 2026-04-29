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
 *  Updated:    6/25/22 6:48 PM
 *  Copyright (c) 2014-2022. Trudesk, Inc (Chris Brame) All rights reserved.
 */

const SocketEvents = {
  // GLOBAL
  UI_ONLINE_STATUS_UPDATE: '$trudesk:global:ui:online_status:update',
  UI_ONLINE_STATUS_SET: '$trudesk:global:ui:online_status:set',
  USERS_UPDATE: '$trudesk:users:update',

  // ROLES
  ROLES_FLUSH: '$trudesk:roles:flush',

  // TICKETS
  TICKETS_CREATED: '$trudesk:tickets:created',
  TICKETS_UPDATE: '$trudesk:tickets:update',
  TICKETS_UI_STATUS_UPDATE: '$trudesk:tickets:ui:status:update',
  TICKETS_STATUS_SET: '$trudesk:tickets:status:set',
  TICKETS_UI_GROUP_UPDATE: '$trudesk:tickets:ui:group:update',
  TICKETS_GROUP_SET: '$trudesk:tickets:group:set',
  TICKETS_UI_TYPE_UPDATE: '$trudesk:tickets:ui:type:update',
  TICKETS_TYPE_SET: '$trudesk:tickets:type:set',
  TICKETS_UI_PRIORITY_UPDATE: '$trudesk:tickets:ui:priority:update',
  TICKETS_PRIORITY_SET: '$trudesk:tickets:priority:set',
  TICKETS_UI_DUEDATE_UPDATE: '$trudesk:tickets:ui:duedate:update',
  TICKETS_DUEDATE_SET: '$trudesk:tickets:duedate:set',
  TICKETS_UI_TAGS_UPDATE: '$trudesk:tickets:ui:tags:update',
  TICKETS_TAGS_SET: '$trudesk:tickets:tags:set',
  TICKETS_ASSIGNEE_LOAD: '$trudesk:tickets:assignee:load',
  TICKETS_ASSIGNEE_SET: '$trudesk:tickets:assignee:set',
  TICKETS_ASSIGNEE_CLEAR: '$trudesk:tickets:assignee:clear',
  TICKETS_ASSIGNEE_UPDATE: '$trudesk:tickets:assignee: update',
  TICKETS_ISSUE_SET: '$trudesk:tickets:issue:set',
  TICKETS_COMMENT_NOTE_REMOVE: '$trudesk:tickets:comment_note:remove',
  TICKETS_COMMENT_NOTE_SET: '$trudesk:tickets:comment_note:set',
  TICKETS_UI_ATTACHMENTS_UPDATE: '$trudesk:tickets:ui:attachments:update',

  // ACCOUNTS
  ACCOUNTS_UI_PROFILE_IMAGE_UPDATE: '$trudesk:accounts:ui:profile_image:update',

  // NOTIFICATIONS
  NOTIFICATIONS_UPDATE: '$trudesk:notifications:update',
  NOTIFICATIONS_MARK_READ: '$trudesk:notifications:mark_read',
  NOTIFICATIONS_CLEAR: '$trudesk:notifications:clear',

  // MESSAGES
  MESSAGES_SEND: '$trudesk:messages:send',
  MESSAGES_UI_RECEIVE: '$trudesk:messages:ui:receive',
  MESSAGES_USER_TYPING: '$trudesk:messages:user_typing',
  MESSAGES_UI_USER_TYPING: '$trudesk:messages:ui:user_typing',
  MESSAGES_USER_STOP_TYPING: '$trudesk:messages:user_stop_typing',
  MESSAGES_UI_USER_STOP_TYPING: '$trudesk:messages:ui:user_stop_typing',
  MESSAGES_SPAWN_CHAT_WINDOW: '$trudesk:messages:spawn_chat_window',
  MESSAGES_UI_SPAWN_CHAT_WINDOW: '$trudesk:messages:ui:spawn_chat_window',
  MESSAGES_SAVE_CHAT_WINDOW: '$trudesk:messages:save_chat_window',
  MESSAGES_SAVE_CHAT_WINDOW_COMPLETE: '$trudesk:messages:save_chat_window_complete',
  MESSAGES_UPDATE_UI_CONVERSATION_NOTIFICATIONS: '$trudesk:messages:ui:conversation_notifications:update',

  // NOTICES
  NOTICE_SHOW: '$trudesk:notice:show',
  NOTICE_UI_SHOW: '$trudesk:notice:ui:show',
  NOTICE_CLEAR: '$trudesk:notice:clear',
  NOTICE_UI_CLEAR: '$trudesk:notice:ui:clear',

  // BACKUP / RESTORE
  BACKUP_RESTORE_SHOW_OVERLAY: '$trudesk:backup_restore:show_overlay',
  BACKUP_RESTORE_UI_SHOW_OVERLAY: '$trudesk:backup_restore:ui:show_overlay',
  BACKUP_RESTORE_COMPLETE: '$trudesk:backup_restore:complete',
  BACKUP_RESTORE_UI_COMPLETE: '$trudesk:backup_restore:ui:complete'
} as const

export type SocketEventKey = keyof typeof SocketEvents
export type SocketEventValue = (typeof SocketEvents)[SocketEventKey]

export const {
  UI_ONLINE_STATUS_UPDATE,
  UI_ONLINE_STATUS_SET,
  USERS_UPDATE,
  ROLES_FLUSH,
  TICKETS_CREATED,
  TICKETS_UPDATE,
  TICKETS_UI_STATUS_UPDATE,
  TICKETS_STATUS_SET,
  TICKETS_UI_GROUP_UPDATE,
  TICKETS_GROUP_SET,
  TICKETS_UI_TYPE_UPDATE,
  TICKETS_TYPE_SET,
  TICKETS_UI_PRIORITY_UPDATE,
  TICKETS_PRIORITY_SET,
  TICKETS_UI_DUEDATE_UPDATE,
  TICKETS_DUEDATE_SET,
  TICKETS_UI_TAGS_UPDATE,
  TICKETS_TAGS_SET,
  TICKETS_ASSIGNEE_LOAD,
  TICKETS_ASSIGNEE_SET,
  TICKETS_ASSIGNEE_CLEAR,
  TICKETS_ASSIGNEE_UPDATE,
  TICKETS_ISSUE_SET,
  TICKETS_COMMENT_NOTE_REMOVE,
  TICKETS_COMMENT_NOTE_SET,
  TICKETS_UI_ATTACHMENTS_UPDATE,
  ACCOUNTS_UI_PROFILE_IMAGE_UPDATE,
  NOTIFICATIONS_UPDATE,
  NOTIFICATIONS_MARK_READ,
  NOTIFICATIONS_CLEAR,
  MESSAGES_SEND,
  MESSAGES_UI_RECEIVE,
  MESSAGES_USER_TYPING,
  MESSAGES_UI_USER_TYPING,
  MESSAGES_USER_STOP_TYPING,
  MESSAGES_UI_USER_STOP_TYPING,
  MESSAGES_SPAWN_CHAT_WINDOW,
  MESSAGES_UI_SPAWN_CHAT_WINDOW,
  MESSAGES_SAVE_CHAT_WINDOW,
  MESSAGES_SAVE_CHAT_WINDOW_COMPLETE,
  MESSAGES_UPDATE_UI_CONVERSATION_NOTIFICATIONS,
  NOTICE_SHOW,
  NOTICE_UI_SHOW,
  NOTICE_CLEAR,
  NOTICE_UI_CLEAR,
  BACKUP_RESTORE_SHOW_OVERLAY,
  BACKUP_RESTORE_UI_SHOW_OVERLAY,
  BACKUP_RESTORE_COMPLETE,
  BACKUP_RESTORE_UI_COMPLETE
} = SocketEvents

export default SocketEvents
