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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/socket', 'history', 'datepicker'], function(angular, _, $, helpers, socket) {
    return angular.module('trudesk.controllers.tickets', [])
        .controller('ticketsCtrl', ['openFilterTicketWindow', '$scope', '$http', '$window', function(openFilterTicketWindow, $scope, $http, $window) {

            $scope.openFilterTicketWindow = function() {
                openFilterTicketWindow.openWindow();
            };

            $scope.submitTicketForm = function() {
                var socketId = socket.ui.socket.io.engine.id;
                var data = {};
                var form = $('#createTicketForm');
                form.serializeArray().map(function(x){data[x.name] = x.value;});
                data.tags = form.find('#tags').val();
                data.socketId = socketId;
                $http({
                    method: 'POST',
                    url: '/api/v1/tickets/create',
                    data: data,
                    headers: { 'Content-Type': 'application/json'}
                })
                    .success(function(data) {
                        if (!data.success) {
                            if (data.error) {
                                helpers.showFlash('Error: ' + data.error, true);
                                return;
                            }

                            helpers.showFlash('Error Submitting Ticket', true);
                        }

                        helpers.showFlash('Ticket Created Successfully.');

                        History.pushState(null, null, '/tickets/');

                    }).error(function(err) {
                        console.log('[trudesk:tickets:submitTicketForm] - ' + err.error);
                        helpers.showFlash('Error: ' + err.error.message, true);
                    });
            };

            $scope.showTags = function(event) {
                event.preventDefault();
                var tagModal = $('#addTagModal');
                if (tagModal.length > 0) {
                    tagModal.find('#tags').trigger('chosen:updated');
                    tagModal.foundation('reveal', 'open');
                }
            };

            $scope.submitAddTag = function(event) {
                event.preventDefault();
                var form = $('form#addTagForm');
                if (form.length > 0) {
                    var tag = form.find('#tag').val();
                    var data = {
                        tag: tag
                    };

                    $http({
                        method: "POST",
                        url: '/api/v1/tickets/addtag',
                        data: data,
                        headers: { 'Content-Type': 'application/json'}
                    })
                        .success(function(data) {
                            var tagModal = $('#addTagModal');
                            var tagFormField = $('#tags');
                            tagFormField.append('<option id="TAG__"' + data.tag._id + '" value="' + data.tag._id + '" selected>' + data.tag.name + '</option>');
                            tagFormField.trigger('chosen:updated');
                            if (tagModal.length > 0) tagModal.foundation('reveal', 'close');

                        })
                        .error(function(err) {
                            console.log('[trudesk:tickets:addTag} - Error: ' + err.error);
                            helpers.showFlash('Error: ' + err.error, true);
                        });
                }
            };

            $scope.deleteTickets = function() {
                var $ids = getChecked();
                _.each($ids, function(id) {
                    $http.delete(
                        '/api/v1/tickets/' + id
                    ).success(function() {
                            clearChecked();
                            removeCheckedFromGrid();
                            helpers.showFlash('Ticket Deleted Successfully.')
                        }).error(function(e) {
                            console.log('[trudesk:tickets:deleteTickets] - ' + e);
                            helpers.showFlash('Error: ' + e, true);
                        });
                });

                //hide Dropdown
                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
            };

            $scope.closeTickets = function() {
                var $ids = getChecked();

                _.each($ids, function(id) {
                    $http.put(
                        '/api/v1/tickets/' + id,
                        {
                            "status": 3
                        }
                    ).success(function() {

                        }).error(function(e) {
                            console.log('[trudesk:tickets:closeTickets] - ' + e);
                            helpers.showFlash('Error: ' + e, true);
                        });
                });

                //hide Dropdown
                clearChecked();
                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
            };

            $scope.GridRefreshChanged = function() {
                $http.put(
                    '/api/v1/users/' + $scope.username + '/updatepreferences',
                    {
                        "preference": 'autoRefreshTicketGrid',
                        "value": $scope.preferences_autoRefreshTicketGrid
                    }
                ).success(function() {

                    }).error(function(e) {
                        console.log('[trudesk:tickets:GridRefreshChanged] - ' + e);
                        helpers.showFlash('Error: ' + e.message, true);
                    });
            };

            $scope.RefreshTicketGrid = function(event) {
                var path = $window.location.pathname;
                History.pushState(null, null, path + '?r=' + Math.random());
                event.preventDefault();
            };

            $scope.submitFilter = function() {
                var data = {};
                $('#ticketFilterForm').serializeArray().map(function(x){data[x.name] = x.value;});
                var querystring = '?f=1';
                if (!_.isEmpty(data.filterSubject))
                    querystring += '&fs=' + data.filterSubject;
                if (!_.isEmpty(data.filterDate_Start))
                    querystring += '&ds=' + data.filterDate_Start;
                if (!_.isEmpty(data.filterDate_End))
                    querystring += '&de=' + data.filterDate_End;

                var filterStatus = $('#ticketFilterForm select#filterStatus').val();
                _.each(filterStatus, function(item) {
                    querystring += '&st=' + item;
                });

                var filterGroup = $('#ticketFilterForm select#filterGroup').val();
                _.each(filterGroup, function(item) {
                    querystring += '&gp=' + item;
                });

                var filterType = $('#ticketFilterForm select#filterType').val();
                _.each(filterType, function(item) {
                    querystring += '&tt=' + item;
                });

                var filterTags = $('#ticketFilterForm select#filterTags').val();
                _.each(filterTags, function(item) {
                    querystring += '&tag=' + item;
                });

                var filterAssignee = $('#ticketFilterForm select#filterAssignee').val();
                _.each(filterAssignee, function(item) {
                    querystring += '&au=' + item;
                });

                openFilterTicketWindow.closeWindow();
                History.pushState(null, null, '/tickets/filter/' + querystring + '&r=' + Math.floor(Math.random() * (99999 - 1 + 1)) + 1);
            };

            $scope.clearFilterForm = function(e) {
                $(':input', '#ticketFilterForm').not(':button, :submit, :reset, :hidden').val('');
                $('#ticketFilterForm option:selected').removeAttr('selected').trigger('chosen:updated');
                e.preventDefault();
            };

            function clearChecked() {
                $('#ticketTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    self.prop('checked', false);
                });
            }

            function getChecked() {
                var checkedIds = [];
                $('#ticketTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $ticketTR = self.parents('tr');
                    if (!_.isUndefined($ticketTR)) {
                        var ticketOid = $ticketTR.attr('data-ticketOid');

                        if (!_.isUndefined(ticketOid) && ticketOid.length > 0) {
                            checkedIds.push(ticketOid);
                        }
                    }
                });

                return checkedIds;
            }

            function removeCheckedFromGrid() {
                $('#ticketTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $ticketTR = self.parents('tr');
                    if (!_.isUndefined($ticketTR)) {
                        $ticketTR.remove();
                    }
                });
            }

        }])
        .factory('openFilterTicketWindow', function() {
            return {
                openWindow: function openWindow() {
                    $('.pDatePicker').fdatepicker({

                    });

                    //$('#filterTags').find('option').remove().end();
                    //$('#filterTags').trigger("chosen:updated");
                    ////Chosen Tag Filters
                    //var dropDown = $('#filterTags_chosen').find('.chosen-drop');
                    //// Make the chosen drop-down dynamic. If a given option is not in the list, the user can still add it
                    //dropDown.parent().find('.search-field input[type=text]').keydown(
                    //    function (evt) {
                    //        var stroke, _ref, target, list;
                    //        // get keycode
                    //        stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
                    //        // If enter or tab key
                    //        var chosenList;
                    //        var matchList;
                    //        var highlightedList;
                    //        if (stroke === 13) {
                    //            evt.preventDefault();
                    //            target = $(evt.target);
                    //            // get the list of current options
                    //            chosenList = target.parents('.chosen-container').find('.chosen-choices li.search-choice > span').map(function () {
                    //                return $(this).text();
                    //            }).get();
                    //            // get the list of matches from the existing drop-down
                    //            matchList = target.parents('.chosen-container').find('.chosen-results li').map(function () {
                    //                return $(this).text();
                    //            }).get();
                    //            // highlighted option
                    //            highlightedList = target.parents('.chosen-container').find('.chosen-results li.highlighted').map(function () {
                    //                return $(this).text();
                    //            }).get();
                    //            // Get the value which the user has typed in
                    //            var newString = $.trim(target.val());
                    //            // if the option does not exists, and the text doesn't exactly match an existing option, and there is not an option highlighted in the list
                    //            if ($.inArray(newString, matchList) < 0 && $.inArray(newString, chosenList) < 0 && highlightedList.length == 0) {
                    //                // Create a new option and add it to the list (but don't make it selected)
                    //                var newOption = '<option value="' + newString + '">' + newString + '</option>';
                    //                $("#filterTags").prepend(newOption);
                    //                // trigger the update event
                    //                $("#filterTags").trigger("chosen:updated");
                    //                // tell chosen to close the list box
                    //                $("#filterTags").trigger("chosen:close");
                    //                return true;
                    //            }
                    //            // otherwise, just let the event bubble up
                    //            return true;
                    //        }
                    //    }
                    //);

                    $('#ticketFilterModal').foundation('reveal', 'open');
                },
                openWindowWithOptions: function openWindowWithOptions(to, subject, text) {
                    var $newMessageTo = $('#newMessageTo');
                    $newMessageTo.find("option").prop('selected', false);
                    $newMessageTo.find("option[value='" + to + "']").prop('selected', true);
                    $newMessageTo.trigger('chosen:updated');
                    $('#newMessageSubject').val(subject);
                    var $mText = md(text);
                    $mText = $mText.trim();
                    $('#newMessageText').val($mText);

                    $('#ticketFilterModal').foundation('reveal', 'open');
                },
                closeWindow: function closeWindow() {
                    //Close reveal and refresh page.
                    $('#ticketFilterModal').foundation('reveal', 'close');

                }
            }
        });
});