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

define('pages/notices', [
  'jquery',
  'modules/helpers',
  'colorpicker',
  'datatables',
  'dt_responsive',
  'dt_grouping',
  // 'dt_foundation',
  'dt_scroller',
  'history'
], function ($, helpers) {
  var noticesPage = {}

  noticesPage.init = function (callback) {
    $(document).ready(function () {
      var table = $('#noticesTable')
      table.dataTable({
        searching: false,
        bLengthChange: false,
        bPaginate: false,
        bInfo: false,
        bSort: false,
        scrollY: '100%',
        order: [[3, 'desc']],
        columnDefs: [
          { width: '50px', targets: 0 },
          { width: '20%', targets: 1 },
          { width: '50%', targets: 2 },
          { width: '20%', targets: 3 },
          { width: '50px', targets: 4 }
        ],
        oLanguage: {
          sEmptyTable: 'No notices to display.'
        }
      })
      //                .rowGrouping({
      //                iGroupingColumnIndex: 5,
      //                sGroupingColumnSortDirection: "asc",
      //                iGroupingOrderByColumnIndex: 1,
      //                bHideGroupingColumn: false,
      //                bHideGroupingOrderByColumn: false
      //            });

      helpers.resizeDataTables('.noticesList')

      if (typeof callback === 'function') {
        return callback()
      }
    })
  }

  return noticesPage
})
