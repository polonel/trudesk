$j = jQuery.noConflict();

$j(document).foundation();
$j(document).ready(function() {
    $j(window).resize(function() {
        resizeFullHeight();
    });
    $j(window).resize();

    $j(".message-items").niceScroll({
        cursorcolor: "#a9b1bf",
        cursorwidth: 7,
        cursorborder: "1px solid #fff"
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


function resizeFullHeight() {
    var ele = $j('.full-height');
    $j.each(ele, function() {
        var h = $j(window).height();
        if ($j(this).css('borderTopStyle') === "solid")
            h = h - 1;
        $j(this).height(h - $j(this).offset().top);
    });
}