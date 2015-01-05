define('pages/editaccount', [
    'jquery',
    'modules/helpers',
    'chosen',
    'history'

], function($, helpers) {
    var editaccount = {};

    editaccount.init = function() {
        $(document).ready(function() {
            $('.chosen-select').each(function() {
                var self = $(this);
                var nosearch = $(this).attr('data-nosearch');
                var searchNum = 10;
                if (nosearch) searchNum = 90000;
                self.chosen({
                    disable_search_threshold: searchNum
                });
            });

            var $hoverAction = $('.hoverAction');
            $hoverAction.parent().off('hover');
            $hoverAction.parent().hover(function() {
                var self = $(this);
                var hoverAction = self.find('.hoverAction');
                hoverAction.stop().animate({bottom: 0}, 150);
            }, function() {
                var self = $(this);
                var hoverAction = self.find('.hoverAction');
                hoverAction.stop().animate({bottom: '-55px'}, 150);
            });
        });
    };

    return editaccount;
});