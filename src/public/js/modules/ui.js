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

define('modules/ui', [
  'jquery',
  'underscore',
  'uikit',
  'modules/helpers',
  'modules/navigation',
  'modules/socket.io/noticeUI',
  'modules/socket.io/ticketsUI',
  'modules/socket.io/logs.io',
  'history'
], function ($, _, UIKit, helpers, nav, noticeUI, ticketsUI, logsIO) {
  var socketUi = {}

  var socket

  socketUi.init = function (sock) {
    // loggedInAccount = window.trudeskSessionService.getUser();
    socketUi.socket = socket = sock

    this.flushRoles()
    this.onReconnect()
    this.onDisconnect()
    // this.updateUsers()
    // this.updateNotifications()
    this.updateAllNotifications()
    this.updateComments()
    this.updateUi()
    this.updateTicketStatus()
    this.updateAssigneeList()
    this.updateAssignee()
    this.updateTicketType()
    this.updateTicketPriority()
    this.updateTicketGroup()
    this.updateTicketIssue()
    this.updateTicketAttachments()
    this.updateTicketTags()

    // Events
    this.onTicketCreated()
    this.onTicketDelete()
    this.onUpdateTicketGrid()
    this.onProfileImageUpdate()

    this.updateSubscribe(socket)

    // Logs
    this.updateServerLogs(socket)

    // Backup / Restore
    this.onShowRestoreOverlay()
    this.onRestoreComplete()
  }

  socketUi.onShowRestoreOverlay = function () {
    socket.removeAllListeners('$trudesk:restore:showOverlay')
    socket.on('$trudesk:restore:showOverlay', function () {
      $('#restoreBackupOverlay').removeClass('hide')
    })
  }

  socketUi.emitShowRestoreOverlay = function () {
    socket.emit('$trudesk:restore:showOverlay')
  }

  socketUi.onRestoreComplete = function () {
    socket.removeAllListeners('$trudesk:restore:complete')
    socket.on('$trudesk:restore:complete', function () {
      location.reload()
    })
  }

  socketUi.emitRestoreComplete = function () {
    socket.emit('$trudesk:restore:complete')
  }

  socketUi.setShowNotice = function (notice) {
    noticeUI.setShowNotice(socket, notice)
  }

  socketUi.setClearNotice = function () {
    noticeUI.setClearNotice(socket)
  }

  socketUi.updateShowNotice = noticeUI.updateShowNotice
  socketUi.updateClearNotice = noticeUI.updateClearNotice

  socketUi.updateSubscribe = ticketsUI.updateSubscribe

  socketUi.updateServerLogs = logsIO.getLogData
  socketUi.fetchServerLogs = function () {
    socket.emit('logs:fetch')
  }
  socketUi.flushRoles = function () {
    socket.removeAllListeners('$trudesk:flushRoles')
    socket.on('$trudesk:flushRoles', function () {
      helpers.flushRoles()
    })
  }

  socketUi.sendUpdateTicketStatus = function (id, status) {
    socket.emit('updateTicketStatus', { ticketId: id, status: status })
  }

  socketUi.onReconnect = function () {
    socket.removeAllListeners('reconnect')
    socket.on('reconnect', function () {
      helpers.UI.hideDisconnectedOverlay()
    })
  }

  socketUi.onDisconnect = function () {
    socket.removeAllListeners('disconnect')
    socket.on('disconnect', function () {
      helpers.UI.showDisconnectedOverlay()
    })

    socket.removeAllListeners('reconnect_attempt')
    socket.on('reconnect_attempt', function () {
      helpers.UI.showDisconnectedOverlay()
    })

    socket.removeAllListeners('connect_timeout')
    socket.on('connect_timeout', function () {
      helpers.UI.showDisconnectedOverlay()
    })
  }

  socketUi.sendUpdateTicketStatus = function (id, status) {
    socket.emit('updateTicketStatus', { ticketId: id, status: status })
  }

  socketUi.clearAssignee = function (id) {
    socket.emit('clearAssignee', id)
  }

  socketUi.updateTicketStatus = function () {
    socket.removeAllListeners('updateTicketStatus')
    socket.on('updateTicketStatus', function (payload) {
      var ticketId = payload.tid
      var status = payload.status
      var statusSelectBox = $('#statusSelect')
      if (statusSelectBox.length > 0) statusSelectBox.addClass('hide')

      var tStatusBox = $('.floating-ticket-status[data-ticketId="' + ticketId + '"] > .ticket-status')
      if (tStatusBox.length > 0) {
        tStatusBox.removeClass('ticket-new')
        tStatusBox.removeClass('ticket-open')
        tStatusBox.removeClass('ticket-pending')
        tStatusBox.removeClass('ticket-closed')

        var s = 'New'
        var c = 'ticket-new'
        switch (status) {
          case 0:
            s = 'New'
            c = 'ticket-new'
            break
          case 1:
            s = 'Open'
            c = 'ticket-open'
            break
          case 2:
            s = 'Pending'
            c = 'ticket-pending'
            break
          case 3:
            s = 'Closed'
            c = 'ticket-closed'
            break
        }

        tStatusBox.find('span').html(s)
        tStatusBox.addClass(c)

        var ticketReply = $('.ticket-reply')
        var assigneeListBtn = $('.ticket-assignee > a')
        var ticketTypeSelect = $('select#tType')
        var ticketPriority = $('select#tPriority')
        var ticketGroup = $('select#tGroup')
        var ticketTags = $('div#editTags')

        var addAttachments = $('form#attachmentForm > div.add-attachment')
        var editIssue = $('div.initial-issue > div.edit-issue')
        var commentActions = $('div.comment-actions')

        if (status === 3) {
          // Remove Comment Box
          if (ticketReply.length > 0) {
            ticketReply.addClass('hide')
          }

          // Setup assignee list on Closed
          if (assigneeListBtn.length > 0) {
            assigneeListBtn.removeAttr('data-notifications')
            assigneeListBtn.removeAttr('data-updateUi')
            nav.notifications()
          }
          // Disabled Ticket Details
          if (ticketTypeSelect.length > 0) {
            ticketTypeSelect.prop('disabled', true)
          }

          if (ticketPriority.length > 0) {
            ticketPriority.prop('disabled', true)
          }

          if (ticketGroup.length > 0) {
            ticketGroup.prop('disabled', true)
          }

          if (ticketTags.length > 0) {
            ticketTags.addClass('hide')
          }

          if (addAttachments.length > 0) {
            addAttachments.addClass('hide')
          }

          if (editIssue.length > 0) {
            editIssue.addClass('hide')
          }

          if (commentActions.length > 0) {
            commentActions.addClass('hide')
          }
        } else {
          if (ticketReply.length > 0) {
            ticketReply.removeClass('hide')
          }

          // Enable Ticket Details
          if (ticketTypeSelect.length > 0) {
            ticketTypeSelect.prop('disabled', false)
          }

          if (ticketPriority.length > 0) {
            ticketPriority.prop('disabled', false)
          }

          if (ticketGroup.length > 0) {
            ticketGroup.prop('disabled', false)
          }

          if (ticketTags.length > 0) {
            ticketTags.removeClass('hide')
          }

          if (addAttachments.length > 0) {
            addAttachments.removeClass('hide')
          }

          if (editIssue.length > 0) {
            editIssue.removeClass('hide')
          }

          if (commentActions.length > 0) {
            commentActions.removeClass('hide')
          }

          // Setup assignee list
          if (assigneeListBtn.length > 0) {
            if (helpers.hasPermOverRole(payload.owner.role._id, null, 'agent:*', true)) {
              assigneeListBtn.attr('data-notifications', 'assigneeDropdown')
              assigneeListBtn.attr('data-updateui', 'assigneeList')
              nav.notifications()
              socketUi.updateUi()
            }
          }
        }
      }
    })
  }

  socketUi.updateAssigneeList = function () {
    socket.removeAllListeners('updateAssigneeList')
    socket.on('updateAssigneeList', function (users) {
      var wrapper = ''
      _.each(users, function (user) {
        var html = '<li data-setAssignee="' + user._id + '">'
        html += '<a class="messageNotification no-ajaxy" role="button">'
        html += '<div class="uk-clearfix">'
        if (_.isUndefined(user.image)) {
          html += '<div class="profilePic left"><img src="/uploads/users/defaultProfile.jpg" alt="profile"/></div>'
        } else {
          html += '<div class="profilePic left"><img src="/uploads/users/' + user.image + '" alt="profile"/></div>'
        }

        html += '<div class="messageAuthor"><strong>' + user.fullname + '</strong></div>'
        html += '<div class="messageSnippet">'
        html += '<span>' + user.email + '</span>'
        html += '</div>'
        html += '<div class="messageDate">'
        html += '<span>' + user.title + '</span>'
        html += '</div>'
        html += '</div>'
        html += '</a>'
        html += '</li>'

        wrapper += html
      })

      var assigneeListDrop = $('#assigneeDropdown-content > ul')
      $('#assigneeDropdown-content')
        .addClass('uk-clearfix')
        .css({
          height: 'auto',
          'max-height': '372px',
          'overflow-y': 'auto',
          'overflow-x': 'hidden'
        })
      if (assigneeListDrop.length > 0) {
        assigneeListDrop.css({ height: '100%' })
        assigneeListDrop.html(wrapper)

        $.each(assigneeListDrop.find('li[data-setAssignee]'), function () {
          var self = $(this)
          var id = self.attr('data-setAssignee')
          self.off('click', setAssigneeClicked)
          self.on('click', { _id: id }, setAssigneeClicked)
        })
      }
    })
  }

  function setAssigneeClicked (e) {
    e.preventDefault()

    var _id = e.data._id
    var ticketId = $('#__ticketId').html()
    var payload = {
      _id: _id,
      ticketId: ticketId
    }

    socket.emit('setAssignee', payload)
    $('#assigneeDropdown').removeClass('pDropOpen')
  }

  socketUi.updateAssignee = function () {
    socket.removeAllListeners('updateAssignee')
    socket.on('updateAssignee', function (ticket) {
      var assigneeContainer = $('.ticket-assignee[data-ticketId="' + ticket._id + '"]')
      if (assigneeContainer.length > 0) {
        var image = _.isUndefined(ticket.assignee) ? 'defaultProfile.jpg' : ticket.assignee.image
        if (_.isUndefined(image)) image = 'defaultProfile.jpg'
        assigneeContainer.find('a > img').attr('src', '/uploads/users/' + image)
        var $bubble = assigneeContainer.find('a > span[data-user-status-id]')
        if ($bubble.length < 1 && ticket.assignee) {
          $bubble = $('<span class="user-offline uk-border-circle" data-user-status-id></span>')
          assigneeContainer.find('a').append($bubble)
          $bubble = assigneeContainer.find('a > span[data-user-status-id]')
        }

        if (ticket.assignee) {
          $bubble.attr('data-user-status-id', ticket.assignee._id)
          socket.emit('updateUsers')
        } else {
          if ($bubble.length > 0) {
            $bubble.remove()
          }
        }
        var details = assigneeContainer.find('.ticket-assignee-details')
        if (details.length > 0) {
          var name = _.isUndefined(ticket.assignee) ? 'No User Assigned' : ticket.assignee.fullname
          details.find('h3').html(name)
          var a = details.find('a.comment-email-link')
          var email = _.isUndefined(ticket.assignee) ? '' : ticket.assignee.email
          if (a.length > 0) {
            a.attr('href', 'mailto:' + email).html(email)
          } else {
            a = $('<a></a>')
              .attr('href', 'mailto:' + email)
              .html(email)
              .addClass('comment-email-link uk-text-truncate')
            details.append(a)
          }

          var span = details.find('span')
          var title = _.isUndefined(ticket.assignee) ? '' : ticket.assignee.title
          if (span.length > 0) {
            span.html(title)
          } else {
            span = $('<span></span>').html(title)
            details.append(span)
          }
        }
      }

      socket.emit('$trudesk:chat:updateOnlineBubbles')
    })
  }

  socketUi.setTicketType = function (ticketId, typeId) {
    var payload = {
      ticketId: ticketId,
      typeId: typeId
    }

    socket.emit('setTicketType', payload)
  }

  socketUi.updateTicketType = function () {
    socket.removeAllListeners('updateTicketType')
    socket.on('updateTicketType', function (data) {
      var typeSelect = $('select#tType[data-ticketId="' + data._id + '"] option[value="' + data.type._id + '"]')
      if (typeSelect.length > 0) {
        typeSelect.prop('selected', true)
      } else {
        typeSelect = $('div#tType[data-ticketId="' + data._id + '"]')
        if (typeSelect.length > 0) {
          typeSelect.html(data.type.name)
        }
      }
    })
  }

  socketUi.setTicketPriority = function (ticketId, priority) {
    var payload = {
      ticketId: ticketId,
      priority: priority
    }

    socket.emit('setTicketPriority', payload)
  }

  socketUi.updateTicketPriority = function () {
    socket.removeAllListeners('updateTicketPriority')
    socket.on('updateTicketPriority', function (data) {
      var prioritySelect = $(
        'select#tPriority[data-ticketId="' + data._id + '"] option[value="' + data.priority._id + '"]'
      )
      if (prioritySelect.length > 0) {
        prioritySelect.prop('selected', true)
      }
    })
  }

  socketUi.setTicketGroup = function (ticketId, group) {
    var payload = {
      ticketId: ticketId,
      groupId: group._id
    }

    socket.emit('setTicketGroup', payload)
  }

  socketUi.updateTicketGroup = function () {
    socket.removeAllListeners('updateTicketGroup')
    socket.on('updateTicketGroup', function (data) {
      var groupSelect = $('select#tGroup[data-ticketId="' + data._id + '"] option[value="' + data.group._id + '"]')
      if (groupSelect.length > 0) {
        groupSelect.prop('selected', true)
      } else {
        groupSelect = $('div#tGroup[data-ticketId="' + data._id + '"]')
        if (groupSelect.length > 0) {
          groupSelect.html(data.group.name)
        }
      }
    })
  }

  socketUi.setTicketIssue = function (ticketId, issue, subject) {
    var payload = {
      ticketId: ticketId,
      issue: issue,
      subject: subject
    }

    socket.emit('setTicketIssue', payload)
  }

  socketUi.updateTicketIssue = function () {
    socket.removeAllListeners('updateTicketIssue')
    socket.on('updateTicketIssue', function (data) {
      var $initialIssue = $('.initial-issue[data-ticketid="' + data._id + '"]')
      var $subjectBody = $initialIssue.find('.subject-text')
      var $issueBody = $initialIssue.find('div.issue-text').find('div.issue-body')

      $subjectBody.html(data.subject)
      $issueBody.html(data.issue)
    })
  }

  socketUi.setCommentText = function (ticketId, commentId, commentText) {
    var payload = {
      ticketId: ticketId,
      commentId: commentId,
      commentText: commentText
    }

    socket.emit('setCommentText', payload)
  }

  socketUi.removeComment = function (ticketId, commentId) {
    var payload = {
      ticketId: ticketId,
      commentId: commentId
    }

    socket.emit('removeComment', payload)
  }

  socketUi.setNoteText = function (ticketId, noteId, noteText) {
    var payload = {
      ticketId: ticketId,
      noteId: noteId,
      noteText: noteText
    }

    socket.emit('$trudesk:tickets:setNoteText', payload)
  }

  socketUi.removeNote = function (ticketId, noteId) {
    var payload = {
      ticketId: ticketId,
      noteId: noteId
    }

    socket.emit('$trudesk:tickets:removeNote', payload)
  }

  socketUi.refreshTicketAttachments = function (ticketId) {
    var payload = {
      ticketId: ticketId
    }

    socket.emit('refreshTicketAttachments', payload)
  }

  socketUi.updateTicketAttachments = function () {
    socket.removeAllListeners('updateTicketAttachments')
    socket.on('updateTicketAttachments', function (data) {
      // Rebuild ticket attachments on view
      var ticket = data.ticket
      var canRemoveAttachments = data.canRemoveAttachments

      var $ul = $('ul.attachments[data-ticketid="' + ticket._id + '"]')
      if ($ul.length < 1) return true

      $ul.empty()
      _.each(ticket.attachments, function (attachment) {
        var html = '<li><a href="' + attachment.path + '" class="no-ajaxy" target="_blank">' + attachment.name + '</a>'
        if (canRemoveAttachments) {
          html +=
            '<a href="#" class="remove-attachment" data-attachmentId="' +
            attachment._id +
            '"><i class="fa fa-remove"></i></a></li>'
        }

        $ul.append(html)
      })

      require(['pages/singleTicket'], function (st) {
        st.init()
      })
    })
  }

  socketUi.refreshTicketTags = function (ticketId) {
    var payload = {
      ticketId: ticketId
    }

    socket.emit('refreshTicketTags', payload)
  }

  socketUi.updateTicketTags = function () {
    socket.removeAllListeners('updateTicketTags')
    socket.on('updateTicketTags', function (data) {
      // Rebuild Ticket Tags
      var ticket = data.ticket
      var tagsDiv = $('.tag-list[data-ticketId="' + ticket._id + '"]')
      if (tagsDiv.length < 1) return true

      tagsDiv.html('')
      var html = ''
      if (_.isUndefined(ticket.tags) && _.size(ticket.tags) < 1) return true
      _.each(ticket.tags, function (item) {
        html +=
          '<div class="__TAG_SELECTED hide" style="display: none; opacity: 0; visibility: hidden;">' +
          item._id +
          '</div>' +
          '<div class="item">' +
          item.name +
          '</div>'
      })

      tagsDiv.html(html)
    })
  }

  socketUi.updateUi = function () {
    $(document).ready(function () {
      var $button = $('*[data-updateUi]')
      $.each($button, function () {
        var self = $(this)
        var $action = self.attr('data-updateUi')
        if ($action.toLowerCase() === 'online-users') {
          self.off('click', updateUsersBtnClicked)
          self.on('click', updateUsersBtnClicked)
        } else if ($action.toLowerCase() === 'assigneelist') {
          self.off('click', updateAssigneeList)
          self.on('click', updateAssigneeList)
        } else if ($action.toLowerCase() === 'notifications') {
          self.off('click', updateNotificationsClicked)
          self.on('click', updateNotificationsClicked)
        }
      })
    })
  }

  function updateMailNotificationsClicked (e) {
    socket.emit('updateMailNotifications') // Pointless right now - No Receiver on server
    e.preventDefault()
  }

  function updateUsersBtnClicked (e) {
    e.preventDefault()
    socket.emit('updateUsers')
  }

  socketUi.updateUsers = function () {
    socket.emit('updateUsers')
  }

  function updateAssigneeList (e) {
    socket.emit('updateAssigneeList')
    e.preventDefault()
  }

  function updateNotificationsClicked (e) {
    socket.emit('updateNotifications')
    e.preventDefault()
  }

  socketUi.emitUpdateAllNotifications = function () {
    socket.emit('updateAllNotifications')
  }

  socketUi.updateComments = function () {
    socket.removeAllListeners('updateComments')
    socket.on('updateComments', function (data) {
      var ticket = data
      var canViewNotes = helpers.canUser('tickets:notes')
      var canViewComments = helpers.canUser('comments:view')

      if (!canViewComments) ticket.comments = []
      if (!canViewNotes) ticket.notes = []

      _.each(ticket.comments, function (i) {
        i.isComment = true
      })

      var combined = ticket.comments
      var allCount = ticket.comments.length
      if (canViewNotes) {
        _.each(ticket.notes, function (i) {
          i.isNote = true
        })
        combined = _.union(ticket.comments, ticket.notes)
        allCount = ticket.comments.length + ticket.notes.length
      } else {
        $('#tab-internal-notes[data-ticketid="' + ticket._id + '"]').addClass('hide')
      }

      ticket.commentsAndNotes = _.sortBy(combined, 'date')

      var commentsNotesTab = $('.comments-notes-tab[data-ticketid="' + ticket._id + '"]')

      if (ticket.commentsAndNotes.length < 1) {
        commentsNotesTab.addClass('hide')
        return true
      }

      commentsNotesTab.removeClass('hide')

      var allCommentsContainer = $('.all-comments[data-ticketId="' + ticket._id + '"]')
      var commentContainer = $('.comments[data-ticketId="' + ticket._id + '"]')
      var notesContainer = $('.notes[data-ticketId="' + ticket._id + '"]')

      // Update Comments Tab Badge

      $('#tab-all-comments[data-ticketid="' + ticket._id + '"]')
        .find('span')
        .html(allCount)
      $('#tab-public-comments[data-ticketid="' + ticket._id + '"]')
        .find('span')
        .html(ticket.comments.length)
      $('#tab-internal-notes[data-ticketid="' + ticket._id + '"]')
        .find('span')
        .html(ticket.notes.length)

      var allCommentsHtml = ''
      var commentsHtml = ''
      var notesHtml = ''

      // Build All Comments / Notes Section
      _.each(ticket.commentsAndNotes, function (item) {
        var image = item.owner.image
        if (_.isUndefined(image)) image = 'defaultProfile.jpg'

        if (item.isComment) {
          // Comment
          allCommentsHtml +=
            '<div class="ticket-comment" data-commentid="' +
            item._id +
            '">' +
            '<div class="ticket-comment-image relative uk-clearfix uk-float-left uk-display-inline-block">' +
            '<img class="profile-pic" src="/uploads/users/' +
            image +
            '" alt=""/>' +
            '<span class="uk-border-circle user-offline" data-user-status-id="' +
            item.owner._id +
            '"></span>' +
            '</div>' +
            '<div class="issue-text">' +
            '<h3>Re: ' +
            ticket.subject +
            '</h3>' +
            '<a class="comment-email-link" href="mailto:' +
            item.owner.email +
            '">' +
            item.owner.fullname +
            ' &lt;' +
            item.owner.email +
            '&gt;</a>' +
            '<br />' +
            '<time datetime="' +
            item.date +
            '" data-uk-tooltip="{delay: 250}" title="' +
            helpers.formatDate(item.date, helpers.getLongDateFormat() + ', ' + helpers.getTimeFormat()) +
            '">' +
            helpers.getCalendarDate(item.date) +
            '</time>' +
            '<div class="comment-body"><p>' +
            item.comment +
            '</p></div>' +
            '</div>' +
            '<div class="edit-comment-form uk-clearfix hide" data-commentid="' +
            item._id +
            '" style="margin-bottom: 15px;">' +
            '<form data-commentid="' +
            item._id +
            '" data-abide>' +
            '<div class="edit-comment-box">' +
            '<textarea name="commentText" id="commentText" cols="2" rows="5" data-clearOnSubmit="true" class="md-input" required data-validation="length" data-validation-length="min5" data-validation-error-msg="Please enter a valid comment. Comment must contain at least 5 characters."></textarea>' +
            '</div>' +
            '<div class="right">' +
            '<button class="uk-button resetForm" type="reset" style="margin-right: 5px;">Cancel</button>' +
            '<button class="uk-button" type="submit" data-preventDefault="false">Save</button>' +
            '</div>' +
            '</form>' +
            '</div>' +
            '<div class="comment-actions">'
          if (helpers.hasPermOverRole(item.owner.role._id, null, 'comments:delete', true)) {
            allCommentsHtml +=
              '<div class="remove-comment" data-commentId="' +
              item._id +
              '"><i class="material-icons">&#xE5CD;</i></div>'
          }

          if (helpers.hasPermOverRole(item.owner.role._id, null, 'comments:update', true)) {
            allCommentsHtml +=
              '<div class="edit-comment" data-commentId="' +
              item._id +
              "\" ng-click=\"showEditWindow('comment', false, '" +
              item._id +
              '\');"><i class="material-icons">&#xE254;</i></div>'
          }

          allCommentsHtml += '</div>' + '</div>'
        } else if (item.isNote) {
          allCommentsHtml +=
            '<div class="ticket-note" data-noteid="' +
            item._id +
            '">' +
            '<div class="ticket-comment-image relative uk-clearfix uk-float-left uk-display-inline-block">' +
            '<img class="profile-pic" src="/uploads/users/' +
            image +
            '" alt=""/>' +
            '<span class="uk-border-circle user-offline" data-user-status-id="' +
            item.owner._id +
            '"></span>' +
            '</div>' +
            '<div class="issue-text">' +
            '<h3>Re: ' +
            ticket.subject +
            '</h3>' +
            '<a class="comment-email-link" href="mailto:' +
            item.owner.email +
            '">' +
            item.owner.fullname +
            ' &lt;' +
            item.owner.email +
            '&gt;</a>' +
            '<br />' +
            '<time datetime="' +
            item.date +
            '" data-uk-tooltip="{delay: 250}" title="' +
            helpers.formatDate(item.date, helpers.getLongDateFormat() + ', ' + helpers.getTimeFormat()) +
            '">' +
            helpers.getCalendarDate(item.date) +
            '</time>' +
            '<br />' +
            '<span class="uk-badge uk-badge-small nomargin-left-right text-white">NOTE</span>' +
            '<div class="comment-body"><p>' +
            item.note +
            '</p></div>' +
            '</div>' +
            '<div class="edit-note-form uk-clearfix hide" data-noteid="' +
            item._id +
            '" style="margin-bottom: 15px;">' +
            '<form data-noteid="' +
            item._id +
            '" data-abide>' +
            '<div class="edit-comment-box">' +
            '<textarea name="noteText" id="noteText" cols="2" rows="5" data-clearOnSubmit="true" class="md-input" required data-validation="length" data-validation-length="min5" data-validation-error-msg="Please enter a valid note. A note must contain at least 5 characters."></textarea>' +
            '</div>' +
            '<div class="right">' +
            '<button class="uk-button resetForm" type="reset" style="margin-right: 5px;">Cancel</button>' +
            '<button class="uk-button" type="submit" data-preventDefault="false">Save</button>' +
            '</div>' +
            '</form>' +
            '</div>' +
            '<div class="comment-actions">'
          if (helpers.hasPermOverRole(item.owner.role._id, null, 'tickets:notes', true)) {
            allCommentsHtml +=
              '<div class="remove-note" data-noteid="' + item._id + '"><i class="material-icons">&#xE5CD;</i></div>'
          }

          if (helpers.hasPermOverRole(item.owner.role._id, null, 'tickets:notes', true)) {
            allCommentsHtml +=
              '<div class="edit-note" data-noteid="' +
              item._id +
              "\" ng-click=\"showEditWindow('note', false, '" +
              item._id +
              '\');"><i class="material-icons">&#xE254;</i></div>'
          }

          allCommentsHtml += '</div>' + '</div>'
        }
      })

      _.each(ticket.comments, function (comment) {
        var image = comment.owner.image
        if (_.isUndefined(image)) image = 'defaultProfile.jpg'

        commentsHtml +=
          '<div class="ticket-comment" data-commentid="' +
          comment._id +
          '">' +
          '<div class="ticket-comment-image relative uk-clearfix uk-float-left uk-display-inline-block">' +
          '<img class="profile-pic" src="/uploads/users/' +
          image +
          '" alt=""/>' +
          '<span class="uk-border-circle user-offline" data-user-status-id="' +
          comment.owner._id +
          '"></span>' +
          '</div>' +
          '<div class="issue-text">' +
          '<h3>Re: ' +
          ticket.subject +
          '</h3>' +
          '<a class="comment-email-link" href="mailto:' +
          comment.owner.email +
          '">' +
          comment.owner.fullname +
          ' &lt;' +
          comment.owner.email +
          '&gt;</a>' +
          '<br />' +
          '<time datetime="' +
          comment.date +
          '" data-uk-tooltip="{delay: 250}" title="' +
          helpers.formatDate(comment.date, helpers.getLongDateFormat() + ', ' + helpers.getTimeFormat()) +
          '">' +
          helpers.getCalendarDate(comment.date) +
          '</time>' +
          '<div class="comment-body"><p>' +
          comment.comment +
          '</p></div>' +
          '</div>' +
          '<div class="edit-comment-form uk-clearfix hide" data-commentid="' +
          comment._id +
          '" style="margin-bottom: 15px;">' +
          '<form data-commentid="' +
          comment._id +
          '" data-abide>' +
          '<div class="edit-comment-box">' +
          '<textarea name="commentText" id="commentText" cols="2" rows="5" data-clearOnSubmit="true" class="md-input" required data-validation="length" data-validation-length="min5" data-validation-error-msg="Please enter a valid comment. Comment must contain at least 5 characters."></textarea>' +
          '</div>' +
          '<div class="right">' +
          '<button class="uk-button resetForm" type="reset" style="margin-right: 5px;">Cancel</button>' +
          '<button class="uk-button" type="submit" data-preventDefault="false">Save</button>' +
          '</div>' +
          '</form>' +
          '</div>' +
          '<div class="comment-actions">'
        if (helpers.hasPermOverRole(comment.owner.role._id, null, 'comments:delete', true)) {
          commentsHtml +=
            '<div class="remove-comment" data-commentId="' +
            comment._id +
            '"><i class="material-icons">&#xE5CD;</i></div>'
        }

        if (helpers.hasPermOverRole(comment.owner.role._id, null, 'comments:update', true)) {
          commentsHtml +=
            '<div class="edit-comment" data-commentId="' +
            comment._id +
            "\" ng-click=\"showEditWindow('comment', false, '" +
            comment._id.toString() +
            '\');"><i class="material-icons">&#xE254;</i></div>'
        }

        commentsHtml += '</div>' + '</div>'
      })

      _.each(ticket.notes, function (note) {
        var image = note.owner.image
        if (_.isUndefined(image)) image = 'defaultProfile.jpg'

        notesHtml +=
          '<div class="ticket-note" data-noteid="' +
          note._id +
          '">' +
          '<div class="ticket-comment-image relative uk-clearfix uk-float-left uk-display-inline-block">' +
          '<img class="profile-pic" src="/uploads/users/' +
          image +
          '" alt=""/>' +
          '<span class="uk-border-circle user-offline" data-user-status-id="' +
          note.owner._id +
          '"></span>' +
          '</div>' +
          '<div class="issue-text">' +
          '<h3>Re: ' +
          ticket.subject +
          '</h3>' +
          '<a class="comment-email-link" href="mailto:' +
          note.owner.email +
          '">' +
          note.owner.fullname +
          ' &lt;' +
          note.owner.email +
          '&gt;</a>' +
          '<br />' +
          '<time datetime="' +
          note.date +
          '" data-uk-tooltip="{delay: 250}" title="' +
          helpers.formatDate(note.date, helpers.getLongDateFormat() + ', ' + helpers.getTimeFormat()) +
          '">' +
          helpers.getCalendarDate(note.date) +
          '</time>' +
          '<br />' +
          '<span class="uk-badge uk-badge-small nomargin-left-right text-white">NOTE</span>' +
          '<div class="comment-body"><p>' +
          note.note +
          '</p></div>' +
          '</div>' +
          '<div class="edit-note-form uk-clearfix hide" data-noteid="' +
          note._id +
          '" style="margin-bottom: 15px;">' +
          '<form data-noteid="' +
          note._id +
          '" data-abide>' +
          '<div class="edit-comment-box">' +
          '<textarea name="noteText" id="noteText" cols="2" rows="5" data-clearOnSubmit="true" class="md-input" required data-validation="length" data-validation-length="min5" data-validation-error-msg="Please enter a valid note. A note must contain at least 5 characters."></textarea>' +
          '</div>' +
          '<div class="right">' +
          '<button class="uk-button resetForm" type="reset" style="margin-right: 5px;">Cancel</button>' +
          '<button class="uk-button" type="submit" data-preventDefault="false">Save</button>' +
          '</div>' +
          '</form>' +
          '</div>' +
          '<div class="comment-actions">'
        if (helpers.hasPermOverRole(note.owner.role._id, null, 'tickets:notes', true)) {
          notesHtml +=
            '<div class="remove-note" data-noteid="' + note._id + '"><i class="material-icons">&#xE5CD;</i></div>'
        }

        if (helpers.hasPermOverRole(note.owner.role._id, null, 'tickets:notes', true)) {
          notesHtml +=
            '<div class="edit-note" data-noteid="' +
            note._id +
            "\" ng-click=\"showEditWindow('note', false, '" +
            note._id +
            '\');"><i class="material-icons">&#xE254;</i></div>'
        }

        notesHtml += '</div>' + '</div>'
      })

      // allCommentsContainer.html(allCommentsHtml)
      // Inject Angular to new links
      var $injector = angular.injector(['ng', 'trudesk'])
      $injector.invoke([
        '$compile',
        '$rootScope',
        function ($compile, $rootScope) {
          var $scope = allCommentsContainer.html(allCommentsHtml).scope()
          $compile(allCommentsContainer)($scope || $rootScope)
          $rootScope.$digest()
        }
      ])

      // commentContainer.html(commentsHtml)

      // Inject Angular to new links
      $injector = angular.injector(['ng', 'trudesk'])
      $injector.invoke([
        '$compile',
        '$rootScope',
        function ($compile, $rootScope) {
          var $scope = commentContainer.html(commentsHtml).scope()
          $compile(commentContainer)($scope || $rootScope)
          $rootScope.$digest()
        }
      ])

      if (canViewNotes) {
        // notesContainer.html(notesHtml)

        // Inject Angular to new links
        $injector = angular.injector(['ng', 'trudesk'])
        $injector.invoke([
          '$compile',
          '$rootScope',
          function ($compile, $rootScope) {
            var $scope = notesContainer.html(notesHtml).scope()
            $compile(notesContainer)($scope || $rootScope)
            $rootScope.$digest()
          }
        ])
      }
      helpers.resizeAll()

      require(['pages/singleTicket'], function (st) {
        st.init()
      })
    })
  }

  socketUi.clearNotifications = function () {
    socket.emit('clearNotifications')

    helpers.hideAllpDropDowns()
  }

  socketUi.markNotificationRead = function (_id) {
    socket.emit('markNotificationRead', _id)

    helpers.hideAllpDropDowns()
  }

  socketUi.updateNotifications = function () {
    socket.emit('updateNotifications')
  }

  socketUi.updateAllNotifications = function () {
    socket.removeAllListeners('updateAllNotifications')
    socket.on('updateAllNotifications', function (data) {
      // All Notifications
      var $notificationsTable = $('table.notificationsTable')
      var $tbody = $notificationsTable.find('tbody')
      $tbody.html('')
      _.each(data.items, function (item) {
        if (!item.data && item.data.ticket) return
        var html = ''
        html +=
          '<tr class="notification-row ' +
          (item.unread ? 'unread' : '') +
          '" data-notificationid="' +
          item._id +
          '" data-ticket-uid="' +
          item.data.ticket.uid +
          '" ng-click="notificationClick($event)">'
        html += '<td class="type">'
        html += '<i class="fa fa-2x fa-check"></i>'
        html += '</td>'
        html += '<td class="title">'
        html += '<p>' + item.title + '</p>'
        html += '<div class="body">'
        html += item.message
        html += '</div>'
        html += '</td>'
        html += '<td class="date">'
        html +=
          '<time datetime="' +
          helpers.formatDate(item.created, 'YYYY-MM-DDThh:mm') +
          '">' +
          helpers.formatDate(item.created, 'MMM DD, YYYY') +
          '</time>'
        html += '</td>'
        html += '</tr>'

        $tbody.append(html)

        var $nRows = $tbody.find('.notification-row')
        $.each($nRows, function (k, val) {
          var $item = $(val)
          $item.off('click')
          $item.on('click', function (e) {
            e.preventDefault()
            e.stopPropagation()
            var $id = $(e.currentTarget).attr('data-notificationId')
            var $uid = $(e.currentTarget).attr('data-ticket-uid')
            socketUi.markNotificationRead($id)
            helpers.closeNotificationsWindow()
            History.pushState(null, null, '/tickets/' + $uid)
          })
        })
      })
    })
  }

  socketUi.onTicketCreated = function () {
    socket.removeAllListeners('ticket:created')
    socket.on('ticket:created', function () {
      socket.emit('updateNotifications')
      var audio = $('audio#newticketaudio')
      if (audio.length > 0) audio.trigger('play')
      $('a#refreshTicketGrid').trigger('click')
    })
  }

  socketUi.onTicketDelete = function () {
    socket.removeAllListeners('ticket:delete')
    socket.on('ticket:delete', function () {
      var refreshEnabled = $('input#refreshSwitch:checked')
      if (refreshEnabled.length > 0) {
        $('a#refreshTicketGrid').trigger('click')
      }
    })
  }

  socketUi.onUpdateTicketGrid = function () {
    socket.removeAllListeners('ticket:updategrid')
    socket.on('ticket:updategrid', function () {
      var refreshEnabled = $('input#refreshSwitch:checked')
      if (refreshEnabled.length > 0) {
        $('a#refreshTicketGrid').trigger('click')
      }
    })
  }

  socketUi.onProfileImageUpdate = function () {
    socket.removeAllListeners('trudesk:profileImageUpdate')
    socket.on('trudesk:profileImageUpdate', function (data) {
      var profileImage = $('#profileImage[data-userid="' + data.userid + '"]')
      if (profileImage.length > 0) {
        profileImage.attr('src', '/uploads/users/' + data.img + '?r=' + new Date().getTime())
      }
    })
  }

  return socketUi
})
