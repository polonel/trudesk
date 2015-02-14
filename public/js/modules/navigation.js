"use strict";

define(['jquery', 'modules/helpers', 'underscore', 'modules/socket', 'foundation'], function($, helpers, _, socket) {
    var navigation = {};

    navigation.init = function() {
        this.notifications();
    };

    navigation.notifications = function() {
        $('a[data-notifications]').each(function() {
            $(this).off('click', showDropdown);
            $(this).on('click', showDropdown);
        });

        $('a[data-clearNotifications]').each(function() {
            $(this).off('click', clearNotifications);
            $(this).on('click', clearNotifications);
        });

        $(document).off('mouseup', hideDropdownMouseUp);
        $(document).on('mouseup', hideDropdownMouseUp);
    };

    function clearNotifications(e) {
        socket.ui.clearNotifications();
    }

    function hideDropdownMouseUp(e) {
        $('a[data-notifications]').each(function() {
            var drop = $('#' + $(this).attr('data-notifications'));
            if ($(this).has(e.target).length !== 0)
                return;
            if (!drop.is(e.target) && drop.has(e.target).length === 0)
                if (drop.hasClass('pDropOpen')) {
                    drop.removeClass('pDropOpen');
                    helpers.hideDropDownScrolls();
                }
        });
    }

    function showDropdown(e) {
        var drop = $('#' + $(this).attr('data-notifications'));
        var scroll = $('#' + $(drop).attr('data-scroll'));
        if (drop.css('visibility') === 'visible') {
            drop.removeClass('pDropOpen');
            helpers.hideDropDownScrolls();

            return true;
        }
        var pageContent = $(this).parents('#page-content > div');
        var insidePage = pageContent.length > 0;
        var pageOffsetTop = 0;
        var pageOffsetLeft = 0;
        if (insidePage) {
            var pOffset = pageContent.offset();
            pageOffsetTop = pOffset.top;
            pageOffsetLeft = pOffset.left;
        }

        var leftO = 250;

        if ($(drop).hasClass('pSmall')) leftO = 180;

        var left = (($(this).offset().left - $(window).scrollLeft() - pageOffsetLeft) - leftO);
        if (drop.hasClass('p-dropdown-left')) {
            //left += 250;
        }
        var leftExtraOffset = $(drop).attr('data-left-offset');
        if (_.isUndefined(leftExtraOffset)) {
            leftExtraOffset = 0;
        }
        left += Number(leftExtraOffset);
        left = left + 'px';

        var topOffset = $(this).offset().top - $(window).scrollTop() - pageOffsetTop;
        var top = $(this).outerHeight() + topOffset;
        var topExtraOffset = $(drop).attr('data-top-offset');
        if (_.isUndefined(topExtraOffset)) {
            topExtraOffset = 0;
        }
        top += Number(topExtraOffset);
        top = top + 'px';

        var override = $(drop).attr('data-override');
        if (!_.isUndefined(override) && override.length > 0) {
            top = topExtraOffset + 'px';
            left = leftExtraOffset + 'px';
        }

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

        e.preventDefault();
    }

    return navigation;
});