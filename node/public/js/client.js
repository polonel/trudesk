var $j = jQuery.noConflict();

$j(document).foundation();
$j(window).resize(function() {
    resizeFullHeight();
    resizeDataTables();
    hideAllpDropDowns();
    hideDropDownScroll();
});

$j(window).load(function() {
    $j(window).resize();
});

(function() {
    pingStatus();
    resizeFullHeight();

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

    $j('.scrollable').each(function() {
        $j(this).niceScroll({
            cursorcolor: "#a9b1bf",
            cursorwidth: 7,
            cursorborder: "1px solid #fff"
        });
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

//        if ($j(subMenu).hasClass('subMenuOpen')) {
//            $j(subMenu).slideUp(function(){
//                $j(subMenu).removeClass('subMenuOpen')
//            });
//
//        } else {
//            $j(subMenu).slideDown(function() {
//                $j(subMenu).addClass('subMenuOpen');
//            });
//        }

        //e.preventDefault();
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
        } else if (type.toLowerCase() === 'dailyticket') {
            var n = $j(this).attr('data-new-count');
            var c = $j(this).attr('data-closed-count');

            html += "<span><span style='color: #e74c3c'>" + n + "</span> New / <span style='color: #3498db'>" + c + "</span> Closed</span>";
        }

        html += "</div></div>";
        var k = $j('<div></div>').css({'position': 'relative'});
        k.append(html);

        $j(this).append(k);
    });

    $j('span[data-ptooltip]').hover(function() {
        var id = $j(this).attr('id');
        $j('div.ptooltip-box-wrap[data-ptooltip-id="' + id + '"]').show();
    }, function() {
        var id = $j(this).attr('id');
        $j('div.ptooltip-box-wrap[data-ptooltip-id="' + id + '"]').hide();
    });

    //donutchart
    $j('.donutchart').each(function() {
        var trackColor = $j(this).attr('data-trackColor');
        if (trackColor == null || trackColor.length <= 0)
            trackColor = '#e74c3c';
        var numCount = $j(this).attr('data-numCount');
        if (numCount == null || numCount.length <= 0)
            numCount = false;

        $j(this).easyPieChart({
            size: 150,
            lineCap: 'round',
            lineWidth: 8,
            scaleColor: false,
            barColor: trackColor,
            trackColor: '#b5bbc9',
            onStart: function(value, to) {
                $j(this.el).find('.chart-value').text('0');
            },
            onStop: function(value, to) {
                if (numCount) {
                    var totalNum = parseInt($j(this.el).attr('data-totalNumCount'));
                    $j(this.el).find('.chart-value').text(totalNum);
                    return true;
                }
                $j(this.el).find('.chart-value').text(Math.round(to));
            },
            onStep: function(from, to, percent) {
                if (numCount) {
                    var countVal = parseInt($j(this.el).attr('data-totalNumCount'));
                    var current = parseInt($j(this.el).find('.chart-value').text());
                    if (countVal != null && countVal > 0 && current != null) {
                        var totalCount = Math.round(countVal*(100/Math.round(to)));
                        var val = totalCount*(0.01*Math.round(percent));
                        $j(this.el).find('.chart-value').text(Math.round(val));
                        return true;
                    }
                }

                $j(this.el).find('.chart-value').text(Math.round(percent));
            }
        });
    });

    //Bar Chart - Tickets
    $j('.bar-chart > .bar').each(function() {
        var $this = $j(this);
        var val = $this.attr('data-percent');
        var i = 170*(0.01*val);
        $this.find('span.bar-track').height(0);
        $this.find('span.bar-track').animate({
            'height': i
        }, 1000);
    });

})();

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