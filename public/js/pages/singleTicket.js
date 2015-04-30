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
    'modules/ui'
], function($, _, ui) {
    var st = {};
    st.init = function() {
        $(document).ready(function() {
            $('.remove-comment').each(function() {
                var self = $(this);
                self.off('click',  onRemoveCommentClick);
                self.on('click', onRemoveCommentClick);
            });
            $('.edit-issue').each(function() {
                var self = $(this);
                self.off('click', onEditIssueClick);
                self.on('click', onEditIssueClick);
            });

            //Setup Text
            var issueText = $('.issue-text').find('div.issue-body').html();
            issueText = issueText.replace(/(<br>)|(<br \/>)|(<p>)|(<\/p>)/g, "\r\n");
            issueText = issueText.replace(/(<([^>]+)>)/ig,"");
            issueText = issueText.trim();
            $('#issueText').val(issueText);
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