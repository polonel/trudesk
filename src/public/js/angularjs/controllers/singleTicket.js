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

define(['angular', 'underscore', 'jquery', 'uikit', 'modules/socket', 'modules/navigation', 'tomarkdown', 'modules/helpers', 'easymde', 'angularjs/services/session', 'history'],
    function(angular, _, $, UIkit, socket, nav, md, helpers, EasyMDE) {
    return angular.module('trudesk.controllers.singleTicket', ['trudesk.services.session'])
        .controller('singleTicket', function(SessionService, $rootScope, $scope, $http, $q, $log) {

            $scope.loggedInAccount = SessionService.getUser();

            var mdeToolbarItems = [
                {
                    name: 'bold',
                    action: EasyMDE.toggleBold,
                    className: 'material-icons mi-bold no-ajaxy',
                    title: 'Bold'
                },
                {
                    name: 'italic',
                    action: EasyMDE.toggleItalic,
                    className: 'material-icons mi-italic no-ajaxy',
                    title: 'Italic'
                },
                {
                    name: 'Title',
                    action: EasyMDE.toggleHeadingSmaller,
                    className: 'material-icons mi-title no-ajaxy',
                    title: 'Title'
                },
                "|",
                {
                    name: 'Code',
                    action: EasyMDE.toggleCodeBlock,
                    className: 'material-icons mi-code no-ajaxy',
                    title: 'Code'
                },
                {
                    name: 'Quote',
                    action: EasyMDE.toggleBlockquote,
                    className: 'material-icons mi-quote no-ajaxy',
                    title: 'Quote'
                },
                {
                    name: 'Generic List',
                    action: EasyMDE.toggleUnorderedList,
                    className: 'material-icons mi-list no-ajaxy',
                    title: 'Generic List'
                },
                {
                    name: 'Numbered List',
                    action: EasyMDE.toggleOrderedList,
                    className: 'material-icons mi-numlist no-ajaxy',
                    title: 'Numbered List'
                },
                "|",
                {
                    name: 'Create Link',
                    action: EasyMDE.drawLink,
                    className: 'material-icons mi-link no-ajaxy',
                    title: 'Create Link'
                },
                "|",
                {
                    name: 'Toggle Preview',
                    action: EasyMDE.togglePreview,
                    className: 'material-icons mi-preview no-disable no-mobile no-ajaxy',
                    title: 'Toggle Preview'
                }
            ];

            var $commentReply = $('#commentReply');
            var commentMDE = null;
            if ($commentReply.length > 0) {
                commentMDE = new EasyMDE({
                    element: $commentReply[0],
                    forceSync: true,
                    minHeight: "220px", //Slighty smaller to adjust the scroll
                    toolbar: mdeToolbarItems,
                });

                commentMDE.codemirror.setOption("extraKeys", {
                    "Ctrl-Enter": function(cm) {
                        var $submitButton = $(cm.display.wrapper).parents('form').find('#comment-reply-submit-button');
                        if ($submitButton)
                            $submitButton.click();
                    }
                })
            }

            var $ticketNote = $('#ticket-note');
            var noteMDE = null;
            if ($ticketNote.length > 0) {
                noteMDE = new EasyMDE({
                    element: $ticketNote[0],
                    forceSync: true,
                    minHeight: '220px',
                    toolbar: mdeToolbarItems
                });

            }

            //Setup Assignee Drop based on Status
            var ticketStatus = $('#__ticketStatus').html();
            var assigneeListBtn = $('.ticket-assignee > a');
            if (assigneeListBtn.length > 0 && ticketStatus.length > 0) {
                if (ticketStatus === '3') {
                    assigneeListBtn.removeAttr('data-notifications');
                    assigneeListBtn.removeAttr('data-updateUi');
                    nav.notifications();
                }
            }

            $scope.showStatusSelect = function() {
                var statusSelect = $('#statusSelect');
                if (statusSelect.length > 0) {
                    if (statusSelect.hasClass('hide')) {
                        statusSelect.removeClass('hide');
                        statusSelect.addClass('shown');
                    } else {
                        statusSelect.addClass('hide');
                        statusSelect.removeClass('shown');
                    }
                }
            };

            $scope.changeStatus = function(status) {
                var id = $('#__ticketId').html();
                var statusSelectBox = $('#statusSelect');
                if (statusSelectBox.length > 0) {
                    statusSelectBox.addClass('hide');
                    statusSelectBox.removeClass('shown');
                }

                socket.ui.sendUpdateTicketStatus(id, status);
            };

            $scope.clearAssignee = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.clearAssignee(id);
                }
            };

            $scope.types = [];
            $scope.priorities = [];
            $scope.groups = [];

            var ticketTypes = $http.get('/api/v1/tickets/types').
                                success(function(data) {
                                    _.each(data, function(item) {
                                        item.priorities = _.sortBy(item.priorities, function(i) { return i.name; });
                                        $scope.types.push(item);
                                    });
                                }).
                                error(function(e) {
                                    $log.log('[trudesk:singleTicket:ticketTypes] - ' + e);
                                });

            $q.all([ticketTypes]).then(function() {
                $scope.selected_type = _.findWhere($scope.types, {_id: $scope.ticketType});
                $scope.priorities = $scope.selected_type.priorities;
                $scope.priorities = _.sortBy($scope.priorities, 'name');
                $scope.selected_priority = _.findWhere($scope.priorities, {_id: $scope.ticketPriority});
                if (!$scope.selected_priority) {
                    UIkit.modal.alert('Selected Priority does not exit for this ticket type.<br><br><strong>Please select a new priority</strong>');
                }
            });

            var groupHttpGet = $http.get('/api/v1/groups').
                                success(function(data) {
                                    _.each(data.groups, function(item) {
                                        $scope.groups.push(item);
                                    });
                                }).
                                error(function(e) {
                                    $log.log('[trudesk:singleTicket:groupHttpGet] - ' + e);
                                });

            $q.all([groupHttpGet]).then(function() {
                $scope.selected_group = _.findWhere($scope.groups, {_id: $scope.ticketGroup});
            });

            $scope.updateTicketType = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.setTicketType(id, $scope.selected_type);
                    $scope.priorities = $scope.selected_type.priorities;
                    $scope.priorities = _.sortBy($scope.priorities, 'name');
                    $scope.selected_priority = _.findWhere($scope.priorities, {_id: $scope.ticketPriority});
                    if (_.isUndefined($scope.selected_priority)) {
                        UIkit.modal.alert('Selected Priority does not exit for this ticket type.<br><br><strong>Please select a new priority</strong>');
                    }
                }
            };

            $scope.updateTicketPriority = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0 && $scope.selected_priority) {
                    socket.ui.setTicketPriority(id, $scope.selected_priority._id);
                    $scope.ticketPriority = $scope.selected_priority._id;
                }
            };

            $scope.updateTicketGroup = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.setTicketGroup(id, $scope.selected_group);
                }
            };

            $scope.updateTicketIssue = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    var form = $('form#edit-issue-form');
                    if (!form.isValid(null, null, false)) return true;
                    var issue = form.find('textarea#issueText').val();
                    issue = '<p>' + issue + '</p>';
                    socket.ui.setTicketIssue(id, issue);
                }
            };

            $scope.editIssueCancelClicked = function($event) {
                $event.preventDefault();
                var issueForm = $('.edit-issue-form');
                var issueText = $('.initial-issue').find('.issue-text').find('.issue-body');

                if (issueForm.length > 0 && issueText.length > 0) {
                    issueText.removeClass('hide');
                    issueForm.addClass('hide');

                    //Setup Text
                    var iText = $('.issue-text').find('div.issue-body').html();
                    //iText = iText.replace(/(<br>)|(<br \/>)|(<p>)|(<\/p>)/g, "\r\n");
                    //iText = iText.replace(/(<([^>]+)>)/ig,"");
                    iText = md(iText);
                    iText = iText.trim();
                    $('#issueText').val(iText);
                }
            };

            $scope.showUploadAttachment = function($event) {
                $event.preventDefault();
                var self = $($event.currentTarget);
                var inputField = self.parents('form').find('input.attachmentInput');
                if (inputField.length > 0) {
                    $(inputField).trigger('click');
                }
            };

            $scope.SubscriberChange = function() {
                var id = $('#__ticketId').html();
                $http.put(
                    '/api/v1/tickets/' + id + '/subscribe',
                    {
                        "user" : $scope.user,
                        "subscribe": $scope.subscribed
                    }
                ).success(function() {

                    }).error(function(e) {
                        $log.log('[trudesk:singleTicket:SubscriberChange] - ' + e);
                        helpers.UI.showSnackbar('Error: ' + e.message, true);
                    });
            };

            $scope.showCreateTags = function(event) {
                event.preventDefault();
                var tagModal = $('#createTagModal');
                if (tagModal.length > 0) {
                    UIkit.modal(tagModal, {bgclose: false}).show();
                }
            };

            $scope.showTags = function(event) {
                event.preventDefault();
                var tagModal = $('#addTagModal');
                if (tagModal.length > 0) {
                    tagModal.find('option').prop('selected', false);
                    var selectedItems = [];
                    $('.__TAG_SELECTED').each(function() {
                        var i = $(this).text();
                        if (i.length > 0) {
                            selectedItems.push(i);
                        }
                    });
                    _.each(selectedItems, function(item) {
                        var option = tagModal.find('#tags').find('option[value="' + item + '"]');
                        option.prop('selected', 'selected');
                    });

                    tagModal.find('select').trigger('chosen:updated');

                    UIkit.modal('#addTagModal', {bgclose: false}).show();
                }
            };

            $scope.submitAddNewTag = function(event) {
                event.preventDefault();
                var form = $('form#createTagForm');
                if (form.length > 0) {
                    var tag = form.find('#tag').val();
                    var data = {
                        tag: tag
                    };

                    $http({
                        method: "POST",
                        url: '/api/v1/tags/create',
                        data: data,
                        headers: { 'Content-Type': 'application/json'}
                    })
                        .success(function(data) {
                            var tagModal = $('#createTagModal');
                            var tagFormField = $('select#tags');
                            tagFormField.append('<option id="TAG__' + data.tag._id + '" value="' + data.tag._id + '">' + data.tag.name + '</option>');
                            tagFormField.find('option#TAG__' + data.tag._id).prop('selected', true);
                            tagFormField.trigger('chosen:updated');
                            form.find('#tag').val('');
                            if (tagModal.length > 0) UIkit.modal(tagModal).hide();
                            setTimeout(function() {
                                $scope.showTags(event);
                            }, 250);
                        })
                        .error(function(err) {
                            $log.log('[trudesk:tickets:addTag} - Error: ' + err.error);
                            helpers.UI.showSnackbar('Error: ' + err.error, true);
                        });
                }
            };

            $scope.submitAddTags = function(event) {
                event.preventDefault();
                var id = $('#__ticketId').text();
                var form = $(event.target);
                if (form.length < 1) return;
                var tagField = form.find('#tags');
                if (tagField.length < 1) return;
                //var user = form.find('input[name="from"]').val();
                $http.put('/api/v1/tickets/' + id,
                    {
                        "tags": tagField.val()

                    }).success(function() {
                        helpers.UI.showSnackbar('Tags have been added.', false);
                        socket.ui.refreshTicketTags(id);

                        UIkit.modal('#addTagModal').hide();
                }).error(function(e) {
                    $log.log('[trudesk:singleTicket:submitAddTags] - ' + e);
                    helpers.UI.showSnackbar('Error: ' + e.message, true);

                    UIkit.modal('#addTagModal').hide();
                });
            };

            $scope.clearTags = function(event) {
                event.preventDefault();
                var id = $('#__ticketId').text();
                $http.put('/api/v1/tickets/' + id,
                    {
                        "tags": []
                    }
                ).success(function() {
                    socket.ui.refreshTicketTags(id);
                    $('#addTagModal').find('option').prop('selected', false);
                    $('#addTagModal').find('select').trigger('chosen:updated');
                    UIkit.modal('#addTagModal').hide();
                }).error(function(e) {
                    $log.log('[trudesk:singleTicket:clearTags] - ' + e.message);
                    helpers.UI.showSnackbar('Error: ' + e.message, true);
                    UIkit.modal('#addTagModal').hide();
                });
            };

            $scope.submitComment = function(event) {
                event.preventDefault();
                var form = $(event.target);
                if (form.length < 1) return;
                var id = form.find('input[name="ticketId"]');
                var commentField = form.find('#commentReply');
                if (commentField.length < 1 || id.length < 1) return;

                var $mdeError = null;
                if (commentField.val().length < 5) {
                    // commentField.validate();
                    commentField.parent().css({border: '1px solid #E74C3C'});
                    var mdeError = $('<div class="mde-error uk-float-left uk-text-left">Please enter a valid comment. Comments must contain at least 5 characters.</div>');

                    $mdeError = commentField.siblings('.editor-statusbar').find('.mde-error');
                    if ($mdeError.length < 1)
                        commentField.siblings('.editor-statusbar').prepend(mdeError);

                    return;
                } else {
                    commentField.parent().css('border', 'none');
                    $mdeError = commentField.parent().find('.mde-error');
                    if ($mdeError.length > 0) $mdeError.remove();
                }

                if (form.isValid(null, null, false)) {
                    $http.post('/api/v1/tickets/addcomment', {
                        "comment": commentMDE.value(),
                        "_id": id.val().toString(),
                        "ownerId": $scope.loggedInAccount._id
                    }).success(function() {
                        commentField.val('');
                        if (commentMDE)
                            commentMDE.value('');
                    }).error(function(e) {
                        $log.error('[trudesk:singleTicket:submitComment]');
                        $log.error(e);
                        helpers.UI.showSnackbar('Error: ' + e.error, true);
                    });
                }
            };

            $scope.submitInternalNote = function(event) {
                event.preventDefault();
                var id = $('#__ticketId').text();
                var form = $(event.target);
                if (form.length < 1) return;
                var noteField = form.find('#ticket-note');
                if (noteField.length < 1 || id.length < 1) return;

                var $mdeError = null;
                if (noteField.val().length < 5) {
                    noteField.parent().css({border: '1px solid #E74C3C'});
                    var mdeError = $('<div class="mde-error uk-float-left uk-text-left">Please enter a valid note. Notes must contain at least 5 characters.</div>');

                    $mdeError = noteField.siblings('.editor-statusbar').find('.mde-error');
                    if ($mdeError.length < 1)
                        noteField.siblings('.editor-statusbar').prepend(mdeError);

                    return;
                } else {
                    noteField.parent().css('border', 'none');
                    $mdeError = noteField.parent().find('.mde-error');
                    if ($mdeError.length > 0) $mdeError.remove();
                }

                if (form.isValid(null, null, false)) {
                    $http.post('/api/v1/tickets/addnote', {
                        "note": noteField.val(),
                        "ticketid": id,
                        "owner": $scope.loggedInAccount._id
                    }).success(function() {
                        noteField.val('');
                        if (noteMDE)
                            noteMDE.value('');
                    }).error(function(e) {
                        $log.error('[trudesk:singleTicket:submitInternalNote]');
                        $log.error(e);
                        helpers.UI.showSnackbar('Error: ' + e.error, true);
                    });
                }
            };

            $scope.closeAddTagModal = function() {
                UIkit.modal('#addTagModal').hide();
            };
        })
        .directive('closeMouseUp', ['$document', function($document) {
            return {
                restrict: 'A',
                link: function(scope, element) {
                    $document.on('mouseup', mouseup);

                    scope.$on('$destroy', function() {
                        $document.off('mouseup', mouseup);
                    });

                    element.on('$destroy', function() {
                        $document.off('mouseup', mouseup);
                    });

                    function mouseup($event) {
                        var target = $event.target.offsetParent;
                        if ($(target).length > 0 && $(target).hasClass('floating-ticket-status')) return false;

                        if (!element.hasClass('hide')) {
                            element.addClass('hide');
                        }

                        if (element.hasClass('shown')) {
                            element.removeClass('shown');
                        }
                    }
                }
            }
        }]);
});