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

define([
  'angular',
  'underscore',
  'jquery',
  'uikit',
  'modules/socket',
  'modules/navigation',
  'tomarkdown',
  'modules/helpers',
  'easymde',
  'inlineAttachment',
  'inputInlineAttachment',
  'cm4InlineAttachment',
  'angularjs/services/session',
  'history'
], function (angular, _, $, UIkit, socket, nav, md, helpers, EasyMDE) {
  return angular
    .module('trudesk.controllers.singleTicket', ['trudesk.services.session'])
    .controller('singleTicket', function (SessionService, $window, $rootScope, $scope, $http, $timeout, $q, $log) {
      $scope.loggedInAccount = SessionService.getUser()
      onSocketUpdateTicketDueDate()

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
        '|',
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
        '|',
        {
          name: 'Create Link',
          action: EasyMDE.drawLink,
          className: 'material-icons mi-link no-ajaxy',
          title: 'Create Link'
        },
        '|',
        {
          name: 'Toggle Preview',
          action: EasyMDE.togglePreview,
          className: 'material-icons mi-preview no-disable no-mobile no-ajaxy',
          title: 'Toggle Preview'
        }
      ]

      function attachFileDesc (textarea) {
        var $el = $(textarea)
        var attachFileDiv = $('<div></div>')
        attachFileDiv
          .addClass('attachFileDesc')
          .html('<p>Attach images by dragging & dropping or pasting from clipboard.</p>')
        $el.siblings('.CodeMirror').addClass('hasFileDesc')
        $el
          .siblings('.editor-statusbar')
          .addClass('hasFileDesc')
          .prepend(attachFileDiv)
      }

      var $editIssueText = $('#edit-issue-text')
      var editIssueTextMDE = null
      if ($editIssueText.length > 0) {
        editIssueTextMDE = new EasyMDE({
          element: $editIssueText[0],
          forceSync: true,
          height: '100px',
          minHeight: '150px',
          toolbar: mdeToolbarItems,
          autoDownloadFontAwesome: false,
          status: false
        })
      }

      $window.inlineAttachment.editors.codemirror4.attach(editIssueTextMDE.codemirror, {
        onFileUploadResponse: function (xhr) {
          var result = JSON.parse(xhr.responseText)

          var filename = result[this.settings.jsonFieldName]

          if (result && filename) {
            var newValue
            if (typeof this.settings.urlText === 'function') {
              newValue = this.settings.urlText.call(this, filename, result)
            } else {
              newValue = this.settings.urlText.replace(this.filenameTag, filename)
            }

            var text = this.editor.getValue().replace(this.lastValue, newValue)
            this.editor.setValue(text)
            this.settings.onFileUploaded.call(this, filename)
          }
          return false
        },
        onFileUploadError: function (xhr) {
          var result = xhr.responseText
          var text = this.editor.getValue() + ' ' + result
          this.editor.setValue(text)
        },
        extraHeaders: {
          ticketid: $('#__ticketId').text()
        },
        errorText: 'Error uploading file: ',
        uploadUrl: '/tickets/uploadmdeimage',
        jsonFieldName: 'filename',
        urlText: '![Image]({filename})'
      })

      // attachFileDesc($editIssueText)

      $scope.showEditWindow = function (type, showSubject, commentNoteId) {
        var $editWindow = $('#edit-ticket-window')
        if ($editWindow.length < 1) return false
        var ticketId = $('#__ticketId').text()
        var text = ''
        $editWindow.attr('data-ticket-id', ticketId)

        if (type.toLowerCase() === 'issue') {
          var issueText = $('.initial-issue .issue-text > .issue-body').html()
          text = md(issueText)

          $editWindow.find('.save-btn').attr('data-save-type', 'issue')
        } else if (type.toLowerCase() === 'comment') {
          var commentText = $('.ticket-comment[data-commentid="' + commentNoteId + '"] .comment-body').html()
          text = md(commentText)

          $editWindow.attr('data-id', commentNoteId)
          $editWindow.find('.save-btn').attr('data-save-type', 'comment')
        } else if (type.toLowerCase() === 'note') {
          var noteText = $('.ticket-note[data-noteid="' + commentNoteId + '"] .comment-body').html()
          text = md(noteText)

          $editWindow.attr('data-id', commentNoteId)
          $editWindow.find('.save-btn').attr('data-save-type', 'note')
        }

        if (editIssueTextMDE) {
          editIssueTextMDE.codemirror.getDoc().setValue(text)
        }

        var $subjectWrap = $editWindow.find('.edit-subject-wrap')

        if (!showSubject) {
          $subjectWrap.hide()
          $subjectWrap.attr('data-active', false)
        } else {
          var subjectText = ''
          $subjectWrap.show()
          if (type.toLowerCase() === 'issue') {
            subjectText = $('.initial-issue > .issue-text > .subject-text').text()
          }

          var $input = $subjectWrap.find('input')
          $input.val(subjectText)
          $input.parent().addClass('md-input-filled')
          $subjectWrap.attr('data-active', true)
        }

        $editWindow.addClass('open').removeClass('closed')
      }

      $scope.hideEditWindow = function () {
        $('#edit-ticket-window')
          .addClass('closed')
          .removeClass('open')
      }

      $scope.saveEditWindow = function () {
        if (!editIssueTextMDE) return false
        var $editTicketWindow = $('#edit-ticket-window')
        var ticketId = $editTicketWindow.attr('data-ticket-id')
        var $subject = $editTicketWindow.find('input#edit-subject-input')
        var $saveButton = $editTicketWindow.find('.action-panel button[data-save-type]')
        var saveType = null
        if ($saveButton.length > 0) saveType = $saveButton.attr('data-save-type')

        if (saveType.toLowerCase() === 'issue') {
          var subjectText = $subject.val()
          var issueText = editIssueTextMDE.codemirror.getValue()

          socket.ui.setTicketIssue(ticketId, issueText, subjectText)
          $scope.hideEditWindow()
        } else if (saveType.toLowerCase() === 'comment') {
          var commentId = $editTicketWindow.attr('data-id')
          var commentText = editIssueTextMDE.codemirror.getValue()

          socket.ui.setCommentText(ticketId, commentId, commentText)
          $scope.hideEditWindow()
        } else if (saveType.toLowerCase() === 'note') {
          var noteId = $editTicketWindow.attr('data-id')
          var noteText = editIssueTextMDE.codemirror.getValue()

          socket.ui.setNoteText(ticketId, noteId, noteText)
          $scope.hideEditWindow()
        }
      }

      var $commentReply = $('#commentReply')
      var commentMDE = null
      if ($commentReply.length > 0) {
        commentMDE = new EasyMDE({
          element: $commentReply[0],
          forceSync: true,
          minHeight: '220px', // Slighty smaller to adjust the scroll
          toolbar: mdeToolbarItems,
          autoDownloadFontAwesome: false
        })

        commentMDE.codemirror.setOption('extraKeys', {
          'Ctrl-Enter': function (cm) {
            var $submitButton = $(cm.display.wrapper)
              .parents('form')
              .find('#comment-reply-submit-button')
            if ($submitButton) {
              $submitButton.click()
            }
          }
        })

        $window.inlineAttachment.editors.codemirror4.attach(commentMDE.codemirror, {
          onFileUploadResponse: function (xhr) {
            var result = JSON.parse(xhr.responseText)

            var filename = result[this.settings.jsonFieldName]

            if (result && filename) {
              var newValue
              if (typeof this.settings.urlText === 'function') {
                newValue = this.settings.urlText.call(this, filename, result)
              } else {
                newValue = this.settings.urlText.replace(this.filenameTag, filename)
              }

              var text = this.editor.getValue().replace(this.lastValue, newValue)
              this.editor.setValue(text)
              this.settings.onFileUploaded.call(this, filename)
            }
            return false
          },
          onFileUploadError: function (xhr) {
            var result = xhr.responseText
            var text = this.editor.getValue() + ' ' + result
            this.editor.setValue(text)
          },
          extraHeaders: {
            ticketid: $('#__ticketId').text()
          },
          errorText: 'Error uploading file: ',
          uploadUrl: '/tickets/uploadmdeimage',
          jsonFieldName: 'filename',
          urlText: '![Image]({filename})'
        })

        attachFileDesc($commentReply)
      }

      var $ticketNote = $('#ticket-note')
      var noteMDE = null
      if ($ticketNote.length > 0) {
        noteMDE = new EasyMDE({
          element: $ticketNote[0],
          forceSync: true,
          minHeight: '220px',
          toolbar: mdeToolbarItems,
          autoDownloadFontAwesome: false
        })

        $window.inlineAttachment.editors.codemirror4.attach(noteMDE.codemirror, {
          onFileUploadResponse: function (xhr) {
            var result = JSON.parse(xhr.responseText)

            var filename = result[this.settings.jsonFieldName]

            if (result && filename) {
              var newValue
              if (typeof this.settings.urlText === 'function') {
                newValue = this.settings.urlText.call(this, filename, result)
              } else {
                newValue = this.settings.urlText.replace(this.filenameTag, filename)
              }

              var text = this.editor.getValue().replace(this.lastValue, newValue)
              this.editor.setValue(text)
              this.settings.onFileUploaded.call(this, filename)
            }
            return false
          },
          onFileUploadError: function (xhr) {
            var result = xhr.responseText
            var text = this.editor.getValue() + ' ' + result
            this.editor.setValue(text)
          },
          extraHeaders: {
            ticketid: $('#__ticketId').text()
          },
          errorText: 'Error uploading file: ',
          uploadUrl: '/tickets/uploadmdeimage',
          jsonFieldName: 'filename',
          urlText: '![Image]({filename})'
        })

        attachFileDesc($ticketNote)
      }

      // Setup Assignee Drop based on Status
      var ticketStatus = $('#__ticketStatus').html()
      var assigneeListBtn = $('.ticket-assignee > a')
      if (assigneeListBtn.length > 0 && ticketStatus.length > 0) {
        if (ticketStatus === '3') {
          assigneeListBtn.removeAttr('data-notifications')
          assigneeListBtn.removeAttr('data-updateUi')
          nav.notifications()
        }
      }

      $scope.showStatusSelect = function () {
        var statusSelect = $('#statusSelect')
        if (statusSelect.length > 0) {
          if (statusSelect.hasClass('hide')) {
            statusSelect.removeClass('hide')
            statusSelect.addClass('shown')
          } else {
            statusSelect.addClass('hide')
            statusSelect.removeClass('shown')
          }
        }
      }

      $scope.changeStatus = function (status) {
        var id = $('#__ticketId').html()
        var statusSelectBox = $('#statusSelect')
        if (statusSelectBox.length > 0) {
          statusSelectBox.addClass('hide')
          statusSelectBox.removeClass('shown')
        }

        socket.ui.sendUpdateTicketStatus(id, status)
      }

      $scope.clearAssignee = function () {
        var id = $('#__ticketId').html()
        if (id.length > 0) {
          socket.ui.clearAssignee(id)
        }
      }

      $scope.types = []
      $scope.priorities = []
      $scope.groups = []

      var ticketTypes = $http
        .get('/api/v1/tickets/types')
        .success(function (data) {
          _.each(data, function (item) {
            item.priorities = _.sortBy(item.priorities, function (i) {
              return i.name
            })
            $scope.types.push(item)
          })
        })
        .error(function (e) {
          $log.log('[trudesk:singleTicket:ticketTypes] - ' + e)
        })

      function showSelectPriorityConfirm () {
        UIkit.modal.confirm(
          'Selected Priority does not exist for this ticket type.<br><br><strong>Please select a new priority</strong>',
          function () {},
          { cancelButtonClass: 'uk-hidden' }
        )
      }

      $q.all([ticketTypes]).then(function () {
        $scope.selectedType = _.findWhere($scope.types, {
          _id: $scope.ticketType
        })
        $scope.priorities = $scope.selectedType.priorities
        $scope.priorities = _.sortBy($scope.priorities, 'name')
        $scope.selectedPriority = _.findWhere($scope.priorities, {
          _id: $scope.ticketPriority
        })
        if (!$scope.selectedPriority) {
          showSelectPriorityConfirm()
        }
      })

      var groupHttpGet = $http
        .get('/api/v2/groups')
        .success(function (data) {
          _.each(data.groups, function (item) {
            $scope.groups.push(item)
          })
        })
        .error(function (e) {
          $log.log('[trudesk:singleTicket:groupHttpGet] - ' + e)
        })

      $q.all([groupHttpGet]).then(function () {
        $scope.selectedGroup = _.findWhere($scope.groups, {
          _id: $scope.ticketGroup
        })
      })

      $scope.updateTicketType = function () {
        var id = $('#__ticketId').html()
        if (id.length > 0) {
          socket.ui.setTicketType(id, $scope.selectedType)
          $scope.priorities = $scope.selectedType.priorities
          $scope.priorities = _.sortBy($scope.priorities, 'name')
          $scope.selectedPriority = _.findWhere($scope.priorities, {
            _id: $scope.ticketPriority
          })
          if (_.isUndefined($scope.selectedPriority)) {
            showSelectPriorityConfirm()
          }
        }
      }

      $scope.updateTicketPriority = function () {
        var id = $('#__ticketId').html()
        if (id.length > 0 && $scope.selectedPriority) {
          socket.ui.setTicketPriority(id, $scope.selectedPriority._id)
          $scope.ticketPriority = $scope.selectedPriority._id
        }
      }

      $scope.updateTicketGroup = function () {
        var id = $('#__ticketId').html()
        if (id.length > 0) {
          socket.ui.setTicketGroup(id, $scope.selectedGroup)
        }
      }

      $scope.updateTicketDueDate = function () {
        var id = $('#__ticketId').html()
        if (id.length > 0) {
          socket.ui.setTicketDueDate(id, $scope.dueDate)
        }
      }

      $scope.clearDueDate = function ($event) {
        $event.preventDefault()
        var id = $('#__ticketId').html()
        if (id.length > 0) {
          socket.ui.setTicketDueDate(id, null)
        }
      }

      function onSocketUpdateTicketDueDate () {
        socket.socket.removeAllListeners('updateTicketDueDate')
        socket.socket.on('updateTicketDueDate', function (data) {
          $timeout(function () {
            if ($scope.ticketId === data._id)
              if (data.dueDate) $scope.dueDate = helpers.formatDate(data.dueDate, helpers.getShortDateFormat())
              else $scope.dueDate = ''
          }, 0)
          // var dueDateInput = $('input#tDueDate[data-ticketId="' + data._id + '"]')
          // if (dueDateInput.length > 0) {
          //   $scope.dueDate = helpers.formatDate(data.duedate, helpers.getShortDateFormat())
          // } else {
          //   dueDateInput = $('div#tDueDate[data-ticketId="' + data._id + '"]')
          //   if (dueDateInput.length > 0)
          //     dueDateInput.html(helpers.formatDate(data.duedate, helpers.getShortDateFormat()))
          // }
        })
      }

      $scope.updateTicketIssue = function () {
        var id = $('#__ticketId').html()
        if (id.length > 0) {
          var form = $('form#edit-issue-form')
          if (!form.isValid(null, null, false)) return true
          var issue = form.find('textarea#issueText').val()

          // socket.ui.setTicketIssue(id, issue)
        }
      }

      $scope.editIssueCancelClicked = function ($event) {
        $('#edit-issue')
          .addClass('closed')
          .removeClass('open')

        $event.preventDefault()
        var issueForm = $('.edit-issue-form')
        var issueText = $('.initial-issue')
          .find('.issue-text')
          .find('.issue-body')

        if (issueForm.length > 0 && issueText.length > 0) {
          issueText.removeClass('hide')
          issueForm.addClass('hide')

          // Setup Text
          var iText = $('.issue-text')
            .find('div.issue-body')
            .html()
          // iText = iText.replace(/(<br>)|(<br \/>)|(<p>)|(<\/p>)/g, "\r\n");
          // iText = iText.replace(/(<([^>]+)>)/ig,"");
          iText = md(iText)
          iText = iText.trim()
          $('#issueText').val(iText)
        }
      }

      $scope.showUploadAttachment = function ($event) {
        $event.preventDefault()
        var self = $($event.currentTarget)
        var inputField = self.parents('form').find('input.attachmentInput')
        if (inputField.length > 0) {
          $(inputField).trigger('click')
        }
      }

      $scope.SubscriberChange = function () {
        var id = $('#__ticketId').html()
        $http
          .put('/api/v1/tickets/' + id + '/subscribe', {
            user: $scope.user,
            subscribe: $scope.subscribed
          })
          .success(function () {})
          .error(function (e) {
            $log.log('[trudesk:singleTicket:SubscriberChange] - ' + e)
            helpers.UI.showSnackbar('Error: ' + e.message, true)
          })
      }

      $scope.showTags = function (event) {
        event.preventDefault()
        var tagModal = $('#addTagModal')
        if (tagModal.length > 0) {
          tagModal.find('option').prop('selected', false)
          var selectedItems = []
          $('.__TAG_SELECTED').each(function () {
            var vm = this
            var i = $(vm).text()
            if (i.length > 0) {
              selectedItems.push(i)
            }
          })
          _.each(selectedItems, function (item) {
            var option = tagModal.find('#tags').find('option[value="' + item + '"]')
            option.prop('selected', 'selected')
          })

          tagModal.find('select').trigger('chosen:updated')

          UIkit.modal('#addTagModal', { bgclose: false }).show()
        }
      }

      $scope.submitAddTags = function (event) {
        event.preventDefault()
        var id = $('#__ticketId').text()
        var form = $(event.target)
        if (form.length < 1) return
        var tagField = form.find('#tags')
        if (tagField.length < 1) return
        // var user = form.find('input[name="from"]').val();
        $http
          .put('/api/v1/tickets/' + id, {
            tags: tagField.val()
          })
          .success(function () {
            helpers.UI.showSnackbar('Tags have been added.', false)
            socket.ui.refreshTicketTags(id)

            UIkit.modal('#addTagModal').hide()
          })
          .error(function (e) {
            $log.log('[trudesk:singleTicket:submitAddTags] - ', e)
            helpers.UI.showSnackbar('Error: ' + e.error, true)

            UIkit.modal('#addTagModal').hide()
          })
      }

      $scope.clearTags = function (event) {
        event.preventDefault()
        var id = $('#__ticketId').text()
        $http
          .put('/api/v1/tickets/' + id, {
            tags: []
          })
          .success(function () {
            socket.ui.refreshTicketTags(id)
            $('#addTagModal')
              .find('option')
              .prop('selected', false)
            $('#addTagModal')
              .find('select')
              .trigger('chosen:updated')
            UIkit.modal('#addTagModal').hide()
          })
          .error(function (e) {
            $log.log('[trudesk:singleTicket:clearTags] - ' + e.message)
            helpers.UI.showSnackbar('Error: ' + e.message, true)
            UIkit.modal('#addTagModal').hide()
          })
      }

      $scope.submitComment = function (event) {
        event.preventDefault()
        var form = $(event.target)
        if (form.length < 1) return
        var id = form.find('input[name="ticketId"]')
        var commentField = form.find('#commentReply')
        if (commentField.length < 1 || id.length < 1) return

        var $mdeError = null
        if (commentField.val().length < 5) {
          // commentField.validate();
          commentField.parent().css({ border: '1px solid #E74C3C' })
          var mdeError = $(
            '<div class="mde-error uk-float-left uk-text-left">Please enter a valid comment. Comments must contain at least 5 characters.</div>'
          )

          $mdeError = commentField.siblings('.editor-statusbar').find('.mde-error')
          if ($mdeError.length < 1) {
            commentField.siblings('.editor-statusbar').prepend(mdeError)
          }

          return
        }

        commentField.parent().css('border', 'none')
        $mdeError = commentField.parent().find('.mde-error')
        if ($mdeError.length > 0) $mdeError.remove()

        if (form.isValid(null, null, false)) {
          $http
            .post('/api/v1/tickets/addcomment', {
              comment: commentMDE.value(),
              _id: id.val().toString(),
              ownerId: $scope.loggedInAccount._id
            })
            .success(function () {
              commentField.val('')
              if (commentMDE) {
                commentMDE.value('')
              }
            })
            .error(function (e) {
              $log.error('[trudesk:singleTicket:submitComment]')
              $log.error(e)
              helpers.UI.showSnackbar('Error: ' + e.error, true)
            })
        }
      }

      $scope.submitInternalNote = function (event) {
        event.preventDefault()
        var id = $('#__ticketId').text()
        var form = $(event.target)
        if (form.length < 1) return
        var noteField = form.find('#ticket-note')
        if (noteField.length < 1 || id.length < 1) return

        var $mdeError = null
        if (noteField.val().length < 5) {
          noteField.parent().css({ border: '1px solid #E74C3C' })
          var mdeError = $(
            '<div class="mde-error uk-float-left uk-text-left">Please enter a valid note. Notes must contain at least 5 characters.</div>'
          )

          $mdeError = noteField.siblings('.editor-statusbar').find('.mde-error')
          if ($mdeError.length < 1) {
            noteField.siblings('.editor-statusbar').prepend(mdeError)
          }

          return
        }

        noteField.parent().css('border', 'none')
        $mdeError = noteField.parent().find('.mde-error')
        if ($mdeError.length > 0) $mdeError.remove()

        if (form.isValid(null, null, false)) {
          $http
            .post('/api/v1/tickets/addnote', {
              note: noteField.val(),
              ticketid: id,
              owner: $scope.loggedInAccount._id
            })
            .success(function () {
              noteField.val('')
              if (noteMDE) {
                noteMDE.value('')
              }
            })
            .error(function (e) {
              $log.error('[trudesk:singleTicket:submitInternalNote]')
              $log.error(e)
              helpers.UI.showSnackbar('Error: ' + e.error, true)
            })
        }
      }

      $scope.closeAddTagModal = function () {
        UIkit.modal('#addTagModal').hide()
      }
    })
    .directive('closeMouseUp', [
      '$document',
      function ($document) {
        return {
          restrict: 'A',
          link: function (scope, element) {
            $document.on('mouseup', mouseup)

            scope.$on('$destroy', function () {
              $document.off('mouseup', mouseup)
            })

            element.on('$destroy', function () {
              $document.off('mouseup', mouseup)
            })

            function mouseup ($event) {
              var target = $event.target.offsetParent
              if ($(target).length > 0 && $(target).hasClass('floating-ticket-status')) return false

              if (!element.hasClass('hide')) {
                element.addClass('hide')
              }

              if (element.hasClass('shown')) {
                element.removeClass('shown')
              }
            }
          }
        }
      }
    ])
})
