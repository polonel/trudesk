
/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

var _       = require('lodash');
var _s      = require('underscore.string');

/*
    Permissions for TruDesk. Define Roles / Groups.
    --- group:action action action

    *                       = all permissions for grp
    create                  = create permission for grp
    delete                  = delete permission for grp
    edit                    = edit permission for grp
    editSelf                = edit Self Created Items
    assignee                = allowed to be assigned to a ticket
    view                    = view permission for grp
    ticket:attachment       = can add attachment
    ticket:removeAttachment = can remove attachment
    ticket:viewHistory      = can view ticket history on single page
 */
var roles = {
    admin: {
        id: "admin",
        name: "Administrators",
        description: "Administrators",
        allowedAction: ["*"]
    },
    mod: {
        id: "mod",
        name: "Moderators",
        description: "Moderators",
        allowedAction: ["mod:*", "ticket:create edit view attachment removeAttachment", "users:view edit", "comment:*", "reports:view", "notices:*"]
    },
    support: {
        id: "support",
        name: "Support",
        description: "Support User",
        allowedAction: ["ticket:*", "users:create edit view delete", "comment:editSelf create", "reports:view", "notices:*"]
    },
    user: {
        id: "user",
        name: "User",
        description: "User",
        allowedAction: ["ticket:create editSelf attachment", "comment:create editSelf" ]
    }
};

/***
 * Checks to see if a role as the given action
 * @param role [role to check against]
 * @param a [action to check]
 * @returns {boolean}
 */

var canThis = function(role, a) {
    if (_.isUndefined(role)) return false;

    var rolePerm = _.find(roles, {'id': role});
    if (_.isUndefined(rolePerm)) return false;

    if (rolePerm.allowedAction === '*') return true;

    if (_.indexOf(rolePerm.allowedAction, '*') !== -1) return true;

    var actionType = a.split(':')[0];
    var action = a.split(':')[1];

    if (_.isUndefined(actionType) || _.isUndefined(action)) return false;

    var result = _.filter(rolePerm.allowedAction, function(value) {
        if (_s.startsWith(value, actionType + ':')) return value;
    });

    if (_.isUndefined(result) || _.size(result) < 1) return false;
    if (_.size(result) === 1) {
        if (result[0] === '*') return true;
    }

    var typePerm = result[0].split(':')[1].split(' ');
    typePerm = _.uniq(typePerm);

    if (_.indexOf(typePerm, '*') !== -1) return true;

    return _.indexOf(typePerm, action) !== -1;
};

module.exports = {
    roles: roles,
    canThis: canThis
};