"use strict";

define(['jquery', 'underscore', 'moment', 'foundation', 'nicescroll', 'easypiechart'], function($, _, moment) {
    var helpers = {};

    helpers.init = function() {
        var self = this;

        var layout = self.onWindowResize();
        $(window).resize(layout);

        self.resizeFullHeight();
        self.setupScrollers();
        self.pToolTip();
        self.setupDonutchart();
        self.setupBarChart();
        self.actionButtons();
        self.bindKeys();
        self.ajaxFormSubmit();
    };

    helpers.bindKeys = function() {
        var self = this;
        var commentReply = $('#commentReply');
        if (commentReply.length > 0) {
            commentReply.off('keydown');
            commentReply.on('keydown', function(e) {
                var keyCode = (e.which ? e.which : e.keyCode);
                if (keyCode === 10 || keyCode === 13 && e.ctrlKey) {
                    $('#comment-reply').find('button[type="submit"]').trigger('click');
                }
            });
        }
    };

    helpers.onWindowResize = function() {
        var self = this;
        return _.debounce(function() {
            self.resizeFullHeight();
            self.hideAllpDropDowns();
            self.hideDropDownScrolls();
            self.resizeDataTables('.ticketList');
        }, 200);
    };

    helpers.setupScrollers = function(selector) {
        if (_.isUndefined(selector)) {
            selector = '.scrollable';
        }

        $(document).ready(function() {
            $(selector).each(function() {
                var ns = $(this).getNiceScroll(0);
                if (ns !== false) return true;
                $(this).niceScroll({
                    cursorcolor: "#a9b1bf",
                    cursorwidth: 7,
                    cursorborder: "1px solid #fff",
                    horizrailenabled: false
                });
            });
        });
    };

    helpers.scrollToBottom = function(jqueryObject) {
        if (_.isUndefined(jqueryObject)) return true;

        var niceScroll = $(jqueryObject).getNiceScroll(0);
        if (!niceScroll) return true;

        niceScroll.resize();
        niceScroll.doScrollTop(99999999999*99999999999);
    };

    helpers.resizeScroller = function(scrollerObject) {
        if (_.isUndefined(scrollerObject)) return true;

        var niceScroll = $(scrollerObject).getNiceScroll(0);
        if (!niceScroll) return true;

        niceScroll.resize();
    };

    helpers.resizeFullHeight = function() {
        var ele = $('.full-height');
        $.each(ele, function() {
            var self = $(this);
            ele.ready(function() {
                var h = $(window).height();
                if (self.css('borderTopStyle') === "solid")
                    h = h - 1;

                self.css('overflow', 'hidden');
                self.height(h - (self.offset().top));
            });

        });
    };
    
    helpers.resizeDataTables = function(selector) {
        if (_.isUndefined(selector)) {
            return true;
        }

        var self = this;

        $(document).ready(function() {
            var ticketList = $(selector);
            var scroller = ticketList.find('.dataTables_scrollBody');
            if (scroller.length !== 0) {
                var tableHead = ticketList.find('.dataTables_scrollHead');
                scroller.css({'height': (ticketList.height() - tableHead.height()) + 'px'});
                self.setupScrollers(selector + ' .dataTables_scrollBody');
            }
        });
    };

    helpers.hideDropDownScrolls = function() {
        $('div[data-scroll]').each(function() {
            var scroll = $('#' + $(this).attr('data-scroll'));
            if ($(scroll).length !== 0)
                $(scroll).getNiceScroll().hide();
        });
    };

    helpers.hideAllpDropDowns = function() {
        $('a[data-notifications]').each(function() {
            var drop = $('#' + $(this).attr('data-notifications'));
            if (drop.hasClass('pDropOpen')) {
                drop.removeClass('pDropOpen');
                helpers.hideDropDownScrolls();
            }
        });
    };

    helpers.pToolTip = function() {
        $(document).ready(function() {
            var pToolTip = $('span[data-ptooltip]');
            pToolTip.each(function() {
                var title = $(this).attr('data-title');
                var type = $(this).attr('data-ptooltip-type');
                var html = "<div class='ptooltip-box-wrap' data-ptooltip-id='" + $(this).attr('id') + "'><div class='ptooltip-box'><span>" + title + "</span>";
                if (type.toLowerCase() === 'service') {
                    var status = $(this).attr('data-service-status');
                    var color = "#fff";
                    if (status.toLowerCase() === 'starting' || status.toLowerCase() === 'stopping')
                        color = "#e77c3c";
                    if (status.toLowerCase() === 'running')
                        color = '#29b955';
                    if (status.toLowerCase() === 'stopped')
                        color = '#e54242';

                    html += "<span>Status: <span style='color: " + color + ";'>" + status + "</span>";
                } else if (type.toLowerCase() === 'dailyticket') {
                    var n = $(this).attr('data-new-count');
                    var c = $(this).attr('data-closed-count');

                    html += "<span><span style='color: #e74c3c'>" + n + "</span> New / <span style='color: #3498db'>" + c + "</span> Closed</span>";
                }

                html += "</div></div>";
                var k = $('<div></div>').css({'position': 'relative'});
                k.append(html);

                $(this).append(k);
            });

            pToolTip.hover(function() {
                var id = $(this).attr('id');
                $('div.ptooltip-box-wrap[data-ptooltip-id="' + id + '"]').show();
            }, function() {
                var id = $(this).attr('id');
                $('div.ptooltip-box-wrap[data-ptooltip-id="' + id + '"]').hide();
            });
        });
    };

    helpers.setupDonutchart = function() {
        $(document).ready(function() {
            $('.donutchart').each(function() {
                var trackColor = $(this).attr('data-trackColor');
                if (trackColor == null || trackColor.length <= 0)
                    trackColor = '#e74c3c';
                var numCount = $(this).attr('data-numCount');
                if (numCount == null || numCount.length <= 0)
                    numCount = false;

                $(this).easyPieChart({
                    size: 150,
                    lineCap: 'round',
                    lineWidth: 8,
                    scaleColor: false,
                    barColor: trackColor,
                    trackColor: '#b5bbc9',
                    onStart: function(value, to) {
                        $(this.el).find('.chart-value').text('0');
                    },
                    onStop: function(value, to) {
                        if (numCount) {
                            var totalNum = parseInt($(this.el).attr('data-totalNumCount'));
                            $(this.el).find('.chart-value').text(totalNum);
                            return true;
                        }
                        $(this.el).find('.chart-value').text(Math.round(to));
                    },
                    onStep: function(from, to, percent) {
                        if (numCount) {
                            var countVal = parseInt($(this.el).attr('data-totalNumCount'));
                            var current = parseInt($(this.el).find('.chart-value').text());
                            if (countVal != null && countVal > 0 && current != null) {
                                var totalCount = Math.round(countVal*(100/Math.round(to)));
                                var val = totalCount*(0.01*Math.round(percent));
                                $(this.el).find('.chart-value').text(Math.round(val));
                                return true;
                            }
                        }

                        $(this.el).find('.chart-value').text(Math.round(percent));
                    }
                });
            }); 
        });
    };
    
    helpers.setupBarChart = function() {
        $(document).ready(function() {
            $('.bar-chart > .bar').each(function() {
                var $this = $(this);
                var val = $this.attr('data-percent');
                var i = 170*(0.01*val);
                $this.find('span.bar-track').height(0);
                $this.find('span.bar-track').animate({
                    'height': i
                }, 1000);
            }); 
        });
    };

    helpers.actionButtons = function() {
        $(document).ready(function() {
            $('*[data-action]').each(function() {
                var self = $(this);
                var action = self.attr('data-action');
                if (action.toLowerCase() === 'submit') {
                    var formId = self.attr('data-form');
                    if (!_.isUndefined(formId)) {
                        var form = $('#' + formId);
                        if (form.length !== 0) {
                            self.click(function(e) {
                                form.submit();

                                var preventDefault = self.attr('data-preventDefault');
                                if (_.isUndefined(preventDefault) || preventDefault.length < 1)
                                    e.preventDefault();

                                else if (preventDefault.toLowerCase() === 'true') {
                                    e.preventDefault();
                                }
                            });
                        }
                    }
                } else if (action.toLowerCase() === 'scrolltobottom') {
                    var targetScroll = self.attr('data-targetScroll');
                    if (!_.isUndefined(targetScroll)) {
                        var target = $(targetScroll);
                        if (target.length !== 0) {
                            self.click(function(e) {
                                var windowHeight = target.children('div:first').outerHeight();
                                target.getNiceScroll(0).doScrollTop(windowHeight+200, 1000);

                                var preventDefault = self.attr('data-preventDefault');
                                if (_.isUndefined(preventDefault) || preventDefault.length < 1) {
                                    e.preventDefault();
                                }
                                else if (preventDefault.toLowerCase() === 'true') {
                                    e.preventDefault();
                                }
                            });
                        }
                    }
                }
            });
        });
    };

    helpers.fadeOutLoader = function(time) {
        if (_.isUndefined(time))
            time = 100;

        $(document).ready(function() {
            $('#loader').fadeOut(time);
        });
    };

    helpers.ajaxFormSubmit = function() {
        // Bind to forms
        $('form.ajaxSubmit').each(function() {
            var self = $(this);
            self.submit(function(e) {
                $.ajax({
                    type: self.attr('method'),
                    url: self.attr('action'),
                    data: self.serialize(),
                    success: function(data) {
                        //send socket to add reply.
                        self.find('*[data-clearOnSubmit="true"]').each(function() {
                            $(this).val('');
                        });
                    }
                });

                e.preventDefault();
                return false;
            });
        });
    };

    helpers.formatDate = function(date, format) {
        return moment(date).format(format);
    };
    
    return helpers;
});
