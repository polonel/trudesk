define('pages/groups', [
    'jquery',
    'modules/helpers',
    'datatables',
    'dt_responsive',
    'dt_grouping',
    'dt_foundation',
    'dt_scroller',
    'history'

], function($, helpers) {
    var groupsPage = {};

    groupsPage.init = function() {
        $(document).ready(function() {
            var table = $('#groupsTable');
            table.dataTable({
                searching: false,
                bLengthChange: false,
                bPaginate: false,
                bInfo: false,
                scrollY: '100%',
                order: [[1, 'asc']],
                columnDefs: [
                    {"width": "50px", "targets": 0}
                ]
            });
//                .rowGrouping({
//                iGroupingColumnIndex: 5,
//                sGroupingColumnSortDirection: "asc",
//                iGroupingOrderByColumnIndex: 1,
//                bHideGroupingColumn: false,
//                bHideGroupingOrderByColumn: false
//            });

            helpers.resizeDataTables('.groupsList');
        });
    };

    return groupsPage;
});