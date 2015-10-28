/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

define('pages/dashboard', [
    'jquery',
    'modules/helpers',
    'modules/flotchart',
    'modules/navigation',
    'history'

], function($, helpers, flotchart, nav) {
    var dashboardPage = {};

    dashboardPage.init = function() {
        $(document).ready(function() {
            getData();
        });
    };

    function getData() {
        var $ticketLines = $('#ticketLines');
        if ($ticketLines.length > 0) {
            $.ajaxSetup({cache: false});
            $.ajax({
                url: '/api/v1/tickets/count/month/0',
                method: 'GET',
                success: updateFlot
            })
                .error(function(err) {
                    console.log('[trudesk:dashboard:getData] Error - ' + err);
                    setTimeout(getData, 25000);
                });

        }
    }

    function updateFlot(_data) {
        var $ticketLines = $('#ticketLines');
        if ($ticketLines.length > 0) {
            $ticketLines.html('');
            $.plot($ticketLines, _data, flotchart.options);

            setTimeout(getData, 25000);
        }
    }

    return dashboardPage;
});