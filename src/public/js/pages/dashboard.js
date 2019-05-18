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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define('pages/dashboard', [
  'jquery',
  'underscore',
  'modules/helpers',
  'countup',
  'c3',
  'd3',
  'moment',
  'd3pie',
  'metricsgraphics',
  'peity',
  'history'
], function ($, _, helpers, CountUp, c3, d3, moment) {
  var dashboardPage = {}

  dashboardPage.init = function (callback) {
    $(document).ready(function () {
      var testPage = $('#page-content').find('.dashboard')
      if (testPage.length < 1) {
        if (typeof callback === 'function') {
          return callback()
        }

        return true
      }

      helpers.resizeAll()

      dashboardPage.shortDateFormat = window.trudeskSettingsService.getSettings().shortDateFormat.value

      var parms = {
        full_width: true,
        height: 250,
        target: '#breakdownGraph',
        x_accessor: 'date',
        y_accessor: 'value',
        y_extended_ticks: true,
        show_tooltips: false,
        area: [1],
        aggregate_rollover: true,
        transition_on_update: false
        // colors: ['#2196f3']
      }

      var showOverdue =
        $('#__showOverdueTickets')
          .text()
          .toLowerCase() === 'true'
      if (showOverdue) {
        var overdueCard = $('#overdue_tickets')
        var $overdueTableBody = overdueCard.find('table.uk-table > tbody')
        $overdueTableBody.empty() // Clear
        $.ajax({
          url: '/api/v1/tickets/overdue',
          method: 'GET',
          success: function (_data) {
            var overdueSpinner = overdueCard.find('.card-spinner')
            var html = ''
            _.each(_data.tickets, function (ticket) {
              html += '<tr class="uk-table-middle">'
              html +=
                '<td class="uk-width-1-10 uk-text-nowrap"><a href="/tickets/' +
                ticket.uid +
                '">T#' +
                ticket.uid +
                '</a></td>'
              html +=
                '<td class="uk-width-1-10 uk-text-nowrap"><span class="uk-badge ticket-status-open uk-width-1-1">Open</span></td>'
              html += '<td class="uk-width-6-10">' + ticket.subject + '</td>'
              if (ticket.updated) {
                html +=
                  '<td class="uk-width-2-10 uk-text-right uk-text-muted uk-text-small">' +
                  moment
                    .utc(ticket.updated)
                    .tz(helpers.getTimezone())
                    .format(dashboardPage.shortDateFormat) +
                  '</td>'
              } else {
                html +=
                  '<td class="uk-width-2-10 uk-text-right uk-text-muted uk-text-small">' +
                  moment
                    .utc(ticket.date)
                    .tz(helpers.getTimezone())
                    .format(dashboardPage.shortDateFormat) +
                  '</td>'
              }
              html += '</tr>'
            })

            $overdueTableBody.append(html)
            $overdueTableBody.ajaxify()
            overdueSpinner.animate({ opacity: 0 }, 600, function () {
              $(this).hide()
            })
          },
          error: function (err) {
            console.log('[trudesk:dashboard:loadOverdue] Error - ' + err.responseText)
            helpers.UI.showSnackbar(err.responseText, true)
          }
        })
      }

      getData(30)

      $('#select_timespan').on('change', function () {
        var self = $(this)
        getData(self.val())
      })

      function getData (timespan) {
        $.ajax({
          url: '/api/v1/tickets/stats/' + timespan,
          method: 'GET',
          success: function (_data) {
            var lastUpdated = $('#lastUpdated').find('span')

            var formatString = helpers.getLongDateFormat() + ' ' + helpers.getTimeFormat()
            var formated = moment.utc(_data.lastUpdated, 'MM/DD/YYYY hh:mm:ssa').format(formatString)

            lastUpdated.text(formated)

            if (!_data.data) {
              console.log('[trudesk:dashboard:getData] Error - Invalid Graph Data')
              helpers.UI.showSnackbar('Error - Invalid Graph Data', true)
            } else if (_data.data.length < 1) {
              // No data in graph. Show No Data avaliable
              var $breakdownGraph = $('#breakdownGraph')
              $breakdownGraph.empty()
              $breakdownGraph.append('<div class="no-data-available-text">No Data Available</div>')
            } else {
              $('#breakdownGraph').empty()
              parms.data = MG.convert.date(_data.data, 'date')
              MG.data_graphic(parms)
            }

            var tCount = _data.ticketCount

            var ticketCount = $('#ticketCount')
            var oldTicketCount = ticketCount.text() === '--' ? 0 : ticketCount.text()
            var totalTicketText = 'Total Tickets (last ' + timespan + 'd)'
            // if (timespan == 0)
            //     totalTicketText = 'Total Tickets (lifetime)';
            ticketCount
              .parents('.tru-card-content')
              .find('span.uk-text-small')
              .text(totalTicketText)
            var theAnimation = new CountUp('ticketCount', parseInt(oldTicketCount), tCount, 0, 1.5)
            theAnimation.start()

            var closedCount = Number(_data.closedCount)
            var closedPercent = Math.round((closedCount / tCount) * 100)

            var textComplete = $('#text_complete')
            var oldTextComplete = textComplete.text() === '--' ? 0 : textComplete.text()
            var completeAnimation = new CountUp('text_complete', parseInt(oldTextComplete), closedPercent, 0, 1.5)
            completeAnimation.start()

            var pieComplete = $('#pie_complete')
            pieComplete.text(closedPercent + '/100')
            pieComplete.peity('donut', {
              height: 24,
              width: 24,
              fill: ['#29b955', '#ccc']
            })

            var $responseTimeText = $('#responseTime_text')
            // var responseTime_graph = $('#responseTime_graph');
            var oldResponseTime = $responseTimeText.text() === '--' ? 0 : $responseTimeText.text()
            var responseTime = _data.ticketAvg
            var responseTimeAnimation = new CountUp(
              'responseTime_text',
              parseInt(oldResponseTime),
              responseTime,
              0,
              1.5
            )
            responseTimeAnimation.start()

            // QuickStats
            var mostRequester = $('#mostRequester')
            if (_data.mostRequester) {
              mostRequester.text(_data.mostRequester.name + ' (' + _data.mostRequester.value + ')')
            }
            var mostCommenter = $('#mostCommenter')
            if (_data.mostCommenter) {
              mostCommenter.text(_data.mostCommenter.name + ' (' + _data.mostCommenter.value + ')')
            } else {
              mostCommenter.text('--')
            }

            var mostAssignee = $('#mostAssignee')
            if (_data.mostAssignee) {
              mostAssignee.text(_data.mostAssignee.name + ' (' + _data.mostAssignee.value + ')')
            } else {
              mostAssignee.text('--')
            }

            var mostActiveTicket = $('#mostActiveTicket')
            if (_data.mostActiveTicket) {
              mostActiveTicket
                .attr('href', '/tickets/' + _data.mostActiveTicket.uid)
                .text('T#' + _data.mostActiveTicket.uid)
            }
          },
          error: function (err) {
            console.log('[trudesk:dashboard:getData] Error - ' + err.responseText)
            helpers.UI.showSnackbar(err.responseText, true)
          }
        })

        $('#topTenTags')
          .parents('.panel')
          .find('.card-spinner')
          .css({ display: 'block', opacity: 1 })
        $.ajax({
          url: '/api/v1/tickets/count/tags/' + timespan,
          method: 'GET',
          success: function (data) {
            var arr = _.map(data.tags, function (v, key) {
              return [key, v]
            })

            arr = _.first(arr, 10)
            var colors = [
              '#e74c3c',
              '#3498db',
              '#9b59b6',
              '#34495e',
              '#1abc9c',
              '#2ecc71',
              '#03A9F4',
              '#00BCD4',
              '#009688',
              '#4CAF50',
              '#FF5722',
              '#CDDC39',
              '#FFC107',
              '#00E5FF',
              '#E040FB',
              '#607D8B'
            ]

            var c = _.object(
              _.map(arr, function (v) {
                return v[0]
              }),
              _.shuffle(colors)
            )

            c3.generate({
              bindto: d3.select('#topTenTags'),
              size: {
                height: 200
              },
              data: {
                columns: arr,
                type: 'donut',
                colors: c,
                empty: { label: { text: 'No Data Available' } }
              },
              donut: {
                label: {
                  format: function () {
                    return ''
                  }
                }
              }
            })

            $('#topTenTags')
              .parents('.panel')
              .find('.card-spinner')
              .animate({ opacity: 0 }, 600, function () {
                $(this).hide()
              })
          }
        })

        $('#pieChart')
          .parent()
          .find('.card-spinner')
          .css({ display: 'block', opacity: 1 })
        $.ajax({
          url: '/api/v1/tickets/count/topgroups/' + timespan + '/5',
          method: 'GET',
          success: function (data) {
            var arr = _.map(data.items, function (v) {
              return [v.name, v.count]
            })

            var colors = [
              '#e74c3c',
              '#3498db',
              '#9b59b6',
              '#34495e',
              '#1abc9c',
              '#2ecc71',
              '#03A9F4',
              '#00BCD4',
              '#009688',
              '#4CAF50',
              '#FF5722',
              '#CDDC39',
              '#FFC107',
              '#00E5FF',
              '#E040FB',
              '#607D8B'
            ]

            colors = _.shuffle(colors)

            var c = _.object(
              _.map(arr, function (v) {
                return v[0]
              }),
              colors
            )

            c3.generate({
              bindto: d3.select('#pieChart'),
              size: {
                height: 200
              },
              data: {
                columns: arr,
                type: 'pie',
                colors: c,
                empty: { label: { text: 'No Data Available' } }
              },
              donut: {
                label: {
                  format: function () {
                    return ''
                  }
                }
              }
            })

            $('#pieChart')
              .parent()
              .find('.card-spinner')
              .animate({ opacity: 0 }, 600, function () {
                $(this).hide()
              })
          }
        })
      }

      if (typeof callback === 'function') {
        return callback()
      }
    })
  }

  return dashboardPage
})
