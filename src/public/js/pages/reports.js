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
    'underscore',
    'modules/helpers',
    'countup',
    'c3',
    'd3pie',
    'metricsgraphics',
    'peity',
    'history'

], function($, _, helpers, CountUp, c3, d3pie) {
    var reportsPage = {};

    reportsPage.init = function() {
        $(document).ready(function() {
            var testPage = $('#page-content').find('.reportsOverview');
            if (testPage.length < 1) return;

            helpers.resizeAll();

            var parms = {
                full_width: true,
                height: 250,
                target: '#test',
                x_accessor: 'date',
                y_accessor: 'value',
                y_extended_ticks: true,
                show_tooltips: false,
                aggregate_rollover: true,
                transition_on_update: false,
                colors: ['#2196f3', 'red']
            };

            getData(30);

            $('#select_timespan').on('change', function() {
                var self = $(this);
                getData(self.val());
            });

            function getData(timespan) {
                $.ajax({
                        url: '/api/v1/tickets/stats/' + timespan,
                        method: 'GET',
                        success: function(_data) {
                            parms.data = MG.convert.date(_data.data, 'date');
                            MG.data_graphic(parms);

                            var tCount = _(_data.data).reduce(function(m, x) { return m + x.value; }, 0);
                            var ticketCount = $('#ticketCount');
                            var oldTicketCount = ticketCount.text() == '--' ? 0 : ticketCount.text();
                            var totalTicketText = 'Total Tickets (last ' + timespan + 'd)';
                            if (timespan == 0)
                                totalTicketText = 'Total Tickets (lifetime)';
                            ticketCount.parents('.tru-card-content').find('span.uk-text-small').text(totalTicketText);
                            var theAnimation = new CountUp('ticketCount', oldTicketCount, tCount, 0, 1.5);
                            theAnimation.start();

                            var closedCount = Number(_data.closedCount);
                            var closedPercent = Math.round((closedCount / tCount) * 100);

                            var textComplete = $('#text_complete');
                            var oldTextComplete = textComplete.text() == '--' ? 0 : textComplete.text();
                            var completeAnimation = new CountUp('text_complete', oldTextComplete, closedPercent, 0, 1.5);
                            completeAnimation.start();

                            var pieComplete = $('#pie_complete');
                            pieComplete.text(closedPercent + '/100');
                            pieComplete.peity("donut", {
                                height: 24,
                                width: 24,
                                fill: ["#29b955", "#ccc"]
                            });

                            var responseTime_text = $('#responseTime_text');
                            var responseTime_graph = $('#responseTime_graph');
                            var oldResponseTime = responseTime_text.text() == '--' ? 0 : responseTime_text.text();
                            var responseTime = _data.ticketAvg;
                            var responseTime_animation = new CountUp('responseTime_text', oldResponseTime, responseTime, 0, 1.5);
                            responseTime_animation.start();


                            var lastUpdated = $('#lastUpdated').find('span');
                            lastUpdated.text(_data.lastUpdated);

                            //QuickStats
                            var mostRequester = $('#mostRequester');
                            mostRequester.text(_data.mostRequester.name + ' (' + _data.mostRequester.value + ')');
                            var mostCommenter = $('#mostCommenter');
                            mostCommenter.text(_data.mostCommenter.name + ' (' + _data.mostCommenter.value + ')');
                            var mostAssignee = $('#mostAssignee');
                            mostAssignee.text(_data.mostAssignee.name + ' (' + _data.mostAssignee.value + ')');
                            var mostActiveTicket = $('#mostActiveTicket');
                            mostActiveTicket.attr('href', '/tickets/' + _data.mostActiveTicket.uid).text('T#' + _data.mostActiveTicket.uid);

                        }
                    })
                    .error(function(err) {
                        //console.log(err);
                        console.log('[trudesk:dashboard:getData] Error - ' + err.responseText);
                        helpers.UI.showSnackbar(err.responseText, true);
                    });


                $.ajax({
                    url: '/api/v1/tickets/count/tags',
                    method: 'GET',
                    success: function(data) {
                        var arr = _.map(data.tags, function(v, key) {
                            return [key, v];
                        });

                        arr = _.first(arr, 10);

                        var colors = [
                            '#e53935',
                            '#d81b60',
                            '#8e24aa',
                            '#1e88e5',
                            '#00897b',
                            '#43a047',
                            '#00acc1',
                            '#e65100',
                            '#6d4c41',
                            '#455a64'
                        ];

                        var c = _.object(_.map(arr, function(v,i) {
                            return v[0];
                        }), colors);

                        c3.generate({
                            bindto: d3.select('#topTenTags'),
                            size: {
                                height: 200
                            },
                            data: {
                                columns: arr,
                                type: 'donut',
                                colors: c
                            },
                            donut: {
                                label: {
                                    format: function (value, ratio, id) {
                                        return '';
                                    }
                                }
                            }
                        });
                    }
                });



                $.ajax({
                    url: '/api/v1/tickets/count/topgroups/5',
                    method: 'GET',
                    success: function(data) {

                        var d = {
                            content: []
                        };

                        var colors = [
                            '#e53935',
                            '#d81b60',
                            '#8e24aa',
                            '#1e88e5',
                            '#00897b',
                            '#43a047'
                        ];

                        _.each(data.items, function(item) {
                            var obj = {};
                            obj.label = item.name;
                            obj.value = item.count;
                            var color = _.sample(colors);
                            colors = _.without(colors, color);

                            obj.color = color;

                            d.content.push(obj);
                        });

                        $('#pieChart').find('svg').remove();
                        
                        new d3pie("pieChart", {
                            "size": {
                                "canvasHeight": 215,
                                "canvasWidth": 450,
                                "pieInnerRadius": "60%",
                                "pieOuterRadius": "68%"
                            },
                            "data": d,
                            "labels": {
                                "outer": {
                                    "pieDistance": 15
                                },
                                "inner": {
                                    "format": "value"
                                },
                                "mainLabel": {
                                    "font": "roboto"
                                },
                                "percentage": {
                                    "color": "#ffffff",
                                    "font": "roboto",
                                    "decimalPlaces": 0
                                },
                                "value": {
                                    "color": "#ffffff",
                                    "font": "roboto"
                                },
                                "lines": {
                                    "enabled": true,
                                    "color": "#78909c"
                                },
                                "truncation": {
                                    "enabled": true
                                }
                            },
                            "effects": {
                                "pullOutSegmentOnClick": {
                                    "effect": "linear",
                                    "speed": 400,
                                    "size": 3
                                }
                            }
                        });
                    }
                });
            }
        });
    };

    return reportsPage;
});