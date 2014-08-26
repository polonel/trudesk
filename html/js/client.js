$j = jQuery.noConflict();

$j(document).foundation();
$j(document).ready(function() {
    $j(window).resize(function() {
        resizeFullHeight();
        hideAllpDropDowns();
        hideDropDownScroll();
    });
    $j(window).resize();

    $j(".message-items").niceScroll({
        cursorcolor: "#a9b1bf",
        cursorwidth: 7,
        cursorborder: "1px solid #fff"
    });
    $j(".page-content").niceScroll({
        cursorcolor: "#a9b1bf",
        cursorwidth: 7,
        cursorborder: "1px solid #fff"
    });

    $j('a[data-notifications]').each(function() {
        $j(this).click(function() {
            var drop = $j('#' + $j(this).attr('data-notifications'));
            var scroll = $j('#' + $j(drop).attr('data-scroll'));
            if (drop.css('visibility') === 'visible') {
                drop.removeClass('pDropOpen');

                hideDropDownScroll();

                return;
            }
            var left = ($j(this).offset().left - 250) + 'px';
            var top = $j(this).outerHeight() + 'px';
            $j(drop).addClass('pDropOpen');
            $j(drop).css({'position': 'absolute', 'left': left, 'top': top});

            if ($j(scroll).getNiceScroll().length < 1)
                $j(scroll).niceScroll({
                    cursorcolor: "#a9b1bf",
                    cursorwidth: 7,
                    cursorborder: "1px solid #fff"
                });

            $j(scroll).getNiceScroll().resize();
            $j(scroll).getNiceScroll().show();
        });
    });

    //Hide DropDowns
    $j(document).mouseup(function(e) {
        $j('a[data-notifications]').each(function() {
            var drop = $j('#' + $j(this).attr('data-notifications'));
            if ($j(this).has(e.target).length !== 0)
                return;
            if (!drop.is(e.target) && drop.has(e.target).length === 0)
                if (drop.hasClass('pDropOpen')) {
                    drop.removeClass('pDropOpen');
                    hideDropDownScroll();
                }
        })
    });

    $j('.message-items > li').click(function() {
        var a = $j(this).find('a');
        if (a.length) {
            var href = a.attr('href');
            if (href.length)
                window.location.href = href;
        }
    });
});

function hideDropDownScroll() {
    $j('div[data-scroll]').each(function() {
        var scroll = $j('#' + $j(this).attr('data-scroll'));
        if ($j(scroll).length !== 0)
            $j(scroll).getNiceScroll().hide();
    });
}

function hideAllpDropDowns() {
    $j('a[data-notifications]').each(function() {
        var drop = $j('#' + $j(this).attr('data-notifications'));
        if (drop.hasClass('pDropOpen')) {
            drop.removeClass('pDropOpen');
            hideDropDownScroll();
        }
    });
}

function resizeFullHeight() {
    var ele = $j('.full-height');
    $j.each(ele, function() {
        var h = $j(window).height();
        if ($j(this).css('borderTopStyle') === "solid")
            h = h - 1;
        $j(this).height(h - $j(this).offset().top);
    });
}