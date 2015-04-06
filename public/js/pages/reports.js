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

define('pages/reports', [
    'jquery',
    'modules/helpers',
    'datatables',
    'dt_responsive',
    'dt_grouping',
    'dt_foundation',
    'dt_scroller',
    'history'

], function($, helpers) {
    var reportsPage = {};

    reportsPage.init = function() {
        $(document).ready(function() {
            var table = $('#reportTable');
            table.dataTable({
                searching: false,
                bLengthChange: false,
                bPaginate: false,
                bInfo: false,
                scrollY: '100%',
                order: [[1, 'asc']],
                columnDefs: [
                    {"width": "50px", "targets": 0}
                ],
                "oLanguage": {
                    "sEmptyTable": "No reports to display."
                }
            });
//                .rowGrouping({
//                iGroupingColumnIndex: 5,
//                sGroupingColumnSortDirection: "asc",
//                iGroupingOrderByColumnIndex: 1,
//                bHideGroupingColumn: false,
//                bHideGroupingOrderByColumn: false
//            });

            helpers.resizeDataTables('.reportList');
        });
    };

    return reportsPage;
});