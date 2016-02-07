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

define('pages/accounts', [
    'jquery',
    'modules/helpers',
    'uikit',
    'datatables',
    'dt_responsive',
    'dt_grouping',
    'dt_foundation',
    'dt_scroller',
    'history'

], function($, helpers, UIkit) {
    var accountsPage = {};

    accountsPage.init = function() {
        $(document).ready(function() {
//            var table = $('#accountsTable');
//            table.dataTable({
//                //searching: false,
//                bLengthChange: false,
//                bPaginate: false,
//                bInfo: false,
//                scrollY: '100%',
//                order: [[1, 'asc']],
//                columnDefs: [
//                    {   "sType": "html",
//                        "render": function(data, type, row) {
//                            return data;
//                        },
//                        targets: 5
//                    },
//                    {"width": "50px", "targets": 0},
//                    {"width": "150px", "targets": 1},
//                    {"width": "150px", "targets": 2},
//                    {"width": "27%", "targets": 3},
//                    {"width": "120px", "targets": 4}
//                ]
//            });
////                .rowGrouping({
////                iGroupingColumnIndex: 5,
////                sGroupingColumnSortDirection: "asc",
////                iGroupingOrderByColumnIndex: 1,
////                bHideGroupingColumn: false,
////                bHideGroupingOrderByColumn: false
////            });
//
//            helpers.resizeDataTables('.accountList');

            accountsPage.setupGrid();
        });
    };

    accountsPage.setupGrid = function() {
        // get all filters
        var userArray = [];
        var $account_list = $('#account_list');
        $account_list.children().each(function() {
            var thisfilter = $(this).attr('data-uk-filter');
            if ( $.inArray( thisfilter, userArray ) == -1) {
                userArray.push(thisfilter.split(',')[1]);
            }
        });
        var userArray_length = userArray.length;

        // initialize dynamic grid
        var myGrid = UIkit.grid($account_list,{
            controls: '#account_list_filter',
            gutter: 20
        });

        // find user
        $("#account_list_search").keyup(function(){
            var sValue = $(this).val().toLowerCase();

            if(sValue.length > 2) {
                var filteredItems = '';
                for($i=0;$i<userArray_length;$i++) {
                    if(userArray[$i].toLowerCase().indexOf(sValue) !== -1) {
                        filteredItems += (filteredItems.length > 1 ? ',' : '') + userArray[$i];
                    }
                }
                if(filteredItems){
                    // filter grid items
                    myGrid.filter(filteredItems);
                    filteredItems = '';
                } else {
                    // show all
                    myGrid.filter('all');
                }
            } else {
                // reset filter
                myGrid.filter();
            }

        });
    };

    return accountsPage;
});