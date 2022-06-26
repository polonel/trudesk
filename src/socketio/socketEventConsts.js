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

const exported = {}

// USERS
exported.USERS_UPDATE = '$trudesk:users:update'

// ROLES
exported.ROLES_FLUSH = '$trudesk:roles:flush'

// TICKETS
exported.TICKETS_CREATED = '$trudesk:tickets:created'
exported.TICKETS_UPDATE = '$trudesk:tickets:update'

// NOTIFICATIONS
exported.NOTIFICATIONS_UPDATE = '$trudesk:notifications:update'
exported.NOTIFICATIONS_MARK_READ = '$trudesk:notifications:mark_read'
exported.NOTIFICATIONS_CLEAR = '$trudesk:notifications:clear'

module.exports = exported
