/**
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

define('modules/ui', [
    'jquery',
    'underscore',
    'modules/helpers',
    'modules/navigation',
    'modules/socket.io/messagesUI',
    'modules/socket.io/noticeUI',
    'nicescroll',
    'history'

], function($, _, helpers, nav, msgUI, noticeUI) {
    var socketUi = {},
        socket = io.connect();

    socketUi.socket = socket;

    socketUi.init = function() {
        this.onReconnect();
        this.onDisconnect();
        this.updateNotifications();
        this.updateMailNotifications();
        this.updateComments();
        this.updateUi();
        this.updateTicketStatus();
        this.updateAssigneeList();
        this.updateAssignee();
        this.updateTicketType();
        this.updateTicketPriority();
        this.updateTicketGroup();
        this.updateTicketIssue();
        this.updateTicketAttachments();

        //Events
        this.onTicketCreated();
        this.onTicketDelete();

        this.updateMessagesFolder(socket);
        this.updateSingleMessageItem(socket);
        this.updateShowNotice(socket);
        this.updateClearNotice(socket);
    };

    socketUi.setMessageRead = function(messageId) {
        msgUI.setMessageRead(socket, messageId);
    };

    socketUi.sendUpdateMessageFolder = function(folder) {
        socket.emit('updateMessageFolder', {folder: folder});
    };

    socketUi.moveMessageToFolder = function(messageIds, toFolder, folderToRefresh) {
        socket.emit('moveMessageToFolder', messageIds, toFolder, folderToRefresh);
    };

    socketUi.deletedMessages = function(messageIds) {
        socket.emit('deleteMessages', messageIds);
    };

    socketUi.updateSingleMessageItem = msgUI.updateSingleMessageItem;
    socketUi.updateMessagesFolder = msgUI.updateMessagesFolder;

    socketUi.setShowNotice = function(notice) {
        noticeUI.setShowNotice(socket, notice);
    };

    socketUi.setClearNotice = function() {
        noticeUI.setClearNotice(socket);
    };

    socketUi.updateShowNotice = noticeUI.updateShowNotice;
    socketUi.updateClearNotice = noticeUI.updateClearNotice;

    socketUi.onReconnect = function() {
        socket.removeAllListeners('reconnect');
        socket.on('reconnect', function() {
            helpers.clearFlash();
        });
    };

    socketUi.onDisconnect = function() {
        socket.removeAllListeners('disconnect');
        socket.on('disconnect', function(data) {
            helpers.showFlash('Disconnected from server. Reconnecting...', true, true);
        });

        socket.removeAllListeners('reconnect_attempt');
        socket.on('reconnect_attempt', function(err) {
            helpers.showFlash('Disconnected from server. Reconnecting...', true, true);
        });

        socket.removeAllListeners('connect_timeout');
        socket.on('connect_timeout', function(err) {
            helpers.showFlash('Disconnected from server. Reconnecting...', true, true);
        });
    };

    socketUi.sendUpdateTicketStatus = function(id, status) {
        socket.emit('updateTicketStatus', {ticketId: id, status: status});
    };

    socketUi.clearAssignee = function(id) {
        socket.emit('clearAssignee', id);
    };

    socketUi.updateMailNotifications = function() {
        $(document).ready(function() {
            var btnMailNotifications = $('#btn_mail-notifications');
            btnMailNotifications.off('click', updateMailNotificationsClicked);
            btnMailNotifications.on('click', updateMailNotificationsClicked);
        });

        socket.removeAllListeners('updateMailNotifications');
        socket.on('updateMailNotifications', function(data) {
            var label = $('#btn_mail-notifications').find('> span');
            var count = data.unreadCount;
            var items = data.unreadItems;
            if (count < 1) {
                label.hide();
            } else {
                label.html(count);
                label.show();
            }

            var mailDropList = $('div.mail-Messages').find('ul');
            mailDropList.find('li').each(function() {
                $(this).remove();
            });

            var html = "";

            _.each(items, function(item) {
                html    += '<li>';
                html    += '<a class="messageNotification" href="/messages/' + item._id + '" role="button">';
                html    += '<div class="clearfix">';
                if (item.from.image)
                    html    += '<div class="profilePic left"><img src="/uploads/users/' + item.from.image + '" alt="profile"/></div>';
                else
                    html    += '<div class="profilePic left"><img src="/uploads/users/defaultProfile.jpg" alt="profile"/></div>';
                html    += '<div class="messageAuthor"><strong>' + item.from.fullname + '</strong></div>';
                html    += '<div class="messageSnippet">';
                html    += '<span>' + item.subject + '</span>';
                html    += '</div>';
                html    += '<div class="messageDate">';
                html    += '<time datetime="' + helpers.formatDate(item.date, "YYYY-MM-DDThh:mm") + '" class="timestamp">' + helpers.formatDate(item.date, "MMM DD, YYYY") + '</time>';
                html    += '</div>';
                html    += '</div>';
                html    += '</a>';
                html    += '</li>';
            });

            mailDropList.append(html);
        });
    };

    socketUi.updateTicketStatus = function() {
        socket.removeAllListeners('updateTicketStatus');
        socket.on('updateTicketStatus', function(payload) {
            var ticketId = payload.tid;
            var status = payload.status;
            var statusSelectBox = $('#statusSelect');
            if (statusSelectBox.length > 0) statusSelectBox.addClass('hide');

            var tStatusBox = $('.floating-ticket-status[data-ticketId="' + ticketId + '"] > .ticket-status');
            if (tStatusBox.length > 0) {
                tStatusBox.removeClass('ticket-new');
                tStatusBox.removeClass('ticket-open');
                tStatusBox.removeClass('ticket-pending');
                tStatusBox.removeClass('ticket-closed');

                var s = 'New';
                var c = 'ticket-new';
                switch (status) {
                    case 0:
                        s = 'New';
                        c = 'ticket-new';
                        break;
                    case 1:
                        s = 'Open';
                        c = 'ticket-open';
                        break;
                    case 2:
                        s = 'Pending';
                        c = 'ticket-pending';
                        break;
                    case 3:
                        s = 'Closed';
                        c = 'ticket-closed';
                        break;
                }

                tStatusBox.find('span').html(s);
                tStatusBox.addClass(c);

                var ticketReply = $('.ticket-reply');
                var assigneeListBtn = $('.ticket-assignee > a');
                var ticketTypeSelect = $('select#tType');
                var ticketPriority = $('select#tPriority');
                var ticketGroup = $('select#tGroup');

                if (status === 3) {
                    //Remove Comment Box
                    if (ticketReply.length > 0) {
                        ticketReply.addClass('hide');
                    }

                    //Setup assignee list on Closed
                    if (assigneeListBtn.length > 0) {
                        assigneeListBtn.removeAttr('data-notifications');
                        assigneeListBtn.removeAttr('data-updateUi');
                        nav.notifications();
                    }
                    //Disabled Ticket Details
                    if (ticketTypeSelect.length > 0) {
                        ticketTypeSelect.prop('disabled', true);
                    }
                    if (ticketPriority.length > 0) {
                        ticketPriority.prop('disabled', true);
                    }
                    if (ticketGroup.length > 0) {
                        ticketGroup.prop('disabled', true);
                    }

                } else {
                    if (ticketReply.length > 0) {
                        ticketReply.removeClass('hide');
                    }

                    //Enable Ticket Details
                    if (ticketTypeSelect.length > 0) {
                        ticketTypeSelect.prop('disabled', false);
                    }
                    if (ticketPriority.length > 0) {
                        ticketPriority.prop('disabled', false);
                    }
                    if (ticketGroup.length > 0) {
                        ticketGroup.prop('disabled', false);
                    }

                    //Setup assignee list
                    if (assigneeListBtn.length > 0) {
                        assigneeListBtn.attr('data-notifications', 'assigneeDropdown');
                        assigneeListBtn.attr('data-updateui', 'assigneeList');
                        nav.notifications();
                        socketUi.updateUi();
                    }
                }
            }
        });
    };

    socketUi.updateAssigneeList = function() {
        socket.removeAllListeners('updateAssigneeList');
        socket.on('updateAssigneeList', function(users) {
            var wrapper = '';
            _.each(users, function(user) {
                var html = '<li data-setAssignee="' + user._id + '">';
                html    += '<a class="messageNotification" href="#" role="button">';
                html    += '<div class="clearfix">';
                if (_.isUndefined(user.image)) {
                    html    += '<div class="profilePic left"><img src="/uploads/users/defaultProfile.jpg" alt="profile"/></div>';
                } else {
                    html    += '<div class="profilePic left"><img src="/uploads/users/' + user.image + '" alt="profile"/></div>';
                }
                html    += '<div class="messageAuthor"><strong>' + user.fullname + '</strong></div>';
                html    += '<div class="messageSnippet">';
                html    += '<span>' + user.email + '</span>';
                html    += '</div>';
                html    += '<div class="messageDate">';
                html    += '<span>' + user.title + '</span>';
                html    += '</div>';
                html    += '</div>';
                html    += '</a>';
                html    += '</li>';

                wrapper += html;
            });

            var assigneeListDrop = $('#assigneeDropdown-content > ul');
            if (assigneeListDrop.length > 0) {
                assigneeListDrop.html(wrapper);

                $.each(assigneeListDrop.find('li[data-setAssignee]'), function() {
                    var self = $(this);
                    var $_id = self.attr('data-setAssignee');
                    self.off('click', setAssigneeClicked);
                    self.on('click', {_id: $_id}, setAssigneeClicked);
                });
            }
        });
    };

    function setAssigneeClicked(e) {
        var _id = e.data._id;
        var ticketId = $('#__ticketId').html();
        var payload = {
            _id: _id,
            ticketId: ticketId
        };

        socket.emit('setAssignee', payload);

        e.preventDefault();
    }

    socketUi.updateAssignee = function() {
        socket.removeAllListeners('updateAssignee');
        socket.on('updateAssignee', function(ticket) {
            var assigneeContainer = $('.ticket-assignee[data-ticketId="' + ticket._id + '"]');
            if (assigneeContainer.length > 0) {
                var image = _.isUndefined(ticket.assignee) ? 'defaultProfile.jpg' : ticket.assignee.image;
                if (_.isUndefined(image)) image = 'defaultProfile.jpg';
                assigneeContainer.find('a > img').attr('src', '/uploads/users/' + image);
                var details = assigneeContainer.find('.ticket-assignee-details');
                if (details.length > 0) {
                    var name = _.isUndefined(ticket.assignee) ? 'No User Assigned' : ticket.assignee.fullname;
                    details.find('h3').html(name);
                    var a = details.find('a.comment-email-link');
                    var email = _.isUndefined(ticket.assignee) ? '' : ticket.assignee.email;
                    if (a.length > 0) {
                        a.attr('href', 'mailto:' + email).html(email);
                    } else {
                        a = $('<a></a>').attr('href', 'mailto:' + email).html(email).addClass('comment-email-link');
                        details.append(a);
                    }

                    var span = details.find('span');
                    var title = _.isUndefined(ticket.assignee) ? '' : ticket.assignee.title;
                    if (span.length > 0) {
                        span.html(title);
                    } else {
                        span = $('<span></span>').html(title);
                        details.append(span);
                    }
                }
            }

            $('#assigneeDropdown').removeClass('pDropOpen');
            helpers.hideDropDownScrolls();
        });
    };

    socketUi.setTicketType = function(ticketId, typeId) {
        var payload = {
            ticketId: ticketId,
            typeId: typeId
        };

        socket.emit('setTicketType', payload);
    };

    socketUi.updateTicketType = function() {
        socket.removeAllListeners('updateTicketType');
        socket.on('updateTicketType', function(data) {
            var typeSelect = $('select#tType[data-ticketId="' + data._id + '"] option[value="' + data.type._id + '"]');
            if (typeSelect.length > 0) {
                typeSelect.prop('selected', true);
            } else {
                typeSelect = $('div#tType[data-ticketId="' + data._id + '"]');
                if (typeSelect.length > 0) {
                    typeSelect.html(data.type.name);
                }
            }
        });
    };

    socketUi.setTicketPriority = function(ticketId, priority) {
        var payload = {
            ticketId: ticketId,
            priority: priority
        };

        socket.emit('setTicketPriority', payload);
    };

    socketUi.updateTicketPriority = function() {
        socket.removeAllListeners('updateTicketPriority');
        socket.on('updateTicketPriority', function(data) {
            var prioritySelect = $('select#tPriority[data-ticketId="' + data._id + '"] option[value="' + data.priority + '"]');
            if (prioritySelect.length > 0) {
                prioritySelect.prop('selected', true);
            } else {
                prioritySelect = $('div#tPriority[data-ticketId="' + data._id + '"]');
                if (prioritySelect.length > 0) {
                    var priorityname = 'Normal';
                    switch (data.priority) {
                        case 1:
                            priorityname = 'Normal';
                            break;
                        case 2:
                            priorityname = 'Urgent';
                            break;
                        case 3:
                            priorityname = 'Critical';
                            break;
                    }

                    prioritySelect.html(priorityname);
                }
            }
        });
    };

    socketUi.setTicketGroup = function(ticketId, group) {
        var payload = {
            ticketId: ticketId,
            groupId: group._id
        };

        socket.emit('setTicketGroup', payload);
    };

    socketUi.updateTicketGroup = function() {
        socket.removeAllListeners('updateTicketGroup');
        socket.on('updateTicketGroup', function(data) {
            var groupSelect = $('select#tGroup[data-ticketId="' + data._id + '"] option[value="' + data.group._id + '"]');
            if (groupSelect.length > 0) {
                groupSelect.prop('selected', true);
            } else {
                groupSelect = $('div#tGroup[data-ticketId="' + data._id + '"]');
                if (groupSelect.length > 0) {
                    groupSelect.html(data.group.name);
                }
            }
        });
    };

    socketUi.setTicketIssue = function(ticketId, issue) {
        var payload = {
            ticketId: ticketId,
            issue: issue
        };

        socket.emit('setTicketIssue', payload);
    };

    socketUi.updateTicketIssue = function() {
        socket.removeAllListeners('updateTicketIssue');
        socket.on('updateTicketIssue', function(data) {
            var issueText = $('.initial-issue[data-ticketid="' + data._id + '"]').find('div.issue-text').find('div.issue-body');
            var issueForm = $('.edit-issue-form');
            if (issueText.length > 0) {
                issueText.html(data.issue);
                issueForm.addClass('hide');
                issueText.removeClass('hide');
            }
        });
    };

    socketUi.setCommentText = function(ticketId, commentId, commentText) {
        var payload = {
            ticketId: ticketId,
            commentId: commentId,
            commentText: commentText
        };

        socket.emit('setCommentText', payload);
    };

    socketUi.removeComment = function(ticketId, commentId) {
        var payload = {
            ticketId: ticketId,
            commentId: commentId
        };


        socket.emit('removeComment', payload);
    };

    socketUi.refreshTicketAttachments = function(ticketId) {
        var payload = {
            ticketId: ticketId
        };

        socket.emit('refreshTicketAttachments', payload);
    };

    socketUi.updateTicketAttachments = function() {
        socket.removeAllListeners('updateTicketAttachments');
        socket.on('updateTicketAttachments', function(ticket) {
            //Rebuild ticket attachments on view
            var $ul = $('ul.attachments[data-ticketid="' + ticket._id + '"]');
            if ($ul.length < 1) return true;

            $ul.empty();
            _.each(ticket.attachments, function(attachment) {
                var html = '<li><a href="' + attachment.path + '" class="no-ajaxy" target="_blank">' + attachment.name + '</a></li>';

                $ul.append(html);
            });
        });
    };

    socketUi.updateUi = function() {
        $(document).ready(function() {
            var $button = $('*[data-updateUi]');
            $.each($button, function() {
                var self = $(this);
                var $action = self.attr('data-updateUi');
                if ($action.toLowerCase() === 'online-users') {
                    self.off('click', updateUsersBtnClicked);
                    self.on('click', updateUsersBtnClicked);
                }
                else if ($action.toLowerCase() === 'assigneelist') {
                    self.off('click', updateAssigneeList);
                    self.on('click', updateAssigneeList);
                }
                else if ($action.toLowerCase() === 'notifications') {
                    self.off('click', updateNotificationsClicked);
                    self.on('click', updateNotificationsClicked);
                }

            });
        });
    };

    function updateMailNotificationsClicked(e) {
        socket.emit('updateMailNotifications');
        e.preventDefault();
    }

    function updateUsersBtnClicked(e) {
        socket.emit('updateUsers');
        e.preventDefault();
    }

    function updateAssigneeList(e) {
        socket.emit('updateAssigneeList');
        e.preventDefault();
    }

    function updateNotificationsClicked(e) {
        socket.emit('updateNotifications');
        e.preventDefault();
    }

    socketUi.updateComments = function() {
        $(document).ready(function() {
            var $commentForm = $('form#comment-reply');
            if ($commentForm.length > 0) {
                $commentForm.on("valid invalid submit", function (e) {
                    var self = $(this);
                    e.stopPropagation();
                    e.preventDefault();
                    if (e.type === "valid") {
                        $.ajax({
                            type: self.attr('method'),
                            url: self.attr('action'),
                            data: self.serialize(),
                            success: function () {
                                //send socket to add reply.
                                $('form#comment-reply').find('*[data-clearOnSubmit="true"]').each(function () {
                                    $(this).val('');
                                });

                                var tId = $('input[name="ticketId"]').val();

                                socket.emit('updateComments', {ticketId: tId});

                                var obj = $('.comments').parents('.page-content');
                                helpers.resizeFullHeight();
                                helpers.resizeScroller();
                                helpers.scrollToBottom(obj);
                            }
                        });
                    }
                });
            }

            return false;
        });

        socket.removeAllListeners('updateComments');
        socket.on('updateComments', function(data) {

            var ticket = data;
            var commentContainer = $('.comments[data-ticketId="' + ticket._id + '"]');
            //var comment = $(ticket.comments).get(-1);

            var commentText = 'Comments';
            //if (_.isUndefined(ticket.comments)) return;
            if(_.size(ticket.comments) === 1) commentText = 'Comment';

            $('.page-top-comments > a[data-ticketId="' + ticket._id + '"]').html(ticket.comments.length + ' ' + commentText);

            var html = '';
            _.each(ticket.comments, function(comment) {
                var image = comment.owner.image;
                if (_.isUndefined(image)) image = 'defaultProfile.jpg';

                html +=  '<div class="ticket-comment" data-commentid="' + comment._id + '">' +
                    '<img src="/uploads/users/' + image + '" alt=""/>' +
                    '<div class="issue-text">' +
                    '<h3>Re: ' + ticket.subject + '</h3>' +
                    '<a href="mailto:' + comment.owner.email + '">' + comment.owner.fullname + ' &lt;' + comment.owner.email + '&gt;</a>' +
                    '<time datetime="' + comment.date + '">' + helpers.formatDate(comment.date, "MMM DD, h:mma") + '</time>' +
                    '<div class="comment-body"><p>' + comment.comment + '</p></div>' +
                    '</div>' +
                    '<div class="edit-comment-form clearfix hide" data-commentid="' + comment._id + '" style="margin-bottom: 15px;">' +
                        '<form data-commentid="' + comment._id + '" data-abide>' +
                            '<div class="edit-comment-box">' +
                                '<textarea name="commentText" id="commentText" cols="2" rows="5" data-clearOnSubmit="true" required pattern="is5Long"></textarea>' +
                                '<small class="error">Please enter a valid comment. Issue must contain at least 5 characters.</small>' +
                            '</div>' +
                            '<div class="right">' +
                                '<button class="resetForm" type="reset" style="margin-right: 5px;">Cancel</button>' +
                                '<button type="submit" data-preventDefault="false">Save</button>' +
                            '</div>' +
                        '</form>' +
                    '</div>' +
                    '<div class="comment-actions">' +
                    '<div class="remove-comment" data-commentId="' + comment._id + '"><i class="fa fa-times fa-lg"></i></div>' +
                    '<div class="edit-comment" data-commentId="' + comment._id + '"><i class="fa fa-pencil fa-lg"></i></div>' +
                    '</div>' +
                    '</div>';
            });

            commentContainer.html(html);
            require(['pages/singleTicket'], function(st) {
                st.init();
            });
        });
    };

    socketUi.clearNotifications = function() {
        socket.emit('clearNotifications');

        helpers.hideAllpDropDowns();
    };

    socketUi.markNotificationRead = function(_id) {
        socket.emit('markNotificationRead', _id);

        helpers.hideAllpDropDowns();
    };

    socketUi.updateNotifications = function() {
        socket.removeAllListeners('updateNotifications');
        socket.on('updateNotifications', function(data) {

            var $notifications = $('#notifications-Messages').find('ul');
            if ($notifications.length < 1) return;

            $notifications.html('');
            //Build Notifications
            _.each(data.items, function(item) {
                var html = '';
                html += '<li>' +
                    '<a class="messageNotification" href="/tickets/' + item.data.ticket.uid + '" role="button" data-notificationId="' + item._id + '" >' +
                        '<div class="clearfix">';
                if (item.unread === true) {
                    html += '<div class="messageUnread"></div>';
                }
                switch (item.type) {
                    case 0:
                        html += '<div class="messageIcon left"><i class="fa fa-check green"></i></div>';
                        break;
                    case 1:
                        html += '<div class="messageIcon left"><i class="fa fa-warning"></i></div>';
                        break;
                    case 2:
                        html += '<div class="messageIcon left"><i class="fa fa-exclamation red"></i></div>';
                        break;
                }

                html += '<div class="messageAuthor"><strong>' + item.title + '</strong></div>' +
                        '<div class="messageSnippet">' +
                        '<span>' + item.message + '</span>' +
                        '</div>' +
                        '<div class="messageDate">' +
                        '<time datetime="' + helpers.formatDate(item.created, "YYYY-MM-DDThh:mm") + '" class="timestamp">' + helpers.formatDate(item.created, "MMM DD, YYYY") + '</time>' +
                        '</div>' +
                        '</div>' +
                        '</a>' +
                        '</li>';

                $notifications.append(html);

                var $nLinks = $('#notifications-Messages').find('a[data-notificationId]');
                $.each($nLinks, function(k, val) {
                    var item = $(val);
                    item.off('click');
                    item.on('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var $id = $(e.currentTarget).attr('data-notificationId');
                        var $href = $(e.currentTarget).attr('href');
                        if ($id.length < 1) return;

                        socketUi.markNotificationRead($id);

                        History.pushState(null, null, $href);
                    });
                });
            });

            var $notificationsCount = $('#btn_notifications').find('span');
            if ($notificationsCount.length > 0) {
                if (data.count == 0) {
                    $notificationsCount.html('0');
                    $notificationsCount.addClass('hide');
                } else {
                    $notificationsCount.removeClass('hide');
                    $notificationsCount.html(data.count);
                }
            }
        });
    };

    socketUi.onTicketCreated = function() {
        socket.removeAllListeners('ticket:created');
        socket.on('ticket:created', function(data) {
            socket.emit('updateNotifications');
            $('a#refreshTicketGrid').trigger('click');
        });
    };

    socketUi.onTicketDelete = function() {
        socket.removeAllListeners('ticket:delete');
        socket.on('ticket:delete', function(data) {
            $('a#refreshTicketGrid').trigger('click');
        });
    };

    return socketUi;
});