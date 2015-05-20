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
    'datatables',
    'dt_responsive',
    'dt_grouping',
    'dt_foundation',
    'dt_scroller',
    'history'

], function($, helpers) {
    var ticketsPage = {};

    ticketsPage.init = function() {
        $(document).ready(function() {
            var table = $('#ticketTable');
            table.dataTable({
                searching: true,
                bLengthChange: false,
                bPaginate: false,
                bInfo: false,
                scrollY: '100%',
                columnDefs: [
                    {"width": "50px", "targets": 0},
                    {"width": "100px", "targets": 1},
                    {"width": "65px", "targets": 2},
                    {"width": "25%", "targets": 3},
                    {"width": "110px", "targets": 4}
                ],
                order: [[2, "desc"]],
                "oLanguage": {
                    "sEmptyTable": "No tickets to display."
                }

//                columns: [
//                    {data: "_id"},
//                    {data: "status"},
//                    {data: "uid"},
//                    {data: "subject"},
//                    {data: "date"},
//                    {data: "owner.fullname"},
//                    {data: "group.name"},
//                    {data: "assignee.fullname"},
//                    {data: "updated"}
//                ],
//                ajax: {
//                    url: '/api/tickets',
//                    dataSrc: "",
//                    type: 'GET'
//                }
//            }).rowGrouping({
//                iGroupingColumnIndex: 1,
//                sGroupingColumnSortDirection: "desc",
//                iGroupingOrderByColumnIndex: 2,
//                bHideGroupingColumn: false,
//                bHideGroupingOrderByColumn: false
            });

            helpers.resizeDataTables('.ticketList');

            var tableRow = table.find('tr[data-ticket] > td');
            if (tableRow.length !== 0) {
                tableRow.on('click', function(e) {
                    var i = $(this).parent('tr[data-ticket]').attr('data-ticket');
                    var j = $(this).find('input[type=checkbox]');
                    if ($(j).length !== 0)
                        return true;

                    //handle ticket link here
                    History.pushState(null, 'Ticket - ' + i, '/tickets/' + i);
                });
            }
        });
    };

    return ticketsPage;
});