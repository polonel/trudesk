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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/socket', 'uikit', 'history', 'formvalidator'], function(angular, _, $, helpers, socket, UIkit) {
    return angular.module('trudesk.controllers.tickets', [])
        .controller('ticketsCtrl', function($scope, $http, $window, $log, openFilterTicketWindow) {

            $scope.openFilterTicketWindow = function() {
                openFilterTicketWindow.openWindow();
            };

            $scope.submitTicketForm = function(event) {
                event.preventDefault();
                var socketId = socket.ui.socket.io.engine.id;
                var data = {};
                var form = $('#createTicketForm');
                if (!form.isValid(null, null, false)) {
                    return true;
                } else {
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
                                    helpers.UI.showSnackbar({text: 'Error: ' + data.error, actionTextColor: '#B92929'});
                                    return;
                                }

                                helpers.UI.showSnackbar({text: 'Error submitting ticket.', actionTextColor: '#B92929'});
                            }

                            helpers.UI.showSnackbar({text:   'Ticket Created Successfully'});

                            UIkit.modal("#ticketCreateModal").hide();

                            //History.pushState(null, null, '/tickets/');

                        }).error(function(err) {
                        $log.error('[trudesk:tickets:submitTicketForm] - ' + err.error.message);
                        helpers.UI.showSnackbar({text: 'Error: ' + err.error.message, actionTextColor: '#B92929'});
                    });
                }
            };

            $scope.showTags = function(event) {
                event.preventDefault();
                var tagModal = $('#addTagModal');
                if (tagModal.length > 0) {
                    tagModal.find('#tags').trigger('chosen:updated');
                    UIkit.modal(tagModal).show();
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
                            if (tagModal.length > 0) UIkit.modal(tagModal).hide();

                        })
                        .error(function(err) {
                            $log.error('[trudesk:tickets:addTag} - Error: ' + err.error);
                            helpers.UI.showSnackbar({text: 'Error: ' + err.error, actionTextColor: '#B92929'});
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
                            helpers.UI.showSnackbar({text: 'Ticket Deleted Successfully'});
                        }).error(function(e) {
                        $log.error('[trudesk:tickets:deleteTickets] - ' + e);
                            helpers.UI.showSnackbar({text: 'Error: ' + e.error.message, actionTextColor: '#B92929'});
                    });
                });

                //hide Dropdown
                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
            };

            $scope.openTickets = function() {
                var $ids = getChecked();

                _.each($ids, function(id) {
                    $http.put(
                        '/api/v1/tickets/' + id,
                        {
                            "status": 1
                        }
                    ).success(function() {
                        helpers.UI.showSnackbar({text: 'Ticket status set to open'});
                    }).error(function(e) {
                        $log.error('[trudesk:tickets:openTickets] - Error: ' + e);
                        helpers.UI.showSnackbar({text: 'Error: ' + e, actionTextColor: '#B92929'});
                    });
                });
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
                        $log.error('[trudesk:tickets:closeTickets] - ' + e);
                        helpers.UI.showSnackbar({text: 'Error: ' + e, actionTextColor: '#B92929'});
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
                        $log.error('[trudesk:tickets:GridRefreshChanged] - ' + e);
                        helpers.UI.showSnackbar({text: 'Error: ' + e.message, actionTextColor: '#B92929'});
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

                var filterPriority = $('#ticketFilterForm select#filterPriority').val();
                _.each(filterPriority, function(item) {
                    querystring += '&pr=' + item;
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
                    var vm = this;
                    var self = $(vm);
                    self.prop('checked', false);
                });
            }

            function getChecked() {
                var checkedIds = [];
                $('#ticketTable input[type="checkbox"]:checked').each(function() {
                    var vm = this;
                    var self = $(vm);
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
                    var vm = this;
                    var self = $(vm);
                    var $ticketTR = self.parents('tr');
                    if (!_.isUndefined($ticketTR)) {
                        $ticketTR.remove();
                    }
                });
            }

        })
        .factory('openFilterTicketWindow', function() {
            return {
                openWindow: function openWindow() {
                    UIkit.modal('#ticketFilterModal').show();
                },
                closeWindow: function closeWindow() {
                    UIkit.modal('#ticketFilterModal').hide();
                }
            }
        });
});