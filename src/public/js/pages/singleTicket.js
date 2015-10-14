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
    'modules/ui',
    'tomarkdown'
], function($, _, ui, md) {
    var st = {};
    st.init = function() {
        $(document).ready(function() {
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
            $('.edit-issue').each(function() {
                var self = $(this);
                self.off('click', onEditIssueClick);
                self.on('click', onEditIssueClick);
            });

            //Setup Text
            var issueText = $('.issue-text').find('div.issue-body').html();
            if (!_.isUndefined(issueText)) {
                //issueText = issueText.replace(/(<br>)|(<br \/>)|(<p>)|(<\/p>)/g, "\r\n");
                //issueText = issueText.replace(/(<([^>]+)>)/ig,"");
                issueText = md(issueText);
                issueText = issueText.trim();
                $('#issueText').val(issueText);
            }

            // Set Comment Editing
            $('div.edit-comment-form').find('form').each(function(idx, f) {
                var form = $(f);
                form.unbind('submit');
                form.submit(function($event) {
                    $event.preventDefault();
                    var id = $('#__ticketId').html();
                    if (id.length > 0) {
                        var comment = $($event.currentTarget).find('textarea#commentText').val();
                        var commentId = $($event.currentTarget).attr('data-commentId');
                        comment = '<p>' + comment + '</p>';

                        ui.setCommentText(id, commentId, comment);
                    }
                });
            });

            $('div.edit-comment-form').find('.resetForm').each(function(idx, item) {
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
        });
    };

    function onRemoveCommentClick(e) {
        var self = $(e.currentTarget);
        if (_.isUndefined(self))
            return true;

        var ticketId = $('#__ticketId').html();
        var commentId = self.attr('data-commentId');
        if (commentId.length > 0 && ticketId.length > 0) {
            ui.removeComment(ticketId, commentId);
        }
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

    function onEditIssueClick(e) {
        var issueForm = $('.edit-issue-form');
        var issueText = $('.initial-issue').find('.issue-text').find('.issue-body');

        if (!issueText.hasClass('hide')) {
            issueText.addClass('hide');
            issueForm.removeClass('hide');
        }
    }

    return st;
});