$j = jQuery.noConflict();

$j(document).foundation();
$j(document).ready(function() {


    $j('.message-items > li').click(function() {
        var a = $j(this).find('a');
        if (a.length) {
            var href = a.attr('href');
            if (href.length)
                window.location.href = href;
        }
    });

    $j(window).resize(function() {
        resizeFullHeight();
    });
    $j(window).resize();
});


function resizeFullHeight() {
    var ele = $j('.full-height');
    $j.each(ele, function() {
        var h = $j(window).height();
        $j(this).height(h - $j(this).offset().top);
    });
}