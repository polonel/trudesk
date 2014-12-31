define('modules/ui', [
    'jquery',
    'socketio',
    'modules/helpers'

], function($, io, helpers) {
    var socketUi = {},
        socket = io.connect();

    socketUi.init = function() {
        this.updateMailNotifications();
        this.updateComments();
        this.updateUi();
    };

    socketUi.updateMailNotifications = function() {
        $(document).ready(function() {
            $('#btn_mail-notifications').click(function(e) {
                socket.emit('updateMailNotifications');
                e.preventDefault();
            });
        });

        socket.removeAllListeners('updateMailNotifications');
        socket.on('updateMailNotifications', function(data) {
            var label = $('#btn_mail-notifications').find('> span');
            if (data < 1) {
                label.hide();
            } else {
                label.html(data);
                label.show();
            }
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

            });
        });
    };

    function updateUsersBtnClicked(e) {
        socket.emit('updateUsers');
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

        //Make sure we only have 1 event listener
        socket.removeAllListeners('updateComments');
        socket.on('updateComments', function(data) {
            var ticket = data;
            var commentContainer = $('.comments[data-ticketId="' + ticket._id + '"]');
            var comment = $(ticket.comments).get(-1);

            var commentText = 'Comments';
            if(ticket.comments.length === 1) commentText = 'Comment';

            $('.page-top-comments > a[data-ticketId="' + ticket._id + '"]').html(ticket.comments.length + ' ' + commentText);

            var image = comment.owner.image;
            if (_.isUndefined(image)) image = 'defaultProfile.jpg';

            var html =  '<div class="ticket-comment">' +
                '<img src="/uploads/users/' + image + '" alt=""/>' +
                '<div class="issue-text">' +
                '<h3>Re: ' + ticket.subject + '</h3>' +
                '<a href="mailto:' + comment.owner.email + '">' + comment.owner.fullname + ' &lt;' + comment.owner.email + '&gt;</a>' +
                '<time datetime="' + comment.date + '">' + helpers.formatDate(comment.date, "MMM DD, h:mma") + '</time>' +
                '<p>' + comment.comment + '</p>' +
                '</div>' +
                '</div>';

            commentContainer.append(html);
        });
    };

    return socketUi;
});