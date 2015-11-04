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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/ui', 'history'], function(angular, _, $, helpers, ui) {
    return angular.module('trudesk.controllers.notices', [])
        .controller('noticesCtrl', function($scope, $http) {

            $scope.editNotice = function($event) {
                if (_.isNull($event.target) || _.isUndefined($event.target) ||
                    $event.target.tagName.toLowerCase() === 'label' ||
                    $event.target.tagName.toLowerCase() === 'input')
                    return true;

                //currentTarget = ng-click() bound to. "<tr>"
                var id = $event.currentTarget.dataset.noticeoid;
                if (!id) return true;

                History.pushState(null, null, '/notices/' + id);
            };

            $scope.submitCreateNoticeForm = function() {
                var formData = $('#createNoticeForm').serializeObject();
                var apiData = {
                    name: formData.nName,
                    message: formData.nMessage,
                    color: formData.nColor,
                    fontColor: formData.nFontColor,
                    alertWindow: (formData.nAlertWindow == 'on')
                };

                $http({
                    method: 'POST',
                    url: '/api/v1/notices/create',
                    data: apiData,
                    headers: { 'Content-Type': 'application/json'}
                })
                    .success(function() {
                        helpers.showFlash('Notice Created Successfully.');

                        History.pushState(null, null, '/notices/');
                    })
                    .error(function(err) {
                        console.log('[trudesk:notices:submitCreateNoticeForm] - ' + err);
                        helpers.showFlash(err, true);
                    });
            };

            $scope.submitEditNoticeForm = function() {
                var noticeId = $('#__noticeId').text();
                var formData = $('#editNoticeForm').serializeObject();
                var apiData = {
                    name: formData.nName,
                    message: formData.nMessage,
                    color: formData.nColor,
                    fontColor: formData.nFontColor,
                    alertWindow: (formData.nAlertWindow == 'on')
                };

                $http({
                    method: 'PUT',
                    url: '/api/v1/notices/' + noticeId,
                    data: apiData,
                    headers: { 'Content-Type': 'application/json' }
                })
                    .success(function() {
                        helpers.showFlash('Notice Saved Successfully.');

                        History.pushState(null, null, '/notices/');
                    })
                    .error(function(err) {
                        console.log('[trudesk:notices:submitEditNoticeForm] - ' + err);
                        helpers.showFlash(err, true);
                    });
            };

            $scope.activateNotice = function() {
                var id = getChecked();
                if (id.length < 0) return true;
                id = id[0];
                var $data = {active: true};

                $http.get('/api/v1/notices/clearactive')
                    .success(function() {
                        $http({
                            method: 'PUT',
                            url: '/api/v1/notices/' + id,
                            data: $data,
                            headers: {'Content-Type': 'application/json'}
                        })
                            .success(function() {
                                ui.setShowNotice(id);

                                helpers.showFlash('Notice has been activated');

                                clearChecked();
                                History.pushState(null, null, '/notices/');
                            })
                            .error(function(err) {
                                console.log('[trudesk:notices:activateNotice] - ' + err);
                                helpers.showFlash(err, true);
                            });
                    })
                    .error(function(err) {

                    });

                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
            };

            $scope.clearNotice = function() {
                $http.get('/api/v1/notices/clearactive')
                    .success(function() {
                        ui.setClearNotice();

                        helpers.showFlash('Notice has been deactivated');
                    })
                    .error(function(err) {
                        console.log('[trudesk:notices:clearNotice] - ' + err);
                        helpers.showFlash(err.message, true);
                    });

                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
            };

            $scope.deleteNotices = function() {
                var ids = getChecked();
                _.each(ids, function(id) {
                    $http.delete(
                        '/api/v1/notices/' + id
                    ).success(function(data) {
                            if (!data.success) {
                                helpers.showFlash(data.error, true);
                                return;
                            }

                            removeCheckedFromGrid(id);
                            helpers.resizeDataTables('.noticesList');
                            helpers.showFlash('Notice Successfully Deleted');
                        }).error(function(err) {
                            console.log('[trudesk:notices:deleteNotices] - ' + err);
                            helpers.showFlash(err, true);
                        });
                });
            };

            function clearChecked() {
                $('#noticesTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    self.prop('checked', false);
                });
            }

            function getChecked() {
                var checkedIds = [];
                $('#noticesTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $noticeTR = self.parents('tr');
                    if (!_.isUndefined($noticeTR)) {
                        var noticeOId = $noticeTR.attr('data-noticeOId');

                        if (!_.isUndefined(noticeOId) && noticeOId.length > 0) {
                            checkedIds.push(noticeOId);
                        }
                    }
                });

                return checkedIds;
            }

            function removeCheckedFromGrid(id) {
                $('#noticesTable #c_' + id + '[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $noticeTR = self.parents('tr');
                    if (!_.isUndefined($noticeTR)) {
                        $noticeTR.remove();
                    }
                });
            }
        });
});