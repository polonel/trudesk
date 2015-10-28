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
    'modules/enjoyhint',
    'datatables',
    'dt_responsive',
    'dt_grouping',
    'dt_foundation',
    'dt_scroller',
    'history'

], function($, helpers, moment, eh) {
    var ticketsPage = {};

    ticketsPage.init = function() {
        $(document).ready(function() {
            var table = $('#ticketTable');
            table.dataTable({
                //serverSide: true,
                //processing: true,
                searching: false,
                bLengthChange: false,
                //paging: true,
                //"sPaginationType": "full_numbers",
                iDisplayLength: 99999,
                bInfo: false,
                scrollY: '100%',
                columnDefs: [
                    {"width": "50px", "targets": 0
                        //"data": null,
                        //"render": function(data, type, row, meta) {
                        //    var tr = $(meta.settings.aoData[meta.row].nTr);
                        //    tr.attr('data-ticket', data.uid).attr('data-ticketOid', data._id);
                        //    return '<input id="c_' + data._id + '" type="checkbox"/><label for="c_' + data._id + '"></label>';
                        //}
                        },
                    {"width": "100px", "targets": 1
                        //"data": null,
                        //"render": function(data, type, row, meta) {
                        //    var status = data;
                        //    var tr = $(meta.settings.aoData[meta.row].nTr);
                        //    var cell = $(meta.settings.aoData[meta.row].anCells[1]);
                        //    var text = 'New';
                        //
                        //    //console.log(meta);
                        //    cell.addClass('ticket-status');
                        //
                        //
                        //    if (status === 0) {
                        //        tr.addClass('ticket-new');
                        //        cell.addClass('ticket-new');
                        //    } else if (status === 1) {
                        //        tr.addClass('ticket-open');
                        //        cell.addClass('ticket-open');
                        //        text = 'Open';
                        //    } else if (status === 2) {
                        //        tr.addClass('ticket-pending');
                        //        cell.addClass('ticket-pending');
                        //        text = 'Pending';
                        //    } else if (status === 3) {
                        //        tr.addClass('ticket-closed');
                        //        cell.addClass('ticket-closed');
                        //        text = 'Closed';
                        //    }
                        //
                        //    return '<span>' + text + '</span>';
                        //}
                        },
                    {"width": "65px", "targets": 2},
                    {"width": "25%", "targets": 3 },
                    {"width": "110px", "targets": 4
                        //"render": function(data, type, row, meta) {
                        //    return moment(data).format("MMM DD, YY");
                        //}
                        }
                    //{"targets": 7,
                    //    "render": function(data, type, row, meta) {
                    //        if (data === null || data == undefined)
                    //            return "";
                    //
                    //        return data;
                    //    }},
                    //{"targets": 8,
                    //    "render": function(data, type, row, meta) {
                    //        if (data === null || data == undefined)
                    //            return "--";
                    //
                    //        return moment(data).format("MMM DD \\at h:mma");
                    //    }}
                ],
                order: [[2, "desc"]],
                "oLanguage": {
                    "sEmptyTable": "No tickets to display."
                }
                //ajax: {
                //    url: '/api/tickets/datatable?limit=50&closed=true',
                //    type: 'GET',
                //    dataSrc: "data"
                //},
                //aoColumns: [
                //    {mData: null},
                //    {mData: "status"},
                //    {mData: "uid"},
                //    {mData: "subject"},
                //    {mData: "date"},
                //    {mData: "owner.fullname"},
                //    {mData: "group.name"},
                //    {mData: "assignee.fullname"},
                //    {mData: "updated"}
                //]
//            }).rowGrouping({
//                iGroupingColumnIndex: 1,
//                sGroupingColumnSortDirection: "desc",
//                iGroupingOrderByColumnIndex: 2,
//                bHideGroupingColumn: false,
//                bHideGroupingOrderByColumn: false
            });

            helpers.resizeDataTables('.ticketList');

            $('#ticketTable tbody').on('click', 'td', function(e) {
                var i = $(this).parents('tr').attr('data-ticket');
                var j = $(this).find('input[type=checkbox]');
                if ($(j).length !== 0)
                    return true;

                //handle ticket link here
                History.pushState(null, 'Ticket - ' + i, '/tickets/' + i);
            });

        });
    };

    return ticketsPage;
});