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

define('pages/tickets', [
    'jquery',
    'modules/helpers',
    'moment',
    'datatables',
    'dt_responsive',
    'dt_grouping',
    //'dt_foundation',
    'dt_scroller',
    'history'

], function($, helpers, moment) {
    var ticketsPage = {};

    ticketsPage.init = function(callback) {
        $(document).ready(function() {
            var table = $('#ticketTable');
            table.dataTable({
                searching: false,
                bLengthChange: false,
                paging: false,
                iDisplayLength: 99999,
                bInfo: false,
                scrollY: '100%',
                columnDefs: [
                    {"width": "50px", "targets": 0 },
                    {"width": "100px", "targets": 1 },
                    {"width": "65px", "targets": 2 },
                    {"width": "25%", "targets": 3 },
                    {"width": "110px", "targets": 4 }
                ],
                order: [[2, "desc"]],
                "oLanguage": {
                    "sEmptyTable": "No tickets to display."
                }
            });

            helpers.resizeAll();

            $('#ticketTable tbody').on('click', 'td', function() {
                var i = $(this).parents('tr').attr('data-ticket');
                var j = $(this).find('input[type=checkbox]');
                if ($(j).length !== 0)
                    return true;

                History.pushState(null, 'Ticket - ' + i, '/tickets/' + i);
            });


            //Overdue Tickets
            var hexDigits = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];

            //Function to convert hex format to a rgb color
            function rgb2hex(rgb) {
                rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]).toLowerCase();
            }

            function hex(x) {
                return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
            }

            $('tr.overdue').each(function() {
                var self = $(this);
                self.css('background-color', '#b71c1c');
                self.find('td').css('color', '#fff');
                setInterval(function() {
                    var bgColor = self.css('background-color');
                    bgColor = rgb2hex(bgColor);
                    if (bgColor === '#b71c1c') {
                        self.css('background-color', '#ffffff');
                        self.find('td').css('color', '#55616e');
                    } else {
                        self.css('background-color', '#b71c1c');
                        self.find('td').css('color', '#fff');
                    }
                }, 800);
            });

            if (typeof callback === 'function')
                return callback();
        });
    };

    return ticketsPage;
});