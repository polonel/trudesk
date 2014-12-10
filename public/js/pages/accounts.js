define('pages/accounts', [
    'jquery',
    'modules/helpers',
    'datatables',
    'dt_responsive',
    'dt_grouping',
    'dt_foundation',
    'dt_scroller',
    'history'

], function($, helpers) {
    var accountsPage = {};

    accountsPage.init = function() {
        $(document).ready(function() {
            var table = $('#accountsTable');
            table.dataTable({
                searching: false,
                bLengthChange: false,
                bPaginate: false,
                bInfo: false,
                scrollY: '100%',
                order: [[1, 'asc']],
                columnDefs: [
                    {   "sType": "html",
                        "render": function(data, type, row) {
                            return data;
                        },
                        targets: 5
                    },
                    {"width": "50px", "targets": 0},
                    {"width": "150px", "targets": 1},
                    {"width": "150px", "targets": 2},
                    {"width": "27%", "targets": 3},
                    {"width": "120px", "targets": 4}
                ]
            });
//                .rowGrouping({
//                iGroupingColumnIndex: 5,
//                sGroupingColumnSortDirection: "asc",
//                iGroupingOrderByColumnIndex: 1,
//                bHideGroupingColumn: false,
//                bHideGroupingOrderByColumn: false
//            });

            helpers.resizeDataTables('.accountList');
        });
    };

    return accountsPage;
});