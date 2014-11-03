"use strict";

define(['jquery', 'modules/helpers', 'foundation'], function($, helpers) {
    var navigation = {};

    navigation.init = function() {
        this.notifications();
        this.sidebar();
    };

    navigation.sidebar = function() {

    };

    navigation.notifications = function() {
        $('a[data-notifications]').each(function() {
            $(this).click(function(e) {
                var drop = $('#' + $(this).attr('data-notifications'));
                var scroll = $('#' + $(drop).attr('data-scroll'));
                if (drop.css('visibility') === 'visible') {
                    drop.removeClass('pDropOpen');

                    helpers.hideDropDownScrolls();

                    return;
                }
                var left = ($(this).offset().left - 250) + 'px';
                var top = $(this).outerHeight() + 'px';
                $(drop).addClass('pDropOpen');
                $(drop).css({'position': 'absolute', 'left': left, 'top': top});

                if ($(scroll).getNiceScroll().length < 1)
                    $(scroll).niceScroll({
                        cursorcolor: "#a9b1bf",
                        cursorwidth: 7,
                        cursorborder: "1px solid #fff"
                    });

                $(scroll).getNiceScroll().resize();
                $(scroll).getNiceScroll().show();
            });
        });

        $(document).mouseup(function(e) {
            $('a[data-notifications]').each(function() {
                var drop = $('#' + $(this).attr('data-notifications'));
                if ($(this).has(e.target).length !== 0)
                    return;
                if (!drop.is(e.target) && drop.has(e.target).length === 0)
                    if (drop.hasClass('pDropOpen')) {
                        drop.removeClass('pDropOpen');
                        helpers.hideDropDownScrolls();
                    }
            })
        });
    };

    return navigation;
});