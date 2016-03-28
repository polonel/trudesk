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

define(['jquery', 'underscore', 'moment', 'uikit', 'countup', 'waves', 'selectize','snackbar', 'async', 'nicescroll', 'easypiechart', 'chosen', 'velocity', 'formvalidator'],
function($, _, moment, UIkit, CountUp, Waves, Selectize, SnackBar) {

    var helpers = {};

    var easing_swiftOut = [ 0.4,0,0.2,1 ];

    helpers.init = function() {
        var self = this;

        self.resizeFullHeight();
        self.removeAllScrollers();
        self.setupScrollers();
        self.setupScrollers('.scrollable-dark');
        self.setupScrollers('.wrapper');
        self.formvalidator();
        self.pToolTip();
        self.setupDonutchart();
        self.setupBarChart();
        self.actionButtons();
        self.bindKeys();
        self.ajaxFormSubmit();
        self.setupChosen();
        self.bindNewMessageSubmit();

        self.UI.fabToolbar();
        self.UI.inputs();
        self.UI.cardOverlay();
        self.UI.setupPeity();
        self.UI.selectize();
        self.UI.waves();
        self.UI.matchHeight();

        var layout = self.onWindowResize();
        $(window).resize(layout);
    };

    helpers.countUpMe = function() {
        $('.countUpMe').each(function() {
            var self = this;
            var countTo = $(self).text();
            var theAnimation = new CountUp(self, 0, countTo, 0, 2);
            theAnimation.start();
        });
    };

    helpers.UI = {};

    helpers.UI.matchHeight = function() {
        var $d = $('div[data-match-height]');
        $d.each(function() {
            var self = $(this);
            var target = self.attr('data-match-height');

            var $target = $(target);
            var $t_h = $target.height();
            self.height($t_h);
        });
    };

    helpers.UI.showDisconnectedOverlay = function() {
        var $disconnected = $('.disconnected');

        if ($disconnected.css("display") === 'block')
            return true;

        $disconnected.velocity("fadeIn", {
            duration: 500,
            easing: easing_swiftOut,
            begin: function() {
                $disconnected.css({
                    'display': 'block',
                    'opacity': 0
                });
            }
        });
    };

    helpers.UI.hideDisconnectedOverlay = function() {
        var $disconnected = $('.disconnected');

        if ($disconnected.css('display') === 'none')
            return true;

        $disconnected.velocity("fadeOut", {
            duration: 500,
            easing: easing_swiftOut,
            complete: function() {
                $disconnected.css({
                    'display': 'none',
                    'opacity': 0
                });
            }
        });
    };

    helpers.UI.showSnackbar = function() {
        if (arguments.length == 2) {
            return(helpers.UI.showSnackbar__.apply(this, arguments));
        }  else {
            return(helpers.UI.showSnackbar_.apply(this, arguments));
        }
    };

    helpers.UI.showSnackbar_ = function(options) {
        SnackBar.show(options);
    };

    helpers.UI.showSnackbar__ = function(text, error) {
        if (_.isUndefined(error) || _.isNull(error))
            error = false;

        var actionText = '#4CAF50';
        if (error)
            actionText = '#FF4835';

        SnackBar.show({
            text: text,
            actionTextColor: actionText
        });
    };

    helpers.UI.closeSnackbar = function() {
        SnackBar.close();
    };

    helpers.UI.inputs = function(parent) {
        var $mdInput = (typeof parent === 'undefined') ? $('.md-input') : $(parent).find('.md-input');
        $mdInput.each(function() {
            if(!$(this).closest('.md-input-wrapper').length) {
                var $this = $(this);

                if( $this.prev('label').length ) {
                    $this.prev('label').andSelf().wrapAll('<div class="md-input-wrapper"/>');
                } else if($this.siblings('[data-uk-form-password]').length) {
                    $this.siblings('[data-uk-form-password]').andSelf().wrapAll('<div class="md-input-wrapper"/>');
                } else {
                    $this.wrap('<div class="md-input-wrapper"/>');
                }
                $this.closest('.md-input-wrapper').append('<span class="md-input-bar"/>');

                updateInput($this);
            }
            $('body')
                .on('focus', '.md-input', function() {
                    $(this).closest('.md-input-wrapper').addClass('md-input-focus')
                })
                .on('blur', '.md-input', function() {
                    $(this).closest('.md-input-wrapper').removeClass('md-input-focus');
                    if(!$(this).hasClass('label-fixed')) {
                        if($(this).val() != '') {
                            $(this).closest('.md-input-wrapper').addClass('md-input-filled')
                        } else {
                            $(this).closest('.md-input-wrapper').removeClass('md-input-filled')
                        }
                    }
                })
                .on('change', '.md-input', function() {
                    updateInput($(this));
                });
        });
    };

    function updateInput(object) {
        // clear wrapper classes
        object.closest('.uk-input-group').removeClass('uk-input-group-danger uk-input-group-success');
        object.closest('.md-input-wrapper').removeClass('md-input-wrapper-danger md-input-wrapper-success md-input-wrapper-disabled');

        if(object.hasClass('md-input-danger')) {
            if(object.closest('.uk-input-group').length) {
                object.closest('.uk-input-group').addClass('uk-input-group-danger')
            }
            object.closest('.md-input-wrapper').addClass('md-input-wrapper-danger')
        }
        if(object.hasClass('md-input-success')) {
            if(object.closest('.uk-input-group').length) {
                object.closest('.uk-input-group').addClass('uk-input-group-success')
            }
            object.closest('.md-input-wrapper').addClass('md-input-wrapper-success')
        }
        if(object.prop('disabled')) {
            object.closest('.md-input-wrapper').addClass('md-input-wrapper-disabled')
        }
        if(object.hasClass('label-fixed')) {
            object.closest('.md-input-wrapper').addClass('md-input-filled')
        }
        if(object.val() != '') {
            object.closest('.md-input-wrapper').addClass('md-input-filled')
        }
    }

    helpers.UI.fabToolbar = function() {
        var $fab_toolbar = $('.md-fab-toolbar');

        if($fab_toolbar) {
            $fab_toolbar
                .children('i')
                .on('click', function(e) {
                    e.preventDefault();

                    var toolbarItems = $fab_toolbar.children('.md-fab-toolbar-actions').children().length;

                    $fab_toolbar.addClass('md-fab-animated');

                    var FAB_padding = !$fab_toolbar.hasClass('md-fab-small') ? 16 : 24,
                        FAB_size = !$fab_toolbar.hasClass('md-fab-small') ? 64 : 44;

                    setTimeout(function() {
                        $fab_toolbar
                            .width((toolbarItems*FAB_size + FAB_padding))
                    },140);

                    setTimeout(function() {
                        $fab_toolbar.addClass('md-fab-active');
                    },420);

                });

            $(document).on('click scroll', function(e) {
                if( $fab_toolbar.hasClass('md-fab-active') ) {
                    if (!$(e.target).closest($fab_toolbar).length) {

                        $fab_toolbar
                            .css('width','')
                            .removeClass('md-fab-active');

                        setTimeout(function() {
                            $fab_toolbar.removeClass('md-fab-animated');
                        },140);

                    }
                }
            });
        }
    };

    helpers.UI.waves = function() {
        Waves.attach('.md-btn-wave,.md-fab-wave', ['waves-button']);
        Waves.attach('.md-btn-wave-light,.md-fab-wave-light', ['waves-button', 'waves-light']);
        Waves.attach('.wave-box', ['waves-float']);
        Waves.init({
            delay: 300
        });
    };

    helpers.UI.selectize = function(parent) {
        // selectize plugins
        if(typeof $.fn.selectize != 'undefined') {
            Selectize.define('dropdown_after', function (options) {
                this.positionDropdown = (function () {
                    var $control = this.$control,
                        position = $control.position(),
                        position_left = position.left,
                        position_top = position.top + $control.outerHeight(true) + 32;

                    this.$dropdown.css({
                        width: $control.outerWidth(),
                        top: position_top,
                        left: position_left
                    });
                });
            });
        }

        var $selectize = parent ? $(parent).find('select') : $("[data-md-selectize],.data-md-selectize");

        $selectize.each(function(){
            var $this = $(this);
            if(!$this.hasClass('selectized')) {
                var thisPosBottom = $this.attr('data-md-selectize-bottom');
                var closeOnSelect = $this.attr('data-md-selectize-closeOnSelect') !== 'undefined' ? $this.attr('data-md-selectize-closeOnSelect') : false;
                    $this
                    .after('<div class="selectize_fix"></div>')
                    .selectize({
                        plugins: [
                            'remove_button'
                        ],
                        hideSelected: true,
                        dropdownParent: 'body',
                        closeAfterSelect: closeOnSelect,
                        onDropdownOpen: function($dropdown) {
                            $dropdown
                                .hide()
                                .velocity('slideDown', {
                                    begin: function() {
                                        if (typeof thisPosBottom !== 'undefined') {
                                            $dropdown.css({'margin-top':'0'})
                                        }
                                    },
                                    duration: 200,
                                    easing: easing_swiftOut
                                })
                        },
                        onDropdownClose: function($dropdown) {
                            $dropdown
                                .show()
                                .velocity('slideUp', {
                                    complete: function() {
                                        if (typeof thisPosBottom !== 'undefined') {
                                            $dropdown.css({'margin-top': ''})
                                        }

                                        if (closeOnSelect)
                                            $($dropdown).prev().find('input').blur();
                                    },
                                    duration: 200,
                                    easing: easing_swiftOut
                                });
                        }
                    });
            }
        });

        // dropdowns
        var $selectize_inline = $("[data-md-selectize-inline]");

        $selectize_inline.each(function(){
            var $this = $(this);
            if(!$this.hasClass('selectized')) {
                var thisPosBottom = $this.attr('data-md-selectize-bottom');
                var closeOnSelect = $this.attr('data-md-selectize-closeOnSelect') !== 'undefined' ? $this.attr('data-md-selectize-closeOnSelect') : false;
                $this
                    .after('<div class="selectize_fix"></div>')
                    .closest('div').addClass('uk-position-relative')
                    .end()
                    .selectize({
                        plugins: [
                            'dropdown_after',
                            'remove_button'
                        ],
                        dropdownParent: $this.closest('div'),
                        hideSelected: true,
                        closeAfterSelect: closeOnSelect,
                        onDropdownOpen: function($dropdown) {
                            $dropdown
                                .hide()
                                .velocity('slideDown', {
                                    begin: function() {
                                        if (typeof thisPosBottom !== 'undefined') {
                                            $dropdown.css({'margin-top':'0'})
                                        }
                                    },
                                    duration: 200,
                                    easing: easing_swiftOut
                                });
                        },
                        onDropdownClose: function($dropdown) {
                            $dropdown
                                .show()
                                .velocity('slideUp', {
                                    complete: function() {
                                        if (typeof thisPosBottom !== 'undefined') {
                                            $dropdown.css({'margin-top': ''})
                                        }

                                        if (closeOnSelect)
                                            $($dropdown).prev().find('input').blur();
                                    },
                                    duration: 200,
                                    easing: easing_swiftOut
                                });
                        }
                    });
            }
        });
    };

    helpers.UI.cardShow = function() {
        $('.tru-card-intro').each(function() {
            var self = $(this);
            self.velocity({
                scale: 0.99999999,
                opacity: 1
            }, {
                duration: 400,
                easing: easing_swiftOut
            });
        });
    };

    helpers.UI.cardOverlay = function() {
        var $tru_card = $('.tru-card');

        // replace toggler icon (x) when overlay is active
        $tru_card.each(function() {
            var $this = $(this);
            if($this.hasClass('tru-card-overlay-active')) {
                $this.find('.tru-card-overlay-toggler').html('close');
            }
        });

        // toggle card overlay
        $tru_card.on('click','.tru-card-overlay-toggler', function(e) {
            e.preventDefault();
            if(!$(this).closest('.tru-card').hasClass('tru-card-overlay-active')) {
                $(this)
                    .html('close')
                    .closest('.tru-card').addClass('tru-card-overlay-active');

            } else {
                $(this)
                    .html('more_vert')
                    .closest('.tru-card').removeClass('tru-card-overlay-active');
            }
        })
    };

    helpers.UI.setupPeity = function() {
        $('.peity-bar').each(function() {
            $(this).peity("bar", {
                height: 28,
                width: 48,
                fill: ["#e74c3c"],
                padding: 0.2
            });
        });

        $(".peity-pie").each(function() {
            $(this).peity("donut", {
                height: 24,
                width: 24,
                fill: ["#29b955", "#ccc"]
            });
        });

        $(".peity-line").each(function() {
            $(this).peity("line", {
                height: 28,
                width: 64,
                fill: "#d1e4f6",
                stroke: "#0288d1"
            });
        });
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

    helpers.formvalidator = function() {
        $.validate({
            modules: 'html5',
            errorElementClass: 'uk-form-danger',
            errorMessageClass: 'uk-form-danger',
            ignore: ':hidden:not([class~=selectized]),:hidden > .selectized, .selectize-control .selectize-input input'
        });
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
            self.UI.matchHeight();
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

    helpers.hideAllUiKitDropdowns = function() {
        var dropdowns = $('.uk-dropdown');
        dropdowns.each(function() {
            var this_dropdown = $(this);
            this_dropdown.removeClass('uk-dropdown-shown');

            setTimeout(function() {
                this_dropdown.removeClass('uk-dropdown-active');
                this_dropdown.parents('*[data-uk-dropdown]').removeClass('uk-open').attr('aria-expanded', false);

            },280);
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
                var $size = $(this).attr('data-size');
                if ($size == null || $size.length <= 0)
                    $size = 150

                $(this).css({height: $size, width: $size});

                $(this).easyPieChart({
                    size: $size,
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

    helpers.hideLoader = function(time) {
        if (_.isUndefined(time) || _.isNull(time))
            time = 280;

        $(document).ready(function() {
            $('#loader-wrapper').fadeOut(time);
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
            var noResults = 'No Results Found For ';
            var eleNoResults = $(this).attr('data-noresults');
            var searchNum = 10;
            if (nosearch) searchNum = 90000;
            if (!_.isUndefined(elePlaceHolder) && elePlaceHolder.length > 0) {
                placeholder = elePlaceHolder;
            }
            if (!_.isUndefined(eleNoResults) && eleNoResults.length > 0) {
                noResults = eleNoResults;
            }

            self.chosen({
                disable_search_threshold: searchNum,
                placeholder_text_single: placeholder,
                placeholder_text_multiple: placeholder,
                no_results_text: noResults
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
        UIkit.modal('#newMessageModal').hide();
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
        var form = $('#newMessageForm');
        var formData = form.serializeObject();

        if (!form.isValid(null,null, false))
            return true;

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
                //helpers.showFlash('Message Sent');
                helpers.UI.showSnackbar({text: 'Message Sent'});

                helpers.closeMessageWindow();
            })
            .error(function(err) {
                helpers.closeMessageWindow();
                //helpers.showFlash(err.error, true);
                helpers.UI.showSnackbar({text: err.error, actionTextColor: '#B92929'});
                console.log('[trudesk:helpers:newMessageSubmit] Error - ' + err);
            });
    }

    helpers.canUser = function(a) {
        var role = $('div#__loggedInAccount_role').text();
        if (_.isUndefined(role)) return false;

        var rolePerm = _.find(roles, {'id': role});
        if (_.isUndefined(rolePerm)) return false;

        if (rolePerm.allowedAction === '*') return true;

        if (_.indexOf(rolePerm.allowedAction, '*') !== -1) return true;

        var actionType = a.split(':')[0];
        var action = a.split(':')[1];

        if (_.isUndefined(actionType) || _.isUndefined(action)) return false;

        var result = _.filter(rolePerm.allowedAction, function(value) {
            if (stringStartsWith(value, actionType + ':')) return value;
        });

        if (_.isUndefined(result) || _.size(result) < 1) return false;
        if (_.size(result) === 1) {
            if (result[0] === '*') return true;
        }

        var typePerm = result[0].split(':')[1].split(' ');
        typePerm = _.uniq(typePerm);

        if (_.indexOf(typePerm, '*') !== -1) return true;

        return _.indexOf(typePerm, action) !== -1;
    };

    helpers.canUserEditSelf = function(ownerId, perm) {
        var id = $('div#__loggedInAccount__id').text();

        if (helpers.canUser(perm + ':editSelf')) {
            return id.toString() == ownerId.toString();
        } else {
            return false;
        }
    };

    function stringStartsWith(string, prefix) {
        return string.slice(0, prefix.length) == prefix;
    }

    return helpers;
});
