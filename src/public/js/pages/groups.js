/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define('pages/groups', [
  'jquery',
  'modules/helpers',
  'uikit',
  'datatables',
  'dt_responsive',
  'dt_grouping',
  // 'dt_foundation',
  'dt_scroller',
  'history'
], function ($, helpers, UIkit) {
  var groupsPage = {}

  groupsPage.init = function (callback) {
    $(document).ready(function () {
      // get all filters
      var filterArray = []
      $('#group_list')
        .children()
        .each(function () {
          var thisfilter = $(this).attr('data-uk-filter')
          if ($.inArray(thisfilter, filterArray) === -1) {
            filterArray.push(thisfilter)
          }
        })

      var filterArrayLength = filterArray.length

      var grid = UIkit.grid($('#group_list'), {
        controls: '',
        gutter: 20
      })

      // find user
      $('#group_list_search')
        .keyup(function () {
          var sValue = $(this)
            .val()
            .toLowerCase()

          if (sValue.length > 2) {
            var filteredItems = ''
            for (var $i = 0; $i < filterArrayLength; $i++) {
              if (filterArray[$i].toLowerCase().indexOf(sValue) !== -1) {
                filteredItems += (filteredItems.length > 1 ? ',' : '') + filterArray[$i]
              }
            }

            if (filteredItems) {
              // filter grid items
              grid.filter(filteredItems)
            } else {
              // show all
              grid.filter('all')
            }
          } else {
            // reset filter
            grid.filter()
          }
        })
        .on('blur', function () {
          // clear search input
          // $(this).val('');
        })

      //            var table = $('#groupsTable');
      //            table.dataTable({
      //                searching: true,
      //                bLengthChange: false,
      //                bPaginate: false,
      //                iDisplayLength: 99999,
      //                bInfo: false,
      //                scrollY: '100%',
      //                order: [[1, 'asc']],
      //                columnDefs: [
      //                    {"width": "50px", "targets": 0}
      //                ]
      //            });
      /// /                .rowGrouping({
      /// /                iGroupingColumnIndex: 5,
      /// /                sGroupingColumnSortDirection: "asc",
      /// /                iGroupingOrderByColumnIndex: 1,
      /// /                bHideGroupingColumn: false,
      /// /                bHideGroupingOrderByColumn: false
      /// /            });
      //
      //            helpers.resizeDataTables('.groupsList');

      if (typeof callback === 'function') {
        return callback()
      }
    })
  }

  return groupsPage
})
