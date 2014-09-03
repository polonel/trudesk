$j = jQuery.noConflict();

$j(document).foundation();
$j(document).ready(function() {
    pingStatus();
    $j(window).resize(function() {
        resizeFullHeight();
        resizeDataTables();
        hideAllpDropDowns();
        hideDropDownScroll();
    });
    $j(window).resize();

    $j('#ticketTable').dataTable({
        searching: false,
        bLengthChange: false,
        bPaginate: false,
        bInfo: false,
        scrollY: '0px'
    }).rowGrouping({
        iGroupingColumnIndex: 1,
        sGroupingColumnSortDirection: "asc",
        iGroupingOrderByColumnIndex: 0,
        bHideGroupingColumn: false,
        bHideGroupingOrderByColumn: false
    });

    resizeDataTables();

    $j('#ticketTable tbody tr[data-ticket] td').click(function(){
        var i = $j(this).parent('tr[data-ticket]').attr('data-ticket');
        var j = $j(this).find('input[type=checkbox]');
        if ($j(j).length !== 0)
            return true;

        //handle ticket link here
    });

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
    $j(".dataTables_scrollBody").niceScroll({
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

    $j('ul.side-nav>li>a[data-sub-menu]').click(function(e) {
        var subMenu = $j('#' + ($j(this).attr('data-sub-menu')));
        if ($j(subMenu).length < 1) {
            e.preventDefault();
            return;
        }

        if ($j(subMenu).hasClass('subMenuOpen')) {
            console.log('going up');
            $j(subMenu).slideUp(function(){
                $j(subMenu).removeClass('subMenuOpen')
            });

        } else {
            $j(subMenu).slideDown(function() {
                $j(subMenu).addClass('subMenuOpen');
            });
        }

        e.preventDefault();
    });

    $j('span[data-ptooltip]').each(function() {
        var title = $j(this).attr('data-title');
        var type = $j(this).attr('data-ptooltip-type');
        var html = "<div class='ptooltip-box-wrap' data-ptooltip-id='" + $j(this).attr('id') + "'><div class='ptooltip-box'><span>" + title + "</span>";
        if (type.toLowerCase() === 'service') {
            var status = $j(this).attr('data-service-status');
            var color = "#fff";
            if (status.toLowerCase() === 'starting' || status.toLowerCase() === 'stopping')
                color = "#e77c3c";
            if (status.toLowerCase() === 'running')
                color = '#29b955';
            if (status.toLowerCase() === 'stopped')
                color = '#e54242';

            html += "<span>Status: <span style='color: " + color + ";'>" + status + "</span>";
        }

        html += "</div></div>";

        $j(this).append(html);
    });

    $j('span[data-ptooltip]').hover(function() {
        var id = $j(this).attr('id');
        $j('div.ptooltip-box-wrap[data-ptooltip-id="' + id + '"]').show();
    }, function() {
        var id = $j(this).attr('id');
        $j('div.ptooltip-box-wrap[data-ptooltip-id="' + id + '"]').hide();
    });

    //Auto Growing TextArea
    //$j('.textAreaAutogrow').autogrow({onInitialize: true});
    $j('textarea.textAreaAutogrow').autogrow({
        preGrowCallback: growCallback()
    });
    $j('.chat-box-text').click(function() {
        $j(this).children('textarea').focus();
        var val = $j(this).children('textarea').val();
        $j(this).children('textarea').val('').val(val);
    });
});

function growCallback() {
    console.log('callback');
}

function pingStatus() {
    $j('.server-ping').each(function() {
        console.log($j(this).children('p').html())
        if ($j(this).children('p').html() === "timeout") {
            $j(this).addClass('ping-status-timeout');
            return;
        }

        var ping = parseInt($j(this).children('p').html());
        if (ping < 100) {
          $j(this).addClass('ping-status-green');
        } else if (ping > 100 && ping < 300) {
            $j(this).addClass('ping-status-orange');
        } else {
            $j(this).addClass('ping-status-red');
        }
    });

}

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

function resizeDataTables() {
    if ($j('.ticketList .dataTables_scrollBody').length !== 0)
        $j('.ticketList .dataTables_scrollBody').css({'height': ($j(".ticketList").height() - $j('.dataTables_scrollHead').height()) + 'px'});
}

function resizeFullHeight() {
    var ele = $j('.full-height');
    $j.each(ele, function() {
        var h = $j(window).height();
        if ($j(this).css('borderTopStyle') === "solid")
            h = h - 1;

        $j(this).css('overflow', 'hidden');
        $j(this).height(h - ($j(this).offset().top));
    });
}