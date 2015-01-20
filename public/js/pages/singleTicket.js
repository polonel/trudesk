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

    return st;
});