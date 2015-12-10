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

"use strict";

define(['jquery', 'underscore', 'moment', 'foundation', 'nicescroll', 'easypiechart', 'chosen'], function($, _, moment) {
    var helpers = {};

    helpers.init = function() {
        var self = this;

        self.resizeFullHeight();
        self.removeAllScrollers();
        self.setupScrollers();
        self.setupScrollers('.scrollable-dark');
        self.setupScrollers('.wrapper');
        self.pToolTip();
        self.setupDonutchart();
        self.setupBarChart();
        self.actionButtons();
        self.bindKeys();
        self.ajaxFormSubmit();
        self.setupChosen();
        self.bindNewMessageSubmit();

        var layout = self.onWindowResize();
        $(window).resize(layout);
    };

    helpers.showFlash = function(message, error, sticky) {
        var self = this;
        var flash = $('.flash-message');
        if (flash.length < 1) return true;

        var e = error ? true : false;
        var s = sticky ? true : false;

        var flashTO;
        var flashText = flash.find('.flash-text');
        flashText.html(message);

        if (e) {
            flashText.css('background', '#de4d4d');
        } else {
            flashText.css('background', '#29b955');
        }

        if (s) {
            flash.off('mouseout');
            flash.off('mouseover');
        }

        if (!s) {
            flash.mouseout(function() {
                flashTO = setTimeout(flashTimeout, 2000);
            });

            flash.mouseover(function() {
                clearTimeout(flashTO);
            });
        }

        var isShown = flashText.is(':visible');
        if (isShown) return true;

        flashText.css('top', '-50px');
        flash.show();
        if (flashTO) clearTimeout(flashTO);
        flashText.stop().animate({top: '0'}, 500, function() {
            if (!s) {
                flashTO = setTimeout(flashTimeout, 2000);
            }
        });
    };

    helpers.clearFlash = function() {
        flashTimeout();
    };

    function flashTimeout() {
        var flashText = $('.flash-message').find('.flash-text');
        if (flashText.length < 1) return;
        flashText.stop().animate({top: '-50px'}, 500, function() {
            $('.flash-message').hide();
        });
    }

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

        var ticketIssue = $('#createTicketForm').find('textarea#issue');
        if (ticketIssue.length > 0) {
            ticketIssue.off('keydown');
            ticketIssue.on('keydown', function(e) {
                var keyCode = (e.which ? e.which : e.keyCode);
                if (keyCode === 10 || keyCode === 13 && e.ctrlKey) {
                    $('#saveTicketBtn').trigger('click');
                }
            });
        }

        var keyBindEnter = $('*[data-keyBindSubmit]');
        if (keyBindEnter.length > 0) {
            $.each(keyBindEnter, function(k, val) {
                var item = $(val);
                if (item.length < 1) return;
                item.off('keydown');
                var actionItem = item.attr('data-keyBindSubmit');
                if (actionItem.length > 0) {
                    var itemObj = $(actionItem);
                    if (itemObj.length > 0) {
                        item.on('keydown', function(e) {
                            var keyCode = (e.which ? e.which : e.keyCode);
                            if (keyCode === 10 || keyCode === 13 && e.ctrlKey) {
                                itemObj.trigger('click');
                            }
                        });
                    }
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
            self.resizeDataTables('.groupsList');
            self.resizeDataTables('.accountList');

            self.resizeScroller();
        }, 100);
    };

    helpers.setupScrollers = function(selector) {
        if (_.isUndefined(selector)) {
            selector = '.scrollable';
        }

        var color = "#a9b1bf";
        var colorBrd = "1px solid #fff";
        if (selector == '.scrollable-dark') {
            color = '#353e47';
            colorBrd = "1px solid #000";
        }

        var size = 7;
        var opacityMax = 1;
        if (selector == '.wrapper') {
            size = 1;
            opacityMax = 0;
        }

        $(document).ready(function() {
            $(selector).each(function() {
                var ns = $(this).getNiceScroll(0);
                if (ns !== false) return true;
                $(this).niceScroll({
                    cursorcolor: color,
                    cursorwidth: size,
                    cursorborder: colorBrd,
                    cursoropacitymax: opacityMax,
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

    helpers.resizeAll = function() {
        var self = this;
        var l = _.debounce(function() {
            self.resizeFullHeight();
            self.hideAllpDropDowns();
            self.hideDropDownScrolls();

            self.resizeDataTables('.ticketList');
            self.resizeDataTables('.groupsList');
            self.resizeDataTables('.accountList');

            self.resizeScroller();
        }, 100);

        l();
    };

    helpers.resizeScroller = function(scrollerObject) {
        if (_.isUndefined(scrollerObject)) {
            $('.scrollable').each(function() {
                var self = $(this);
                var ns = self.getNiceScroll(0);
                if (!ns) return true;

                ns.resize();
            });

            $('.scrollable-dark').each(function() {
                var self = $(this);
                var ns = self.getNiceScroll(0);
                if (!ns) return true;

                ns.resize();
            });
        } else {
            var niceScroll = $(scrollerObject).getNiceScroll(0);
            if (!niceScroll) return true;

            niceScroll.resize();
        }
    };

    helpers.removeAllScrollers = function() {
        $('.nicescroll-rails').each(function() {
            var self = $(this);
            self.remove();
        });
    };

    helpers.resizeFullHeight = function() {
        var ele = $('.full-height');
        $.each(ele, function() {
            var self = $(this);
            ele.ready(function() {
                var h = $(window).height();
                if (self.css('borderTopStyle') === "solid")
                    h = h - 1;

                //self.css('overflow', 'hidden');
                self.height(h - (self.offset().top));
            });

        });
    };
    
    helpers.resizeDataTables = function(selector, hasFooter) {
        if (_.isUndefined(selector)) {
            return true;
        }

        if (_.isUndefined(hasFooter)) {
            hasFooter = false;
        }

        var self = this;

        $(document).ready(function() {
            var $selector = $(selector);
            var scroller = $selector.find('.dataTables_scrollBody');
            if (scroller.length !== 0) {
                var tableHead = $selector.find('.dataTables_scrollHead');
                var optionsHead = $selector.find('.table-options');
                var hasFilter = $selector.find('.dataTables_filter');
                var headHeight = 0;
                if (optionsHead.length !== 0)
                    headHeight = optionsHead.height();
                else if (hasFilter.length !== 0)
                    headHeight = hasFilter.height();
                var footerHeight = 0;
                if (hasFooter)
                    footerHeight = tableHead.height();
                scroller.css({'height': ($selector.height() - tableHead.height() - headHeight - footerHeight) + 'px'});
                self.setupScrollers(selector + ' .dataTables_scrollBody');
                self.resizeScroller(selector + ' .dataTables_scrollBody');
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

                    html += "<span><span style='color: #e74c3c'>" + n + "</span> New / <span style='color: #2fb150'>" + c + "</span> Closed</span>";
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
                var numCount = $(this).attr('data-numcount');
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
                        $(this.el).find('.chart-value').text(value);
                    },
                    onStop: function(value, to) {
                        if (numCount) {
                            var totalNum = parseInt($(this.el).attr('data-totalNumCount'));
                            if (totalNum <= 0) return;
                            $(this.el).find('.chart-value').text(totalNum);
                            return true;
                        }

                        if (to == Infinity) to = 0;
                        $(this.el).find('.chart-value').text(Math.round(to));
                    },
                    onStep: function(from, to, percent) {
                        if (numCount) {
                            var countVal = parseInt($(this.el).attr('data-totalNumCount'));
                            if (countVal <= 0) return;
                            var current = parseInt($(this.el).find('.chart-value').text());
                            if (countVal != null && countVal > 0 && current != null) {
                                var totalCount = Math.round(countVal*(100/Math.round(to)));
                                var val = totalCount*(0.01*Math.round(percent));
                                var final = Math.round(val);
                                if (isNaN(final)) return true;
                                $(this.el).find('.chart-value').text(final);
                                return true;
                            }
                        }

                        if (percent == Infinity) percent = 0;
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
                $this.find('span.bar-track').height(0)
                    .animate({
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

    helpers.setupChosen = function() {
        $('.chosen-select').each(function() {
            var self = $(this);
            var nosearch = $(this).attr('data-nosearch');
            var placeholder = '';
            var elePlaceHolder = $(this).attr('data-placeholder');
            var searchNum = 10;
            if (nosearch) searchNum = 90000;
            if (!_.isUndefined(elePlaceHolder) && elePlaceHolder.length > 0) {
                placeholder = elePlaceHolder;
            }

            self.chosen({
                disable_search_threshold: searchNum,
                placeholder_text_single: placeholder,
                placeholder_text_multiple: placeholder
            });
        });
    };

    helpers.clearMessageContent = function() {
        var contentDiv = $('#message-content');
        if (contentDiv.length > 0)
            contentDiv.html('');
    };

    helpers.closeMessageWindow = function() {
        //Close reveal and refresh page.
        $('#newMessageModal').foundation('reveal', 'close');
        //Clear Fields
        var $newMessageTo = $("#newMessageTo");
        $newMessageTo.find("option").prop('selected', false);
        $newMessageTo.trigger('chosen:updated');
        $('#newMessageSubject').val('');
        $('#newMessageText').val('');
    };

    helpers.bindNewMessageSubmit = function() {
        var messageForm = $('#newMessageForm');
        if (messageForm.length < 1) return;

        messageForm.unbind('submit', newMessageSubmit);
        messageForm.bind('submit', newMessageSubmit);
    };

    function newMessageSubmit(e) {
        e.preventDefault();
        var formData = $('#newMessageForm').serializeObject();

        var data = {
            to: formData.newMessageTo,
            from: formData.from,
            subject: formData.newMessageSubject,
            message: formData.newMessageText
        };

        $.ajax({
            method: 'POST',
            url: '/api/v1/messages/send',
            data: JSON.stringify(data),
            processData: false,
            //headers: { 'Content-Type': 'application/json'}
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        })
            .success(function() {
                helpers.showFlash('Message Sent');

                helpers.closeMessageWindow();
            })
            .error(function(err) {
                helpers.closeMessageWindow();
                helpers.showFlash(err.error, true);
                console.log('[trudesk:helpers:newMessageSubmit] Error - ' + err);
            });
    }
    
    return helpers;
});
