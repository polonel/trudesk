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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/socket', 'uikit', 'history', 'formvalidator', 'angularjs/services'], function(angular, _, $, helpers, socket, UIkit) {
    return angular.module('trudesk.controllers.tickets', ['trudesk.services.settings'])
        .controller('ticketsCtrl', function(SettingsService, $scope, $http, $window, $log, $document, openFilterTicketWindow) {

            $scope.openFilterTicketWindow = function() {
                openFilterTicketWindow.openWindow();
            };

            $scope.init = function() {
                var settings = SettingsService.getSettings();
                if (!settings.elasticSearchConfigured.value) {
                    $('input.non-es-search').removeClass('hide').show();
                    $('input#es-ticket-search').addClass('hide').hide();
                } else {
                    var mEvent = function(event) {
                        var $target = $(event.target);

                        var inContainer = $target.parents('.search-results-container').length > 0;
                        if (inContainer)
                            return false;

                        toggleAnimation(true, false);
                    };

                    $document.on('mousedown', mEvent);
                    $scope.$on('$destory', function() {
                        $document.off('mousedown', mEvent);
                    });

                    var $esInput = $('input#es-ticket-search');
                    $esInput.on('keydown', function(e) {
                        //Esc
                        if (e.keyCode === 27)
                            toggleAnimation(true, false);
                    });

                    if ($esInput.length > 0) {
                        $esInput.on('focus', function() {
                            var val = $esInput.val();
                            if (val.length > 2)
                                toggleAnimation(true, true);
                            else
                                toggleAnimation(true, false);
                        });
                    }
                }
            };

            function toggleAnimation(forceState, state) {
                var animateItems = $('.search-results-container');
                var docElemStyle = $document[0].documentElement.style;
                var transitionProp = angular.isString(docElemStyle.transition) ? 'transition' : 'WebkitTransition';

                for (var i = 0; i < animateItems.length; i++) {
                    var item = animateItems[i];
                    item.style[ transitionProp + 'Delay' ] = ( i * 50 ) + 'ms';

                    if (forceState) {
                        if (state) {
                            item.classList.remove('hide');
                            item.classList.add('is-in');
                        } else {
                            item.classList.add('hide');
                            item.classList.remove('is-in');
                        }
                    } else {
                        item.classList.toggle('hide');
                        item.classList.toggle('is-in');
                    }
                }
            }

            function searchES(term) {
                if (_.isEmpty(term))
                    return;

                $http.get('/api/v1/es/search?limit=20&q=' + term)
                    .then(function success(res) {
                        $scope.searchResults = res.data.hits.hits;
                        $scope.hideNoResults = $scope.searchResults.length > 0;
                        toggleAnimation(true, true);
                    }, function errorCallback(err) {
                        console.error(err);
                    });
            }

            $scope.searchResultClicked = function(e) {
                e.preventDefault();
                History.pushState(null, null, e.currentTarget.getAttribute('href'));
            };

            $scope.searchTerm = '';
            $scope.searchResults = [];
            $scope.hideNoResults = false;
            $scope.$watch('searchTerm', _.debounce(function() {
                $scope.$apply(function() {
                    if ($scope.searchTerm.trim().length === 0) {
                        $scope.searchResults = [];
                        toggleAnimation(true, false);
                        return true;
                    }

                    if ($scope.searchTerm.trim().length > 2)
                        searchES($scope.searchTerm.trim());
                });
            }, 250));

            $scope.submitTicketForm = function(event) {
                event.preventDefault();
                var socketId = socket.ui.socket.io.engine.id;
                var data = {};
                var form = $('#createTicketForm');
                if (!form.isValid(null, null, false))
                    return true;

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

                        UIkit.modal('#ticketCreateModal').hide();

                        //History.pushState(null, null, '/tickets/');

                    }).error(function(err) {
                        $log.error('[trudesk:tickets:submitTicketForm] - ' + err.error.message);
                        helpers.UI.showSnackbar({text: 'Error: ' + err.error.message, actionTextColor: '#B92929'});
                });
            };

            $scope.searchBarSubmit = function(event) {
                if (!_.isUndefined(event.keyCode) && event.keyCode === 13) {
                    var searchBoxText = $('#tickets_Search').val();
                    if (searchBoxText.length < 3) return true;

                    var queryString = '?uid={0}&fs={0}&it={0}'.formatUnicorn(searchBoxText);

                    History.pushState(null, null, '/tickets/filter/' + queryString + '&r=' + Math.floor(Math.random() * (99999 - 1 + 1)) + 1);
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
                        method: 'POST',
                        url: '/api/v1/tags/create',
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
            };

            $scope.setOpenTickets = function() {
                var $ids = getChecked();

                _.each($ids, function(id) {
                    $http.put(
                        '/api/v1/tickets/' + id,
                        {
                            'status': 1
                        }
                    ).success(function() {
                        helpers.UI.showSnackbar({text: 'Ticket status set to open'});
                    }).error(function(e) {
                        $log.error('[trudesk:tickets:openTickets] - Error: ', e);
                        helpers.UI.showSnackbar('An Error occurred. Please check console.', true);
                    });
                });
            };

            $scope.setPendingTickets = function() {
                var $ids = getChecked();

                _.each($ids, function(id) {
                    $http.put(
                        '/api/v1/tickets/' + id,
                        {
                            'status': 2
                        }
                    ).success(function() {
                        helpers.UI.showSnackbar('Ticket status set to pending', false);
                    }).error(function(e) {
                        $log.error('[trudes:tickets:setPendingTickets] - Error ', e);
                        helpers.UI.showSnackbar('An Error occurred. Please check console.', true);
                    });
                });
            };

            $scope.setClosedTickets = function() {
                var $ids = getChecked();

                _.each($ids, function(id) {
                    $http.put(
                        '/api/v1/tickets/' + id,
                        {
                            'status': 3
                        }
                    ).success(function() {
                        helpers.UI.showSnackbar('Ticket status set to closed', false);
                    }).error(function(e) {
                        $log.error('[trudesk:tickets:closeTickets] - Error', e);
                        helpers.UI.showSnackbar('An Error occurred. Please check console.', true);
                    });
                });
            };

            $scope.GridRefreshChanged = function() {
                $http.put(
                    '/api/v1/users/' + $scope.username + '/updatepreferences',
                    {
                        'preference': 'autoRefreshTicketGrid',
                        'value': $scope.preferences_autoRefreshTicketGrid
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
                var $ticketFilterForm = $('#ticketFilterForm');

                $ticketFilterForm.serializeArray().map(function(x){data[x.name] = x.value;});
                var querystring = '?f=1';
                if (!_.isEmpty(data.filterSubject))
                    querystring += '&fs=' + data.filterSubject;
                if (!_.isEmpty(data.filterDate_Start))
                    querystring += '&ds=' + data.filterDate_Start;
                if (!_.isEmpty(data.filterDate_End))
                    querystring += '&de=' + data.filterDate_End;

                var filterStatus = $ticketFilterForm.find('select#filterStatus').val();
                _.each(filterStatus, function(item) {
                    querystring += '&st=' + item;
                });

                var filterPriority = $ticketFilterForm.find('select#filterPriority').val();
                _.each(filterPriority, function(item) {
                    querystring += '&pr=' + item;
                });

                var filterGroup = $ticketFilterForm.find('select#filterGroup').val();
                _.each(filterGroup, function(item) {
                    querystring += '&gp=' + item;
                });

                var filterType = $ticketFilterForm.find('select#filterType').val();
                _.each(filterType, function(item) {
                    querystring += '&tt=' + item;
                });

                var filterTags = $ticketFilterForm.find('select#filterTags').val();
                _.each(filterTags, function(item) {
                    querystring += '&tag=' + item;
                });

                var filterAssignee = $ticketFilterForm.find('select#filterAssignee').val();
                _.each(filterAssignee, function(item) {
                    querystring += '&au=' + item;
                });

                openFilterTicketWindow.closeWindow();
                History.pushState(null, null, '/tickets/filter/' + querystring + '&r=' + Math.floor(Math.random() * (99999 - 1 + 1)) + 1);
            };

            $scope.clearFilterForm = function(e) {
                $(':input', '#ticketFilterForm').not(':button, :submit, :reset, :hidden').val('');
                $('#ticketFilterForm').find('option:selected').removeAttr('selected').trigger('chosen:updated');
                e.preventDefault();
            };

            function clearChecked() {
                $('#ticketTable').find('input[type="checkbox"]:checked').each(function() {
                    var vm = this;
                    var self = $(vm);
                    self.prop('checked', false);
                });
            }

            function getChecked() {
                var checkedIds = [];
                $('#ticketTable').find('input[type="checkbox"]:checked').each(function() {
                    var vm = this;
                    var self = $(vm);
                    var $ticketTR = self.parents('tr');
                    if (!_.isUndefined($ticketTR)) {
                        var ticketOid = $ticketTR.attr('data-ticketOid');

                        if (!_.isUndefined(ticketOid) && ticketOid.length > 0) 
                            checkedIds.push(ticketOid);
                        
                    }
                });

                return checkedIds;
            }

            function removeCheckedFromGrid() {
                $('#ticketTable').find('input[type="checkbox"]:checked').each(function() {
                    var vm = this;
                    var self = $(vm);
                    var $ticketTR = self.parents('tr');
                    if (!_.isUndefined($ticketTR)) 
                        $ticketTR.remove();
                    
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
            };
        });
});