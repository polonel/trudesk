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
                searching: false,
                bLengthChange: false,
                bPaginate: false,
                bInfo: false,
                scrollY: '100%',
                columnDefs: [
                    {"width": "50px", "targets": 0},
                    {"width": "100px", "targets": 1},
                    {"width": "30%", "targets": 2},
                    {"width": "110px", "targets": 3}
                ]
            }).rowGrouping({
                iGroupingColumnIndex: 1,
                sGroupingColumnSortDirection: "asc",
                iGroupingOrderByColumnIndex: 0,
                bHideGroupingColumn: false,
                bHideGroupingOrderByColumn: false
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