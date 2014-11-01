define('pages/messages', [
    'jquery',
    'modules/helpers',
    'history'

], function($, helpers) {
    var messagesPage = {};

    messagesPage.init = function() {
        $(document).ready(function() {
            $('ul.message-items > li:not(.message-folder)').click(function(e) {
                if (e.target.tagName.toLowerCase() == 'label') return true;
                var self = $(this);
                if (self.hasClass('active')) {
                    return true;
                }

                var id = self.attr('data-messageid');

                messagesPage.loadMessage(id, function(data) {
                    var pageContent = $('.page-content').filter(':first');
                    var page = $(data).find('.page-content').filter(':first').html();

                    messagesPage.clearActive();
                    self.addClass('active');

                    pageContent.html(page);
                });

                e.preventDefault();
            });

            $('ul.message-items > li > label').click(function(e) {
                e.stopPropagation();
            });
        });
    };

    //TODO: Change to load from API
    messagesPage.loadMessage = function(id, callback) {
        var rootUrl = History.getRootUrl();
        var msgUrl = rootUrl + 'messages/' + id;
        $.ajax({
            url:        msgUrl,
            type:       'GET',
            success:    function(data) {
                            callback(data);
                            History.pushState(null, null, msgUrl);
            },
            error:      function(error) {
                            throw new Error(error);
            }
        })
    };

    messagesPage.clearActive = function() {
        $('ul.message-items > li.active').each(function() {
            var self = $(this);
            self.removeClass('active');
        });
    };

    messagesPage.findActive = function(id) {

    };


    return messagesPage;
});