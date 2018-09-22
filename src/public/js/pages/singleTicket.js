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

define('pages/singleTicket', [
    'jquery',
    'underscore',
    'modules/socket',
    'tomarkdown',
    'modules/helpers'
], function($, _, socketClient, md, helpers) {
    var st = {};
    st.init = function(callback) {
        $(document).ready(function() {
            socketClient.chat.updateOnlineBubbles();

            helpers.setupTruTabs($('.tru-tab-selectors').find('.tru-tab-selector'));

            $('.remove-attachment').each(function() {
                var self = $(this);
                self.off('click', onRemoveAttachmentClick);
                self.on('click', onRemoveAttachmentClick);
            });
            $('.remove-comment').each(function() {
                var self = $(this);
                self.off('click',  onRemoveCommentClick);
                self.on('click', onRemoveCommentClick);
            });
            $('.edit-comment').each(function() {
                var self = $(this);
                self.off('click', onEditCommentClick);
                self.on('click', onEditCommentClick);
            });
            $('.remove-note').each(function() {
                var self = $(this);
                self.off('click', onRemoveNoteClick);
                self.on('click', onRemoveNoteClick);
            });
            $('.edit-note').each(function() {
                var self = $(this);
                self.off('click', onEditNoteClick);
                self.on('click', onEditNoteClick);
            });
            $('.edit-issue').each(function() {
                var self = $(this);
                self.off('click', onEditIssueClick);
                self.on('click', onEditIssueClick);
            });

            //Setup Text
            var issueText = $('.issue-text').find('div.issue-body').html();
            if (!_.isUndefined(issueText)) {
                issueText = md(issueText);
                issueText = issueText.trim();
                $('#issueText').val(issueText);
            }

            // Set Comment Editing
            var editCommentForm = $('div.edit-comment-form');
            editCommentForm.find('form').each(function(idx, f) {
                var form = $(f);
                form.unbind('submit');
                form.submit(function($event) {
                    $event.preventDefault();
                    if (!form.isValid(null, null, false)) return true;
                    var id = $('#__ticketId').html();
                    if (id.length > 0) {
                        var comment = $($event.currentTarget).find('textarea#commentText').val();
                        var commentId = $($event.currentTarget).attr('data-commentId');
                        comment = '<p>' + comment + '</p>';

                        socketClient.ui.setCommentText(id, commentId, comment);
                    }
                });
            });

            editCommentForm.find('.resetForm').each(function(idx, item) {
                var button = $(item);
                button.off('click');
                button.on('click', function($event) {
                    $event.preventDefault();

                    var grandParent = button.parents('div.edit-comment-form');
                    var comment = button.parents('div.ticket-comment').find('.comment-body');

                    if (grandParent.length > 0) {
                        grandParent.addClass('hide');
                        comment.removeClass('hide');
                    }
                });
            });

            //Setup Internal Note Editing
            var editNoteForm = $('div.edit-note-form');
            editNoteForm.find('form').each(function(idx, f) {
                var form = $(f);
                form.off('submit');
                form.on('submit', function($event) {
                    $event.preventDefault();
                    if (!form.isValid(null, null, false)) return true;
                    var id = $('#__ticketId').text();
                    if (id.length > 0) {
                        var note = $($event.currentTarget).find('textarea#noteText').val();
                        var noteId = $($event.currentTarget).attr('data-noteId');
                        note = '<p>' + note + '</p>';

                        socketClient.ui.setNoteText(id, noteId, note);
                    }
                });
            });

            editNoteForm.find('.resetForm').each(function(idx, item) {
                var button = $(item);
                button.off('click');
                button.on('click', function($event) {
                    $event.preventDefault();

                    var grandParent = button.parents('div.edit-note-form');
                    var note = button.parents('div.ticket-note').find('.comment-body');

                    if (grandParent.length > 0) {
                        grandParent.addClass('hide');
                        note.removeClass('hide');
                    }
                });
            });

            if (typeof callback === 'function')
                return callback();
        });
    };

    function onRemoveAttachmentClick(e) {
        var self = $(e.currentTarget);
        if (_.isUndefined(self))
            return true;

        var ticketId = $('#__ticketId').html();
        var attachmentId = self.attr('data-attachmentId');
        if (attachmentId.length > 0 && ticketId.length > 0) {
            $.ajax({
                url: '/api/v1/tickets/' + ticketId + '/attachments/remove/' + attachmentId,
                type: 'DELETE',
                success: function() {
                    socketClient.ui.refreshTicketAttachments(ticketId);
                },
                error: function(err) {
                    var res = err.responseJSON;
                    console.log('[trudesk:singleTicket:onRemoveAttachmentClick] - ' + res.error);
                    //helpers.showFlash(res.error, true);
                    helpers.UI.showSnackbar(res.err, true);
                }
            });
        }
    }

    function onRemoveCommentClick(e) {
        var self = $(e.currentTarget);
        if (_.isUndefined(self))
            return true;

        var ticketId = $('#__ticketId').html();
        var commentId = self.attr('data-commentId');
        if (commentId.length > 0 && ticketId.length > 0) 
            socketClient.ui.removeComment(ticketId, commentId);
        
    }

    function onEditCommentClick(e) {
        var self = $(e.currentTarget);
        if (_.isUndefined(self))
            return true;

        var commentId = self.attr('data-commentId');
        if (commentId.length > 0) {
            var commentForm = $('.edit-comment-form[data-commentid="' + commentId + '"]');
            if (commentForm.length < 1) return true;
            var commentText = $('.ticket-comment[data-commentid="' + commentId + '"]').find('.issue-text').find('.comment-body');

            //Setup Text
            var commentHtml = commentText.html();
            if (!_.isUndefined(commentHtml)) {
                //commentHtml = commentHtml.replace(/(<br>)|(<br \/>)|(<p>)|(<\/p>)/g, "\r\n");
                //commentHtml = commentHtml.replace(/(<([^>]+)>)/ig,"");
                commentHtml = commentHtml.trim();
                commentHtml = md(commentHtml);
                commentForm.find('textarea').val(commentHtml);
            }

            commentText.addClass('hide');
            commentForm.removeClass('hide');
        }
    }

    function onEditNoteClick(e) {
        var self = $(e.currentTarget);
        if (_.isUndefined(self))
            return true;

        var noteId = self.attr('data-noteId');
        if (noteId.length > 0) {
            var noteForm = $('.edit-note-form[data-noteid="' + noteId + '"]');
            if (noteForm.length < 1) return true;
            var noteText = $('.ticket-note[data-noteid="' + noteId + '"]').find('.issue-text').find('.comment-body');

            //Setup Text
            var noteHtml = noteText.html();
            if (!_.isUndefined(noteHtml)) {
                noteHtml = noteHtml.trim();
                noteHtml = md(noteHtml);
                noteForm.find('textarea').val(noteHtml);
            }

            noteText.addClass('hide');
            noteForm.removeClass('hide');
        }
    }

    function onRemoveNoteClick(e) {
        var self = $(e.currentTarget);
        if (_.isUndefined(self))
            return true;

        var ticketId = $('#__ticketId').html();
        var noteId = self.attr('data-noteid');
        if (noteId.length > 0 && ticketId.length > 0) 
            socketClient.ui.removeNote(ticketId, noteId);
        
    }

    function onEditIssueClick() {
        var issueForm = $('.edit-issue-form');
        var issueText = $('.initial-issue').find('.issue-text').find('.issue-body');

        if (!issueText.hasClass('hide')) {
            issueText.addClass('hide');
            issueForm.removeClass('hide');
        }
    }

    return st;
});