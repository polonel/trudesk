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

define([
    'angular',
    'underscore',
    'jquery',
    'modules/helpers',
    'modules/ui',
    'uikit',
    'easymde',
    'moment',
    'moment_timezone',
    'velocity',
    'history'],
    function(angular, _, $, helpers, ui, UIkit, EasyMDE, moment) {
        return angular.module('trudesk.controllers.settings', ['ngSanitize'])
            .directive('selectize', function($timeout) {
                return {
                    restrict: 'A',
                    require: '?ngModel',
                    link: function(scope, element, attrs, ngModel) {
                        $timeout(function() {
                            // var $element = $(element).selectize(scope.$eval(attrs.selectize));
                            if(!ngModel) return;
                            $(element).selectize().on('change', function() {
                                scope.$apply(function() {
                                    var newValue = $(element).selectize().val();
                                    ngModel.$setViewValue(newValue);
                                });
                            });
                        });
                    }
                };
            })
            .controller('settingsCtrl', function($scope, $http, $timeout, $log, $window) {
                var mdeToolbarItems = [
                    {
                        name: 'bold',
                        action: EasyMDE.toggleBold,
                        className: 'material-icons mi-bold no-ajaxy',
                        title: 'Bold'
                    },
                    {
                        name: 'italic',
                        action: EasyMDE.toggleItalic,
                        className: 'material-icons mi-italic no-ajaxy',
                        title: 'Italic'
                    },
                    {
                        name: 'Title',
                        action: EasyMDE.toggleHeadingSmaller,
                        className: 'material-icons mi-title no-ajaxy',
                        title: 'Title'
                    },
                    '|',
                    {
                        name: 'Code',
                        action: EasyMDE.toggleCodeBlock,
                        className: 'material-icons mi-code no-ajaxy',
                        title: 'Code'
                    },
                    {
                        name: 'Quote',
                        action: EasyMDE.toggleBlockquote,
                        className: 'material-icons mi-quote no-ajaxy',
                        title: 'Quote'
                    },
                    {
                        name: 'Generic List',
                        action: EasyMDE.toggleUnorderedList,
                        className: 'material-icons mi-list no-ajaxy',
                        title: 'Generic List'
                    },
                    {
                        name: 'Numbered List',
                        action: EasyMDE.toggleOrderedList,
                        className: 'material-icons mi-numlist no-ajaxy',
                        title: 'Numbered List'
                    },
                    '|',
                    {
                        name: 'Create Link',
                        action: EasyMDE.drawLink,
                        className: 'material-icons mi-link no-ajaxy',
                        title: 'Create Link'
                    },
                    '|',
                    {
                        name: 'Toggle Preview',
                        action: EasyMDE.togglePreview,
                        className: 'material-icons mi-preview no-disable no-mobile no-ajaxy',
                        title: 'Toggle Preview'
                    }
                ];

                var privacyPolicyMDE = null;

                $scope.init = function() {
                    var $uploadButton = $('#logo-upload-select').parent();
                    var uploadLogoSettings = {
                        action: '/settings/general/uploadlogo',
                        allow: '*.(jpg|jpeg|gif|png)',
                        loadstart: function() {
                            $uploadButton.text('Uploading...');
                            $uploadButton.attr('disabled', true);
                            $uploadButton.addClass('disable');
                        },
                        allcomplete: function() {
                            $uploadButton.text('Upload Logo');
                            $uploadButton.attr('disabled', false);
                            $uploadButton.removeClass('disable');
                            helpers.UI.showSnackbar('Upload Complete', false);
                            // remove page refresh once SettingsService merge
                            // $('img.site-logo').attr('src', '/assets/topLogo.png?refresh=' + new Date().getTime());
                            $window.location.reload();
                            $('button#remove-custom-logo-btn').removeClass('hide');
                        }
                    };

                    UIkit.uploadSelect($('#logo-upload-select'), uploadLogoSettings);

                    var $pageUploadButton = $('#page-logo-upload-select').parent();
                    var pageUploadLogoSettings = {
                        action: '/settings/general/uploadpagelogo',
                        allow: '*.(jpg|jpeg|gif|png)',
                        loadstart: function() {
                            $uploadButton.text('Uploading...');
                            $uploadButton.attr('disabled', true);
                            $uploadButton.addClass('disable');
                        },
                        allcomplete: function() {
                            $pageUploadButton.text('Upload Logo');
                            $pageUploadButton.attr('disabled', false);
                            $pageUploadButton.removeClass('disable');
                            helpers.UI.showSnackbar('Upload Complete', false);
                            // remove page refresh once SettingsService merge
                            // $('img.site-logo').attr('src', '/assets/topLogo.png?refresh=' + new Date().getTime());
                            $window.location.reload();
                            $('button#remove-custom-page-logo-btn').removeClass('hide');
                        }
                    };

                    UIkit.uploadSelect($('#page-logo-upload-select'), pageUploadLogoSettings);

                    var uploadFaviconSettings = {
                        action: '/settings/general/uploadfavicon',
                        allow: '*.(jpg|jpeg|gif|png|ico)',
                        loadstart: function() {
                            $uploadButton.text('Uploading...');
                            $uploadButton.attr('disabled', true);
                            $uploadButton.addClass('disable');
                        },
                        allcomplete: function() {
                            $uploadButton.text('Upload Logo');
                            $uploadButton.attr('disabled', false);
                            $uploadButton.removeClass('disable');
                            helpers.UI.showSnackbar('Upload Complete', false);
                            // remove page refresh once SettingsService merge
                            // $('img.site-logo').attr('src', '/assets/topLogo.png?refresh=' + new Date().getTime());
                            $window.location.reload();
                            $('button#remove-custom-logo-btn').removeClass('hide');
                        }
                    };

                    UIkit.uploadSelect($('#favicon-upload-select'), uploadFaviconSettings);

                    //Fix Inputs if input is preloaded with a value
                    $timeout(function() {
                        $('input.md-input').each(function() {
                            var vm = this;
                            var self = $(vm);
                            if (!_.isEmpty(self.val())) {
                                var s = self.parent('.md-input-wrapper');
                                if (s.length > 0)
                                    s.addClass('md-input-filled');
                            }
                        });

                        //TimeZones
                        $scope.timeZones = moment.tz.names().map(function(name) {
                            var year = new Date().getUTCFullYear();
                            var timezoneAtBeginningOfyear = moment.tz(year + '-01-01', name);
                            return {
                                utc: timezoneAtBeginningOfyear.utcOffset(),
                                label: '(GMT' + timezoneAtBeginningOfyear.format('Z') + ') ' + name,
                                value: name
                            };
                        }).sort(function(a, b) { return a.utc - b.utc; });

                        $timeout(function() {
                            // Call in next cycle - Timezones generated dynamically
                            helpers.UI.selectize($('select#tz').parent());
                        });

                        var $privacyPolicy = $('#privacyPolicy');
                        if ($privacyPolicy.length > 0) {
                            privacyPolicyMDE = new EasyMDE({
                                element: $privacyPolicy[0],
                                forceSync: true,
                                minHeight: '220px', //Slighty smaller to adjust the scroll
                                toolbar: mdeToolbarItems
                            });

                            privacyPolicyMDE.codemirror.off('change');
                            privacyPolicyMDE.codemirror.on('change', function() {
                                $scope.privacyPolicy = privacyPolicyMDE.value();
                            });
                        }

                        // Color Scheme Select
                        var $colorSchemeSelect = $('#colorSchemeSelect');
                        if ($scope.colorSecondary === '#2f3640')
                            $colorSchemeSelect[0].selectize.setValue('dark', true);
                        else if ($scope.colorHeaderBG === '#2e3238')
                            $colorSchemeSelect[0].selectize.setValue('moonlight', true);
                        else if ($scope.colorHeaderBG === '#112d4e')
                            $colorSchemeSelect[0].selectize.setValue('bluejean', true);
                        else if ($scope.colorHeaderBG === '#625757')
                            $colorSchemeSelect[0].selectize.setValue('sandstone', true);
                        else if ($scope.colorHeaderBG === '#404969')
                            $colorSchemeSelect[0].selectize.setValue('winterfire', true);

                        $colorSchemeSelect.on('change', function(e) {
                            $scope.$apply(function() {
                                var val = $colorSchemeSelect.val();
                                switch (val) {
                                    case 'light':
                                        $scope.revertColor('colorHeaderBG', '#42464d');
                                        $scope.revertColor('colorHeaderPrimary', '#f6f7f8');
                                        $scope.revertColor('colorPrimary', '#606771');
                                        $scope.revertColor('colorSecondary', '#f7f8fa');
                                        $scope.revertColor('colorTertiary', '#e74c3c');
                                        $scope.revertColor('colorQuaternary', '#e6e7e8');
                                        break;
                                    case 'dark':
                                        $scope.revertColor('colorHeaderBG', '#242a31');
                                        $scope.revertColor('colorHeaderPrimary', '#f6f7f8');
                                        $scope.revertColor('colorPrimary', '#f6f7f8');
                                        $scope.revertColor('colorSecondary', '#2f3640');
                                        $scope.revertColor('colorTertiary', '#e74c3c');
                                        $scope.revertColor('colorQuaternary', '#454f5d');
                                        break;
                                    case 'bluejean':
                                        $scope.revertColor('colorHeaderBG', '#112d4e');
                                        $scope.revertColor('colorHeaderPrimary', '#f9f7f7');
                                        $scope.revertColor('colorPrimary', '#112d4e');
                                        $scope.revertColor('colorSecondary', '#f9f7f7');
                                        $scope.revertColor('colorTertiary', '#3f72af');
                                        $scope.revertColor('colorQuaternary', '#dbe2ef');
                                        break;
                                    case 'moonlight':
                                        $scope.revertColor('colorHeaderBG', '#2e3238');
                                        $scope.revertColor('colorHeaderPrimary', '#eeeeee');
                                        $scope.revertColor('colorPrimary', '#444a54');
                                        $scope.revertColor('colorSecondary', '#c8c8c8');
                                        $scope.revertColor('colorTertiary', '#7971ea');
                                        $scope.revertColor('colorQuaternary', '#444a54');
                                        break;
                                    case 'sandstone':
                                        $scope.revertColor('colorHeaderBG', '#625757');
                                        $scope.revertColor('colorHeaderPrimary', '#f9f9f9');
                                        $scope.revertColor('colorPrimary', '#625757');
                                        $scope.revertColor('colorSecondary', '#dfdfdf');
                                        $scope.revertColor('colorTertiary', '#ef5a5a');
                                        $scope.revertColor('colorQuaternary', '#6f6363');
                                        break;
                                    case 'winterfire':
                                        $scope.revertColor('colorHeaderBG', '#404969');
                                        $scope.revertColor('colorHeaderPrimary', '#ebf0f6');
                                        $scope.revertColor('colorPrimary', '#404969');
                                        $scope.revertColor('colorSecondary', '#ebf0f6');
                                        $scope.revertColor('colorTertiary', '#ff7f50');
                                        $scope.revertColor('colorQuaternary', '#4a5479');
                                        break;
                                }

                                $scope.saveColorScheme(e);
                            });
                        });

                        // Load MailCheckTicketType from settings
                        var $mailerCheckTicketTypeSelect = $('#mailerCheckTicketType');
                        var $selectizeTicketType = $mailerCheckTicketTypeSelect[0].selectize;
                        if ($mailerCheckTicketTypeSelect.length > 0) {
                            if ($scope.mailerCheckTicketType !== '') { //empty string is reading as '? string: ?' ????
                                $mailerCheckTicketTypeSelect.find('option[value="' + $scope.mailerCheckTicketType + '"]').prop('selected', true);

                                $selectizeTicketType.setValue($scope.mailerCheckTicketType, true);
                                $selectizeTicketType.refreshItems();
                            } else {
                                // Set default to first option.....
                                var first = _.first(_.values($selectizeTicketType.options)).value;

                                $selectizeTicketType.setValue(first, true);
                                $selectizeTicketType.refreshItems();

                                $scope.mailerCheckTicketType = $mailerCheckTicketTypeSelect.val();
                            }
                        }

                        // Load MailCheckTicketPriority from settings
                        var $mailCheckTicketPrioritySelect = $('#mailerCheckTicketPriority');
                        if ($mailCheckTicketPrioritySelect.length > 0) {
                            //Build out priority Options based on selected ticket type
                            loadTypePrioritySelect($scope.mailerCheckTicketType);
                        }

                        // Pagination on ticket Tags
                        loadTicketTagPagination(null, 0);
                        var $ticketTagPagination = $('.ticket-tags-pagination');
                        UIkit.pagination($ticketTagPagination, {
                            items: $scope.ticketTagsCount,
                            itemsOnPage: 16
                        });
                        $ticketTagPagination.on('select.uk.pagination', loadTicketTagPagination);

                    }, 0);
                };

                function loadTypePrioritySelect(typeId) {
                    var $mailCheckTicketPrioritySelect = $('#mailerCheckTicketPriority');
                    if ($mailCheckTicketPrioritySelect.length < 1)
                        return;

                    $http.get('/api/v1/tickets/type/' + typeId)
                        .success(function(response) {
                            if (response.success) {
                                $timeout(function() {
                                    var type = response.type;
                                    if ($scope.mailerCheckTicketPriority === '')
                                        $scope.mailerCheckTicketPriority = _.first(type.priorities)._id;

                                    var holdPriorityValue = $scope.mailerCheckTicketPriority;

                                    if (!_.some(type.priorities, function(i) { return i._id.toString() === holdPriorityValue.toString(); }))
                                        holdPriorityValue = _.first(type.priorities)._id;

                                    var $selectizeTicketPriority = $mailCheckTicketPrioritySelect[0].selectize;
                                    $selectizeTicketPriority.clearOptions();

                                    type.priorities.forEach(function(priority) {
                                        $selectizeTicketPriority.addOption({value: priority._id, text: priority.name});
                                    });

                                    $selectizeTicketPriority.setValue(holdPriorityValue, true);
                                    $selectizeTicketPriority.refreshOptions(false);
                                    $selectizeTicketPriority.refreshItems();
                                }, 0);
                            }
                        })
                        .error(function(err) {
                            helpers.UI.showSnackbar('Error: ' + err, true);
                            $log.error(err);
                        });
                }

                function loadTicketTagPagination(e, pageIndex) {
                    if (e)
                        e.preventDefault();

                    $http.get('/api/v1/tags/limit?limit=16&page=' + pageIndex)
                        .success(function(response) {
                            var tags = [];
                            var $tagWrapper = $('.ticket-tags-wrapper');
                            if ($tagWrapper.length < 1)
                                return;

                            $tagWrapper.empty();
                            if (response.success) {
                                tags = response.tags;
                                // tags = [];
                                if (tags.length === 0) {
                                    $tagWrapper.append('<div style="width: 100%; padding: 55px; text-align: center;"><h3 style="font-size: 24px; font-weight: 300;">No Tags Found</h3></div>');
                                    $('.ticket-tags-pagination').hide();
                                } else {
                                    tags.forEach(function(tag) {
                                        var html = '';
                                        html += '<div class="uk-width-1-2 br bb">\n' +
                                            ' <div id="view-tag-' + tag._id + '" data-tagId="' + tag._id + '" class="z-box uk-clearfix">\n' +
                                            '     <div class="uk-grid uk-grid-collapse uk-clearfix">\n' +
                                            '         <div class="uk-width-1-2">\n' +
                                            '             <h5 class="tag-' + tag._id + '-name" style="font-size: 16px; line-height: 31px; margin: 0; padding: 0; font-weight: 300;">' + tag.name + '</h5>\n' +
                                            '         </div>\n' +
                                            '         <div class="uk-width-1-2 uk-text-right">\n' +
                                            '             <div class="md-btn-group mt-5">\n' +
                                            '                 <a class="md-btn md-btn-small md-btn-flat" ng-click="editTagClicked(\'' + tag._id + '\', $event);">edit</a>\n' +
                                            '                 <a class="md-btn md-btn-small md-btn-flat md-btn-flat-danger" ng-click="removeTagClicked(\'' + tag._id + '\', $event);">remove</a>\n' +
                                            '             </div>\n' +
                                            '         </div>\n' +
                                            '     </div>\n' +
                                            ' </div>\n' +
                                            ' <div id="edit-tag-' + tag._id + '" data-tagId="' + tag._id + '" class="z-box uk-clearfix hide" style="padding-top: 19px; border-top: none !important;">\n' +
                                            '     <form data-tag-id="' + tag._id + '" ng-submit="submitUpdateTag($event);">\n' +
                                            '         <div class="uk-grid uk-grid-collapse uk-clearfix">\n' +
                                            '             <div class="uk-width-2-3">\n' +
                                            // '                 <label for="">Name</label>\n' +
                                            '                 <input type="text" class="md-input" style="padding: 5px;" name="tag-' + tag._id + '-name" value="' + tag.name + '" />\n' +
                                            '             </div>\n' +
                                            '             <div class="uk-width-1-3">\n' +
                                            '                 <div class="md-btn-group uk-float-right uk-text-right" style="margin-top: 2px;">\n' +
                                            '                     <a class="md-btn md-btn-small md-btn-flat" ng-click="cancelEditTagClicked(\'' + tag._id + '\', $event);">Cancel</a>\n' +
                                            '                     <button type="submit" class="md-btn md-btn-small md-btn-flat md-btn-flat-success">Save</button>\n' +
                                            '                 </div>\n' +
                                            '             </div>\n' +
                                            '         </div>\n' +
                                            '     </form>\n' +
                                            ' </div>\n' +
                                            ' </div>';

                                        $tagWrapper.append(html);
                                    });

                                    //Bootstrap Angular dynamically...
                                    var $injector = angular.injector(['ng', 'trudesk']);
                                    $injector.invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                                        var $scope = $tagWrapper.scope();
                                        $compile($tagWrapper)($scope || $rootScope);
                                        $rootScope.$digest();
                                    }]);

                                    //Fix filled inputs
                                    helpers.UI.inputs();
                                    helpers.UI.reRenderInputs();
                                }
                            }
                        })
                        .error(function(err) {
                            $log.error(err);
                        });
                }

                $scope.$watch('mailerEnabled', function(newVal) {
                    $('input#mailerHost').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    $('input#mailerSSL').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    $('input#mailerPort').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    $('input#mailerUsername').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    $('input#mailerPassword').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    $('input#mailerFrom').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    $('button#mailerSubmit').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                });

                $scope.defaultTicketTypeChanged = function() {
                    if(!$scope.defaultTicketType)
                        return;

                    $http.put('/api/v1/settings', {
                        name: 'ticket:type:default',
                        value: $scope.defaultTicketType
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                    }, function errorCallback(err) {
                        $log.error(err);
                        helpers.UI.showSnackbar('Error: ' + err, true);
                    });
                };

                $scope.mailerCheckTicketTypeChanged = function() {
                    loadTypePrioritySelect($scope.mailerCheckTicketType);
                };

                $scope.switchSettings = function(event, settings) {
                    if (settings) {
                        var currentTarget = $(event.currentTarget);
                        var $target = $('div[data-settings-id="' + settings + '"]');
                        var $settingsWrap = $('.settings-wrap');
                        if ($target.length > 0) {
                            //Hide Them
                            $('.settings-categories > li').each(function(){ var vm = this; $(vm).removeClass('active'); });
                            $settingsWrap.find('div[data-settings-id]').each(function() {
                                var vm = this;
                                $(vm).removeClass('active');
                            });

                            $('.page-wrapper').scrollTop(0);

                            //Show Selected
                            $target.addClass('active');
                            if (currentTarget.length > 0)
                                currentTarget.addClass('active');


                            if (settings === 'settings-tickets')
                                $target.find('ul>li[data-key]').first().addClass('active');


                            if (settings === 'settings-legal' && privacyPolicyMDE)
                                privacyPolicyMDE.codemirror.refresh();
                        }
                    }
                };

                $scope.timezoneChanged = function() {
                    $http.put('/api/v1/settings', {
                        name: 'gen:timezone',
                        value: $scope.selectedTimezone.replace('string:', '')
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        helpers.UI.showSnackbar('Timezone Updated. Please restart server.', false);
                    }, function errorCallback(err) {
                       helpers.UI.showSnackbar('Error: ' + err, true);
                        $log.error(err);
                    });
                };

                $scope.saveSiteTitleClicked = function() {
                    $http.put('/api/v1/settings', {
                        name: 'gen:sitetitle',
                        value: $scope.siteTitle
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        helpers.UI.showSnackbar('Site title saved successfully.', false);
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar('Error: ' + err, true);
                        $log.error(err);
                    });
                };

                $scope.saveSiteUrlClicked = function() {
                    $http.put('/api/v1/settings', {
                        name: 'gen:siteurl',
                        value: $scope.siteUrl
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        helpers.UI.showSnackbar('Site URL saved successfully.', false);
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar('Error: ' + err, true);
                        $log.error(err);
                    });
                };

                $scope.removeCustomLogo = function(event) {
                    event.preventDefault();
                    $http.put('/api/v1/settings', {
                        name: 'gen:customlogo',
                        value: false
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        $window.location.reload();
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar('Error: ' + err, true);
                        $log.error(err);
                    });
                };

                $scope.removeCustomPageLogo = function(event) {
                    event.preventDefault();
                    $http.put('/api/v1/settings', {
                        name: 'gen:custompagelogo',
                        value: false
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        $window.location.reload();
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar('Error: ' + err, true);
                        $log.error(err);
                    });
                };

                $scope.removeCustomFavicon = function(event) {
                    event.preventDefault();
                    $http.put('/api/v1/settings', {
                        name: 'gen:customfavicon',
                        value: false
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        $window.location.reload();
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar('Error: ' + err, true);
                        $log.error(err);
                    });
                };

                $scope.mailerEnabledChange = function() {
                    var vm = this;
                    $scope.mailerEnabled = vm.mailerEnabled;

                    $http.put('/api/v1/settings', {
                        name: 'mailer:enable',
                        value: $scope.mailerEnabled
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {

                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar('Error: ' + err, true);
                    });
                };

                $scope.mailerSSLChange = function() {
                    var vm = this;
                    $scope.mailerSSL = vm.mailerSSL;

                    $http.put('/api/v1/settings', {
                        name: 'mailer:ssl',
                        value: $scope.mailerSSL
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {

                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar('Error: ' + err, true);
                    });
                };

                $scope.submitTestMailer = function($event) {
                    $event.preventDefault();
                    helpers.UI.showSnackbar('Testing...', false);
                    $http.post('/api/v1/settings/testmailer', {
                        //Empty
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        helpers.UI.showSnackbar('Successfully Connected', false);
                    }, function errorCallback(response) {
                        helpers.UI.showSnackbar('Error: ' + response.data.error, true);
                    });
                };

                $scope.mailerFormSubmit = function($event) {
                    $event.preventDefault();
                    $http.put('/api/v1/settings', [
                        {name: 'mailer:host', value: $scope.mailerHost},
                        {name: 'mailer:ssl', value: $scope.mailerSSL},
                        {name: 'mailer:port', value: $scope.mailerPort},
                        {name: 'mailer:username', value: $scope.mailerUsername},
                        {name: 'mailer:password', value: $scope.mailerPassword},
                        {name: 'mailer:from', value: $scope.mailerFrom}
                    ], {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        helpers.UI.showSnackbar('Mailer Settings Saved', false);
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.tpsEnabledChange = function() {
                    var vm = this;
                    $scope.tpsEnabled = vm.tpsEnabled;

                    $http.put('/api/v1/settings', {
                        name: 'tps:enable',
                        value: $scope.tpsEnabled
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {

                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.tpsFormSubmit = function($event) {
                    $event.preventDefault();
                    $http.put('/api/v1/settings', [
                        { name: 'tps:username', value: $scope.tpsUsername },
                        { name: 'tps:apikey', value: $scope.tpsApiKey}
                    ], {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        helpers.UI.showSnackbar('TPS Settings Saved', false);
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.$watch('mailerCheckEnabled', function(newVal) {
                    var $mailerCheckTicketTypeSelectize = $('select#mailerCheckTicketType').selectize()[0];
                    var $mailerCheckTicketPrioritySelectize = $('select#mailerCheckTicketPriority').selectize()[0];

                    $('input#mailerCheckHost').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    $('input#mailerCheckPort').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    $('input#mailerCheckUsername').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    $('input#mailerCheckPassword').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    $('button#mailerCheckSubmit').attr('disabled', !newVal).parent().toggleClass('md-input-wrapper-disabled', !newVal);
                    if (!_.isUndefined($mailerCheckTicketTypeSelectize)) {
                        if (!newVal)
                            $mailerCheckTicketTypeSelectize.selectize.disable();
                        else
                            $mailerCheckTicketTypeSelectize.selectize.enable();
                    }
                    if (!_.isUndefined($mailerCheckTicketPrioritySelectize)) {
                        if (!newVal)
                            $mailerCheckTicketPrioritySelectize.selectize.disable();
                        else
                            $mailerCheckTicketPrioritySelectize.selectize.enable();
                    }
                });

                $scope.mailerCheckEnabledChange = function() {
                    var vm = this;
                    $scope.mailerCheckEnabled = vm.mailerCheckEnabled;

                    $http.put('/api/v1/settings', {
                        name: 'mailer:check:enable',
                        value: $scope.mailerCheckEnabled
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        if (!$scope.mailerCheckEnabled) {
                            UIkit.modal.confirm('Settings will take affect after server restart. <br /> <br /> Would you like to restart the server now?', function() {
                                    $http.get(
                                        '/api/v1/admin/restart'
                                    )
                                        .success(function() {
                                        })
                                        .error(function(err) {
                                            helpers.hideLoader();
                                            $log.log('[trudesk:settings:mailerCheckSubmit] - Error: ' + err.error);
                                            $log.error(err);
                                        });
                                }, {
                                    labels: {'Ok': 'Yes', 'Cancel': 'No'}, confirmButtonClass: 'md-btn-primary'
                                });
                        }
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.mailerCheckFormSubmit = function($event) {
                    $event.preventDefault();
                    var mailerCheckTicketTypeValue = $('#mailerCheckTicketType option[selected]').val();
                    var mailerCheckTicketPriorityValue = $('#mailerCheckTicketPriority option[selected]').val();
                    $http.put('/api/v1/settings', [
                        {name: 'mailer:check:host', value: $scope.mailerCheckHost},
                        {name: 'mailer:check:port', value: $scope.mailerCheckPort},
                        {name: 'mailer:check:username', value: $scope.mailerCheckUsername},
                        {name: 'mailer:check:password', value: $scope.mailerCheckPassword},
                        {name: 'mailer:check:ticketype', value: mailerCheckTicketTypeValue},
                        {name: 'mailer:check:ticketpriority', value: mailerCheckTicketPriorityValue},
                        {name: 'mailer:check:createaccount', value: $scope.mailerCheckCreateAccount},
                        {name: 'mailer:check:deletemessage', value: $scope.mailerCheckDeleteMessage}

                    ], {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        helpers.UI.showSnackbar('Mail Check Settings Saved', false);

                        UIkit.modal.confirm('Settings will take affect after server restart. <br /> <br /> Would you like to restart the server now?', function() {
                                $http.get(
                                    '/api/v1/admin/restart'
                                )
                                    .success(function() {
                                    })
                                    .error(function(err) {
                                        helpers.hideLoader();
                                        $log.log('[trudesk:settings:mailerCheckSubmit] - Error: ' + err.error);
                                        $log.error(err);
                                    });
                            }, {
                                labels: {'Ok': 'Yes', 'Cancel': 'No'}, confirmButtonClass: 'md-btn-primary'
                            });
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err.data.error, true);
                        $log.error(err);
                    });
                };

                $scope.savePrivacyPolicy = function($event) {
                    $event.preventDefault();

                    $http.put('/api/v1/settings', {
                        name: 'legal:privacypolicy', value: $scope.privacyPolicy
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        helpers.UI.showSnackbar('Privacy Policy Updated', false);
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.showTourChanged = function() {
                    var vm = this;
                    $scope.showTour = vm.showTour;

                    $http.put('/api/v1/settings', {
                        name: 'showTour:enable',
                        value: $scope.showTour
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {

                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.showOverdueTicketsChanged = function() {
                    var vm = this;
                    $scope.showOverdueTickets = vm.showOverdueTickets;

                    $http.put('/api/v1/settings', {
                        name: 'showOverdueTickets:enable',
                        value: $scope.showOverdueTickets
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {

                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.allowPublicTicketsChanged = function() {
                    var vm = this;
                    $scope.allowPublicTickets = vm.allowPublicTickets;

                    $http.put('/api/v1/settings', {
                        name: 'allowPublicTickets:enable',
                        value: $scope.allowPublicTickets
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {

                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.allowUserRegistrationChanged = function() {
                    var vm = this;
                    $scope.allowUserRegistration = vm.allowUserRegistration;

                    $http.put('/api/v1/settings', {
                        name: 'allowUserRegistration:enable',
                        value: $scope.allowUserRegistration
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {

                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.showCreateTagWindow = function($event) {
                    $event.preventDefault();
                    var createTagModal = $('#createTagModal');
                    if (createTagModal.length > 0)
                        UIkit.modal(createTagModal, {bgclose: false}).show();

                };

                $scope.createTag = function($event) {
                    $event.preventDefault();
                    var form = $('#createTagForm');
                    if (!form.isValid(null, null, false))
                        return true;
                     else {
                        var tagName = form.find('input[name="tagName"]').val();
                        if (!tagName || tagName.length < 3) return true;

                        $http.post('/api/v1/tags/create', {
                            tag: tagName
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).then(function successCallback() {
                            helpers.UI.showSnackbar('Tag: ' + tagName + ' created successfully', false);
                            var time = new Date().getTime();
                            History.pushState(null, null, '/settings/tickets/?refresh=' + time);

                        }, function errorCallback(err) {
                            helpers.UI.showSnackbar('Unable to create tag. Check console', true);
                            $log.error(err);
                        });
                    }
                };

                $scope.showCreateTicketTypeWindow = function($event) {
                    $event.preventDefault();
                    var createTicketTypeModal = $('#createTicketTypeModal');
                    if (createTicketTypeModal.length > 0)
                        UIkit.modal(createTicketTypeModal, {bgclose: false}).show();

                };

                $scope.switchTicketType = function($event) {
                    var $currentTarget = $($event.currentTarget);
                    if ($currentTarget) {
                        if ($currentTarget.hasClass('active')) return true;
                        var key = $currentTarget.attr('data-key');
                        var $keyWindow = $currentTarget.parent().parent().parent().find('div[data-ticket-type-id="' + key + '"]');
                        if ($keyWindow) {
                            $currentTarget.parent().find('li.active').removeClass('active');
                            $currentTarget.addClass('active');
                            $('div[data-ticket-type-id].active').velocity({
                                opacity: 0
                            }, {
                                duration: 250,
                                complete: function() {
                                    var vm = this;
                                    $(vm).removeClass('active').addClass('hide');

                                    $keyWindow.velocity({
                                        opacity: 1
                                    }, {
                                        duration: 250,
                                        begin: function() {
                                            $keyWindow.removeClass('hide');
                                        },
                                        complete: function() {
                                            $keyWindow.addClass('active');
                                        }
                                    });
                                }
                            });
                        }
                    }
                };

                $scope.createTicketType = function(event) {
                    event.preventDefault();
                    var form = $('#createTicketTypeForm');
                    if (!form.isValid(null, null, false))
                        return true;
                     else {
                        var typeName = form.find('input[name="typeName"]').val();
                        if (!typeName || typeName.length < 3) return true;

                        $http.post('/api/v1/tickets/types/create', {
                            name: typeName
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).then(function successCallback() {
                            helpers.UI.showSnackbar('Type: ' + typeName + ' created successfully', false);

                            History.pushState(null, null, '/settings/tickets/?refresh=true');

                        }, function errorCallback(err) {
                            helpers.UI.showSnackbar('Unable to create ticket type. Check console', true);
                            $log.error(err);
                        });
                    }
                };

                $scope.editTicketType = function($event) {
                    if (_.isNull($event.target) || _.isUndefined($event.target) ||
                        $event.target.tagName.toLowerCase() === 'label' ||
                        $event.target.tagName.toLowerCase() === 'input')
                        return true;

                    var ticketTypeId = $event.currentTarget.dataset.tickettypeoid;
                    if (!ticketTypeId) return true;

                    History.pushState(null, null, '/settings/tickettypes/' + ticketTypeId);
                };

                $scope.submitUpdateTicketType = function($event, typeId) {
                    $event.preventDefault();
                    var $form = $($event.currentTarget);
                    if ($form) {
                        var $typeNameInput = $form.find('input#ticket-type-name-' + typeId);
                        var typeName = $typeNameInput.val();

                        $http.put('/api/v1/tickets/types/' + typeId, {
                            name: typeName
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).then(function successCallback() {
                            helpers.UI.showSnackbar('Type: ' + typeName + ' updated successfully', false);
                            $('li[data-key="' + typeId + '"]').find('h3').text(typeName);
                        }, function errorCallback(err) {
                            helpers.UI.showSnackbar(err, true);
                        });
                    }
                };

                $scope.updateTicketType = function(typeId) {
                    if (!typeId || typeId.length < 1) {
                        helpers.UI.showSnackbar('Unable to get type id', true);
                        return true;
                    }

                    var typeName = $('#editType_Name').val();

                    $http.put('/api/v1/tickets/types/' + typeId, {
                        name: typeName
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        helpers.UI.showSnackbar('Type: ' + typeName + ' updated successfully', false);
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.showDeleteTicketType = function(typeId, hasTickets) {
                    if (hasTickets) {
                        var delTicketTypeModal = $('#deleteTicketTypeModal-' + typeId);
                        if (delTicketTypeModal.length > 0)
                            UIkit.modal(delTicketTypeModal, {bgclose: false}).show();
                         else
                            $log.log('Unable to locate modal window: #deleteTicketTypeModal' + typeId);

                    } else
                        $scope.submitDeleteTicketType(typeId, undefined);

                };

                $scope.submitDeleteTicketType = function(typeId, event) {
                    if (event) event.preventDefault();

                    if (_.isUndefined(typeId) || typeId.length < 1) {
                        helpers.UI.showSnackbar('Unable to get type ID', true);
                        return true;
                    }

                    var typeName = $('input#del_type_name-' + typeId).val();
                    var newTypeId = $('form#deleteTicketTypeForm-' + typeId + ' select[name="ticketType"]').val();

                    if (!newTypeId || newTypeId.length < 1) {
                        helpers.UI.showSnackbar('Unable to get new ticket type. Aborting...', true);
                        return true;
                    }

                    $http({
                        method: 'DELETE',
                        url: '/api/v1/tickets/types/' + typeId,
                        data: {
                            newTypeId: newTypeId
                        },
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback(response) {
                        if (response.data.success) {
                            helpers.UI.showSnackbar('Successfully removed ticket type: ' + typeName, false);

                            return History.pushState(null, null, '/settings/tickets/');
                        }
                    }, function errorCallback(response) {
                        if (!_.isUndefined(response.data.error.custom)) {
                            $log.error('[trudesk:settings:submitDeleteTicketType] Error -', response.data.error);
                            helpers.UI.showSnackbar(response.data.error.message, true);
                        } else {
                            $log.error('[trudesk:settings:submitDeleteTicketType] Error -', response.data.error);
                            helpers.UI.showSnackbar('Unable to remove ticket type. Check console.', true);
                        }
                    });
                };

                $scope.editTagClicked = function(tagId, $event) {
                    if ($event)
                        $event.preventDefault();

                    var $viewBox = $('#view-tag-' + tagId);
                    var $editBox = $('#edit-tag-' + tagId);
                    if ($editBox.length > 0 && $viewBox.length > 0) {
                        $viewBox.addClass('hide');
                        $editBox.removeClass('hide');
                    }
                };

                $scope.cancelEditTagClicked = function(tagId, $event) {
                    if ($event)
                        $event.preventDefault();

                    var $viewBox = $('#view-tag-' + tagId);
                    var $editBox = $('#edit-tag-' + tagId);
                    if ($editBox.length > 0 && $viewBox.length > 0) {
                        if ($event)
                            $($event.currentTarget).parents('form').trigger('reset');
                        $viewBox.removeClass('hide');
                        $editBox.addClass('hide');
                    }
                };

                $scope.editPriority = function(pId, $event) {
                    $event.preventDefault();
                    var $viewBox = $('#view-p-' + pId);
                    var $editBox = $('#edit-p-' + pId);
                    if ($editBox.length > 0 && $viewBox.length > 0) {
                        $editBox.find('.uk-color-button').css({background: $editBox.find('input[name="p-' + pId + '-htmlColor"]').val()});
                        $viewBox.addClass('hide');
                        $editBox.removeClass('hide');
                    }
                };

                $scope.cancelEditPriority = function(pId, $event) {
                    if ($event)
                        $event.preventDefault();
                    var $viewBox = $('#view-p-' + pId);
                    var $editBox = $('#edit-p-' + pId);
                    if ($editBox.length > 0 && $viewBox.length > 0) {
                        if ($event)
                            $($event.currentTarget).parents('form').trigger('reset');
                        $viewBox.removeClass('hide');
                        $editBox.addClass('hide');
                    }
                };

                $scope.editTicketTypePriority = function(typeId, id, $event) {
                    $event.preventDefault();
                    var $viewBox = $('#t-' + typeId + '-view-p-' + id);
                    var $editBox = $('#t-' + typeId + '-edit-p-' + id);
                    if ($editBox.length > 0 && $viewBox.length > 0) {
                        $editBox.find('.uk-color-button').css({background: $editBox.find('input[name="p-' + id + '-htmlColor"]').val()});
                        $viewBox.addClass('hide');
                        $editBox.removeClass('hide');
                    }
                };

                $scope.cancelEditTicketTypePriority = function(typeId, id, $event) {
                    if ($event)
                        $event.preventDefault();
                    var $viewBox = $('#t-' + typeId + '-view-p-' + id);
                    var $editBox = $('#t-' + typeId + '-edit-p-' + id);
                    if ($editBox.length > 0 && $viewBox.length > 0) {
                        if ($event)
                            $($event.currentTarget).parents('form').trigger('reset');
                        $viewBox.removeClass('hide');
                        $editBox.addClass('hide');
                    }
                };

                $scope.showAddPriorityToType = function(typeId, $event) {
                    if ($event)
                        $event.preventDefault();

                    //Dynamically load priorities....
                    $http.get('/api/v1/tickets/type/' + typeId)
                        .success(function(response) {
                            if (response.success) {
                                var updatedType = response.type;
                                $http.get('/api/v1/tickets/priorities')
                                    .success(function(response) {
                                        var priorities = response.priorities;
                                        var $addPriorityToTypeModal = $('#addPriorityTicketType-' + typeId);
                                        var $pLoop = $addPriorityToTypeModal.find('.priority-loop');
                                        $pLoop.empty();

                                        var html = '';
                                        _.each(priorities, function(priority) {
                                            if (_.some(updatedType.priorities, priority)) {
                                                html = '';
                                                html += '<div class="z-box uk-clearfix">\n' +
                                                    '       <div class="uk-float-left">\n' +
                                                    '           <h5 class="p-' + priority._id + '-name" style="color: ' + priority.htmlColor + '; font-weight: bold;">' + priority.name + '</h5>\n' +
                                                    '           <p class="uk-text-muted">SLA Overdue: <strong class="p-' + priority._id + '-overdueIn">' + priority.durationFormatted + '</strong></p>\n' +
                                                    '       </div>\n' +
                                                    '       <div class="uk-float-right">\n' +
                                                    '           <i class="material-icons uk-text-success mt-10 mr-15" style="font-size: 28px;">check</i>\n' +
                                                    '       </div>\n' +
                                                    '   </div>';

                                                $pLoop.append(html);
                                            } else {
                                                html = '';
                                                html += '<div class="z-box uk-clearfix">\n' +
                                                    '       <div class="uk-float-left">\n' +
                                                    '           <h5 class="p-' + priority._id + '-name" style="color: ' + priority.htmlColor + '; font-weight: bold;">' + priority.name + '</h5>\n' +
                                                    '           <p class="uk-text-muted">SLA Overdue: <strong class="p-' + priority._id + '-overdueIn">' + priority.durationFormatted + '</strong></p>\n' +
                                                    '       </div>\n' +
                                                    '       <div class="uk-float-right">\n' +
                                                    '           <a class="uk-button uk-button-success mt-10 mr-10" ng-click="priorityAddBtnClicked(\'' + updatedType._id + '\', \'' + priority._id + '\', $event);">Add</a>\n' +
                                                    '           <i class="material-icons uk-text-success mt-10 mr-15" style="display: none; opacity: 0; font-size: 28px;">check</i>\n' +
                                                    '       </div>\n' +
                                                    '   </div>';

                                                $pLoop.append(html);
                                            }
                                        });

                                        var $injector = angular.injector(['ng', 'trudesk']);
                                        $injector.invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                                            var $scope = $pLoop.scope();
                                            $compile($pLoop)($scope || $rootScope);
                                            $rootScope.$digest();
                                        }]);

                                        if ($addPriorityToTypeModal.length > 0)
                                            UIkit.modal($addPriorityToTypeModal, {bgclose: false}).show();
                                         else
                                            $log.error('Unable to locate add priority modal.');

                                    })
                                    .error(function(error) {
                                        $log.error(error);
                                        helpers.UI.showSnackbar('Unable to load ticket type. Check Console.');
                                    });
                            } else
                                helpers.UI.showSnackbar('Unable to load ticket type. Check Console.');

                        })
                        .error(function(error) {
                            $log.error(error);
                            helpers.UI.showSnackbar('Unable to load ticket type. Check Console.');
                        });
                };

                $scope.priorityAddBtnClicked = function(typeId, pId, $event) {
                    $event.preventDefault();
                    var $addButton = $($event.currentTarget);
                    if ($addButton.length < 1)
                        return false;

                    $http.post('/api/v1/tickets/type/' + typeId + '/addpriority', {
                        priority: pId
                    }, {
                        'Content-Type': 'application/json'
                    }).then(function success(response) {
                        var Type = response.data.type;
                        if (Type) {
                            //Update UI
                            var $typeContainer = $('div[data-ticket-type-id="' + typeId + '"]');
                            if ($typeContainer.length > 0) {
                                var $prioritiesBox = $typeContainer.find('.priority-loop');
                                var html = '';
                                $prioritiesBox.empty();
                                var sortedTypePriorities = _.sortBy(( _.sortBy(Type.priorities, 'name')), 'migrationNum');

                                _.each(sortedTypePriorities, function(priority) {
                                    html = '';
                                    html += '<div id="t-' + Type._id + '-view-p-' + priority._id + '" data-pId="' + priority._id + '" class="z-box uk-clearfix">\n' +
                                        '       <div class="uk-float-left">\n' +
                                        '           <h5 class="p-' + priority._id + '-name" style="color: ' + priority.htmlColor + '; font-weight: bold;">' + priority.name + '</h5>\n' +
                                        '           <p class="uk-text-muted">SLA Overdue: <strong class="p-' + priority._id + '-overdueIn">' + priority.durationFormatted + '</strong></p>\n' +
                                        '       </div>\n' +
                                        '       <div class="uk-float-right">\n' +
                                        '           <div class="md-btn-group mt-5">\n' +
                                        '               <a class="md-btn md-btn-small" ng-click="editTicketTypePriority(\'' + Type._id + '\', \'' + priority._id + '\', $event);">Edit</a>\n' +
                                        '               <a class="md-btn md-btn-small md-btn-danger" ng-click="submitRemoveTicketTypePriority(\'' + Type._id + '\', \'' + priority._id + '\', $event);">Remove</a>\n' +
                                        '           </div>\n' +
                                        '       </div>\n' +
                                        '    </div>\n' +
                                        '    <div id="t-' + Type._id + '-edit-p-' + priority._id + '" data-pId="' + priority._id + '" class="z-box uk-clearfix hide" style="padding-top: 19px;">\n' +
                                        '       <form data-priority-id="' + priority._id + '" ng-submit="submitUpdatePriority($event);">\n' +
                                        '           <div class="uk-grid uk-grid-collapse uk-clearfix">\n' +
                                        '               <div class="uk-width-1-4">\n' +
                                        '                   <label for="">Priority Name</label>\n' +
                                        '                   <input type="text" class="md-input" name="p-' + priority._id + '-name" value="' + priority.name + '" />\n' +
                                        '               </div>\n' +
                                        '               <div class="uk-width-1-4 uk-padding-small-sides">\n' +
                                        '                   <label for="">SLA Overdue (minutes)</label>\n' +
                                        '                   <input type="text" class="md-input" name="p-' + priority._id + '-overdueIn" value="' + priority.overdueIn + '" />\n' +
                                        '               </div>\n' +
                                        '               <div class="uk-width-1-4 uk-padding-small-sides">\n' +
                                        '                   <button type="button" class="uk-button uk-button-small uk-color-button mr-5 mt-10" style="background: ' + priority.htmlColor + '" ng-click="generateRandomColor(\'' + priority._id + '\', $event);"><i class="material-icons">refresh</i></button>\n' +
                                        '                   <div class="md-input-wrapper uk-float-left" style="width: 70%;">\n' +
                                        '                       <label for="">Color</label>\n' +
                                        '                       <input type="text" class="md-input" name="p-' + priority._id + '-htmlColor" value="' + priority.htmlColor + '" />\n' +
                                        '                       <span class="md-input-bar"></span>\n' +
                                        '                   </div>\n' +
                                        '               </div>\n' +
                                        '               <div class="uk-width-1-4">\n' +
                                        '                   <div class="md-btn-group uk-float-right uk-text-right mt-5">\n' +
                                        '                       <a class="md-btn md-btn-small" ng-click="cancelEditTicketTypePriority(\'' + Type._id + '\',\'' + priority._id + '\', $event);">Cancel</a>\n' +
                                        '                       <button type="submit" class="md-btn md-btn-small md-btn-success">Save</button>\n' +
                                        '                   </div>\n' +
                                        '               </div>\n' +
                                        '           </div>\n' +
                                        '       </form>\n' +
                                        '   </div>';

                                    $prioritiesBox.append(html);
                                });

                                //Bootstrap Angular dynamically...
                                var $injector = angular.injector(['ng', 'trudesk']);
                                $injector.invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                                    var $scope = $prioritiesBox.scope();
                                    $compile($prioritiesBox)($scope || $rootScope);
                                    $rootScope.$digest();
                                }]);

                                //Fix filled inputs
                                helpers.UI.inputs();
                                helpers.UI.reRenderInputs();
                            }
                        }


                        //Animation
                        $addButton.velocity({
                            opacity: 0
                        }, {
                            duration: 350,
                            complete: function() {
                                $addButton.addClass('hide');
                            }
                        });

                        var $check = $addButton.siblings('i.material-icons');
                        if ($check.length > 0) {
                            $check.velocity({
                                opacity: 1
                            }, {
                                delay: 360,
                                duration: 200,
                                begin: function() {
                                    $check.show();
                                }
                            });
                        }
                    }, function errorCallback(err) {
                        $log.error(err);
                        helpers.UI.showSnackbar('Error: ' + err, true);
                    });
                };

                $scope.removePriorityClicked = function(pId, $event) {
                    if ($event)
                        $event.preventDefault();

                    var deletePriorityModal = $('#deletePriorityModal-' + pId);
                    if (deletePriorityModal.length > 0) {
                        deletePriorityModal.find('form').trigger('reset');
                        UIkit.modal(deletePriorityModal, {bgclose: false}).show();
                    } else
                        $log.error('Unable to locate delete priority modal.');

                };

                $scope.submitRemovePriority = function(pId, $event) {
                    if ($event)
                        $event.preventDefault();

                    if (pId) {
                        var $form = $($event.currentTarget).parents('form');
                        var selectedPriority = $form.find('select[name="priority"]').val();

                        $http.post('/api/v1/tickets/priority/' + pId + '/delete', {
                            newPriority: selectedPriority
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                            .then(function() {
                                var $body = $('body');
                                // $body.find('div#view-p-' + pId).remove();
                                // $body.find('div#edit-p-' + pId).remove();
                                $body.find('div[data-pId="' + pId + '"]').remove();
                                var deletePriorityModal = $('#deletePriorityModal-' + pId);
                                if (deletePriorityModal)
                                    UIkit.modal(deletePriorityModal).hide();

                            }, function(err) {
                                $log.error(err);
                                helpers.UI.showSnackbar(err.data.error, true);
                            });
                    }
                };

                $scope.submitRemoveTicketTypePriority = function(typeId, priorityId, $event) {
                    if ($event)
                        $event.preventDefault();

                    if (typeId && priorityId) {
                        $http.post('/api/v1/tickets/type/' + typeId + '/removepriority', {
                            priority: priorityId
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).then(function() {
                            helpers.UI.showSnackbar('Removed priority from type', false);
                            var $body = $('body');
                            $body.find('div#t-' + typeId + '-view-p-' + priorityId).remove();
                            $body.find('div#t-' + typeId + '-edit-p-' + priorityId).remove();
                        }, function(err) {
                            $log.error(err);
                            helpers.UI.showSnackbar(err.data.error, true);
                        });
                    }
                };

                $scope.showCreatePriorityWindow = function($event) {
                    if ($event)
                        $event.preventDefault();

                    var createPriorityModal = $('#createPriorityModal');
                    if (createPriorityModal.length > 0) {
                        createPriorityModal.find('form').trigger('reset');
                        helpers.UI.inputs();
                        helpers.UI.reRenderInputs();
                        createPriorityModal.find('form').trigger('reset');
                        createPriorityModal.find('.generateHtmlColorBtn').css({background: '#29B955'});
                        UIkit.modal(createPriorityModal, {bgclose: false}).show();
                        createPriorityModal.find('input[name="p-name"]').focus();
                    } else
                        $log.error('Unable to locate create priority modal.');

                };

                $scope.createPrioritySubmit = function($event) {
                    $event.preventDefault();
                    var $form = $($event.currentTarget);
                    if ($form) {
                        if (!$form.isValid(null, null, false))
                            return false;

                        var $priorityName = $form.find('input[name="p-name"]');
                        var $priorityOverdueIn = $form.find('input[name="p-overdueIn"]');
                        var $priorityHtmlColor = $form.find('input[name="p-htmlColor"]');
                        if ($priorityName.length < 1 || $priorityOverdueIn.length < 1 || $priorityHtmlColor.length < 1)
                            return false;

                        var name = $priorityName.val();
                        var overdueIn = $priorityOverdueIn.val();
                        var htmlColor = $priorityHtmlColor.val();

                        $http.post('/api/v1/tickets/priority/create', {
                            name: name,
                            overdueIn: overdueIn,
                            htmlColor: htmlColor
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).then(function successCallback(response) {
                            var savedPriority = response.data.priority;
                            if (savedPriority) {
                                var priorityLoop = $('body').find('.all-priorities-loop');
                                if (priorityLoop) {
                                    $http.get('/api/v1/tickets/priorities')
                                        .success(function(pResponse) {
                                            var priorities = pResponse.priorities;
                                            var html = '';
                                            html += '<div id="view-p-' + savedPriority._id + '" data-pId="' + savedPriority._id + '" class="z-box uk-clearfix">\n' +
                                                '       <div class="uk-float-left">\n' +
                                                '           <h5 class="p-' + savedPriority._id + '-name" style="color: ' + savedPriority.htmlColor + '; font-weight: bold;">' + savedPriority.name + '</h5>\n' +
                                                '           <p class="uk-text-muted">SLA Overdue: <strong class="p-' + savedPriority._id + '-overdueIn">' + savedPriority.durationFormatted + '</strong></p>\n' +
                                                '       </div>\n' +
                                                '       <div class="uk-float-right">\n' +
                                                '           <div class="md-btn-group mt-5">\n' +
                                                '               <a class="md-btn md-btn-small" ng-click="editPriority(\'' + savedPriority._id + '\', $event);">Edit</a>\n' +
                                                '               <a class="md-btn md-btn-small md-btn-danger" ng-click="removePriorityClicked(\'' + savedPriority._id + '\', $event);">Remove</a>\n' +
                                                '           </div>\n' +
                                                '       </div>\n' +
                                                '    </div>\n' +
                                                '    <div id="edit-p-' + savedPriority._id + '" data-pId="' + savedPriority._id + '" class="z-box uk-clearfix hide" style="padding-top: 19px;">\n' +
                                                '       <form data-priority-id="' + savedPriority._id + '" ng-submit="submitUpdatePriority($event);">\n' +
                                                '           <div class="uk-grid uk-grid-collapse uk-clearfix">\n' +
                                                '               <div class="uk-width-1-4">\n' +
                                                '                   <label for="">Priority Name</label>\n' +
                                                '                   <input type="text" class="md-input" name="p-' + savedPriority._id + '-name" value="' + savedPriority.name + '" />\n' +
                                                '               </div>\n' +
                                                '               <div class="uk-width-1-4 uk-padding-small-sides">\n' +
                                                '                   <label for="">SLA Overdue (minutes)</label>\n' +
                                                '                   <input type="text" class="md-input" name="p-' + savedPriority._id + '-overdueIn" value="' + savedPriority.overdueIn + '" />\n' +
                                                '               </div>\n' +
                                                '               <div class="uk-width-1-4 uk-padding-small-sides">\n' +
                                                '                   <button class="uk-button uk-button-small uk-color-button mr-5 mt-10" style="background: ' + savedPriority.htmlColor + '" ng-click="generateRandomColor(\'' + savedPriority._id + '\', $event);"><i class="material-icons">refresh</i></button>\n' +
                                                '                   <div class="md-input-wrapper uk-float-left" style="width: 70%;">\n' +
                                                '                       <label for="">Color</label>\n' +
                                                '                       <input type="text" class="md-input" name="p-' + savedPriority._id + '-htmlColor" value="' + savedPriority.htmlColor + '" />\n' +
                                                '                       <span class="md-input-bar"></span>\n' +
                                                '                   </div>\n' +
                                                '               </div>\n' +
                                                '               <div class="uk-width-1-4">\n' +
                                                '                   <div class="md-btn-group uk-float-right uk-text-right mt-5">\n' +
                                                '                       <a class="md-btn md-btn-small" ng-click="cancelEditPriority(\'' + savedPriority._id + '\', $event);">Cancel</a>\n' +
                                                '                       <button type="submit" class="md-btn md-btn-small md-btn-success">Save</button>\n' +
                                                '                   </div>\n' +
                                                '               </div>\n' +
                                                '           </div>\n' +
                                                '       </form>\n' +
                                                '    </div>\n' +
                                                '<div class="uk-modal" id="deletePriorityModal-'+ savedPriority._id + '" data-pId="' + savedPriority._id + '" ng-controller="settingsCtrl">\n' +
                                                '    <div class="uk-modal-dialog">\n' +
                                                '        <form class="uk-form-stacked" id="deletePriorityForm-' + savedPriority._id + '" action="#" method="POST">\n' +
                                                '            <input type="hidden" id="del_priority_name-' + savedPriority._id + '" name="del_priority_name" value="' + savedPriority.name + '">\n' +
                                                '            <div class="uk-margin-medium-bottom uk-clearfix">\n' +
                                                '                <h2 class="">Remove Priority</h2>\n' +
                                                '                <span>Please select the priority you wish to reassign tickets to in order to delete the this priority.</span>\n' +
                                                '                <hr style="margin: 10px 0" />\n' +
                                                '            </div>\n' +
                                                '            <div class="uk-margin-medium-bottom uk-clearfix">\n' +
                                                '                <div class="uk-float-left" style="width: 100%;">\n' +
                                                '                    <label for="priority" class="uk-form-label">Priority</label>\n' +
                                                '                    <select class="selectize" name="priority" data-md-selectize-inline>\n';

                                            priorities.forEach(function(p) {
                                                if (p._id.toString() !== savedPriority._id)
                                                    html += '<option value="' + p._id + '">' + p.name + '</option>';
                                            });

                                                html +=
                                                '                    </select>\n' +
                                                '                </div>\n' +
                                                '            </div>\n' +
                                                '            <div class="uk-margin-medium-bottom uk-clearfix">\n' +
                                                '                <span class="uk-text-danger">WARNING: This will change all tickets with a priority of: <strong>' + savedPriority.name + '</strong> to the selected priority above. <br /><strong>This is permanent!</strong></span>\n' +
                                                '            </div>\n' +
                                                '            <div class="uk-modal-footer uk-text-right">\n' +
                                                '                <button type="button" class="md-btn md-btn-flat uk-modal-close">Cancel</button>\n' +
                                                '                <button type="button" class="md-btn md-btn-flat md-btn-flat-danger" data-id="submitDeleteTicketType" ng-click="submitRemovePriority(\'' + savedPriority._id + '\', $event)">Delete</button>\n' +
                                                '            </div>\n' +
                                                '        </form>\n' +
                                                '    </div>\n' +
                                                '</div>\n';

                                            priorityLoop.append(html);

                                            helpers.UI.selectize();

                                            //Bootstrap Angular dynamically...
                                            var $injector = angular.injector(['ng', 'trudesk']);
                                            $injector.invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                                                var $scope = priorityLoop.scope();
                                                $compile(priorityLoop)($scope || $rootScope);
                                                $rootScope.$digest();
                                            }]);

                                            helpers.UI.showSnackbar('Priority Created.', false);
                                            var createPriorityModal = $('#createPriorityModal');
                                            if (createPriorityModal.length > 0)
                                                UIkit.modal(createPriorityModal).hide();

                                        })
                                        .error(function(errorResponse) {
                                            $log.error(errorResponse);
                                            helpers.UI.showSnackbar('Error: ' + errorResponse.data.error, true);
                                        });
                                }
                            }
                        }, function errorCallback(errorResponse) {
                            $log.error(errorResponse);
                            helpers.UI.showSnackbar('Error: ' + errorResponse.data.error, true);
                        });

                    }
                };

                $scope.submitUpdatePriority = function($event) {
                    $event.preventDefault();
                    var $form = $($event.currentTarget);
                    var priorityId = $form.attr('data-priority-id');
                    var typeId = $form.parents('div[data-ticket-type-id]').attr('data-ticket-type-id');
                    if ($form && priorityId) {
                        var $priorityNameInput = $form.find('input[name="p-' + priorityId + '-name"]');
                        var $priorityHtmlColor = $form.find('input[name="p-' + priorityId + '-htmlColor"]');
                        var $priorityOverdueIn = $form.find('input[name="p-' + priorityId + '-overdueIn"]');
                        var priorityName = $priorityNameInput.val();
                        var htmlColor = $priorityHtmlColor.val();
                        var overdueIn = $priorityOverdueIn.val();

                        $http.put('/api/v1/tickets/priority/' + priorityId, {
                            name: priorityName,
                            htmlColor: htmlColor,
                            overdueIn: overdueIn
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).then(function successCallback(response) {
                            helpers.UI.showSnackbar('Priority updated successfully', false);
                            var $body = $('body');
                            $body.find('.p-' + priorityId + '-name').css({color: htmlColor}).text(priorityName);
                            $body.find('.p-' + priorityId + '-overdueIn').text(response.data.priority.durationFormatted);
                            $body.find('input[name="p-' + priorityId + '-htmlColor"]').val(htmlColor);
                            if (typeId)
                                $scope.cancelEditTicketTypePriority(typeId, priorityId);
                            else
                                $scope.cancelEditPriority(priorityId);
                        }, function errorCallback(err) {
                            helpers.UI.showSnackbar(err, true);
                        });
                    }
                };

                // Colors watch
                function setApperanceColorBtn(selector, color) {
                    var $button = $(selector);
                    var fgColor = getContrast(color);
                    $button.css({background: color, color: fgColor});
                }

                $scope.$watch('colorHeaderBG', function() { setApperanceColorBtn('#headerBGColorBtn', $scope.colorHeaderBG); });
                $scope.$watch('colorHeaderPrimary', function() { setApperanceColorBtn('#headerPrimaryColorBtn', $scope.colorHeaderPrimary); });
                $scope.$watch('colorPrimary', function() { setApperanceColorBtn('#primaryColorBtn', $scope.colorPrimary); });
                $scope.$watch('colorSecondary', function() { setApperanceColorBtn('#secondaryColorBtn', $scope.colorSecondary); });
                $scope.$watch('colorTertiary', function() { setApperanceColorBtn('#tertiaryColorBtn', $scope.colorTertiary); });
                $scope.$watch('colorQuaternary', function() { setApperanceColorBtn('#quaternaryColorBtn', $scope.colorQuaternary); });

                $scope.saveColorScheme = function($event) {
                    $event.preventDefault();
                    if ($scope.colorHeaderBG[0] !== '#') {
                        helpers.UI.showSnackbar('Invalid Header BG Color', true);
                        return false;
                    }

                    if ($scope.colorHeaderPrimary[0] !== '#') {
                        helpers.UI.showSnackbar('Invalid Header Primary Color', true);
                        return false;
                    }

                    if ($scope.colorPrimary[0] !== '#') {
                        helpers.UI.showSnackbar('Invalid Primary Color', true);
                        return false;
                    }

                    if ($scope.colorSecondary[0] !== '#') {
                        helpers.UI.showSnackbar('Invalid Secondary Color', true);
                        return false;
                    }

                    if ($scope.colorTertiary[0] !== '#') {
                        helpers.UI.showSnackbar('Invalid Tertiary Color', true);
                        return false;
                    }

                    if ($scope.colorQuaternary[0] !== '#') {
                        helpers.UI.showSnackbar('Invalid Quaternary Color', true);
                        return false;
                    }

                    $http.put('/api/v1/settings', [
                        {name: 'color:headerbg', value: $scope.colorHeaderBG},
                        {name: 'color:headerprimary', value: $scope.colorHeaderPrimary},
                        {name: 'color:primary', value: $scope.colorPrimary},
                        {name: 'color:secondary', value: $scope.colorSecondary},
                        {name: 'color:tertiary', value: $scope.colorTertiary},
                        {name: 'color:quaternary', value: $scope.colorQuaternary}
                    ], {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function successCallback() {
                        // Call rebuild of app.min.css
                        $http.get('/api/v1/settings/buildsass')
                            .then(function successCallback() {
                                helpers.UI.showSnackbar('Color Scheme Saved. Reloading...', false);
                                $timeout(function() { $window.location.reload(); }, 1000);
                            }, function errorCallback(err) {
                                helpers.UI.showSnackbar(err, true);
                            });
                    }, function errorCallback(err) {
                        helpers.UI.showSnackbar(err, true);
                    });
                };

                $scope.revertColor = function(model, defaultColor) {
                    $scope[model] = defaultColor;
                };

                $scope.generateRandomColor = function(id, $event) {
                    $event.preventDefault();
                    var $currentTarget = $($event.currentTarget);
                    if ($currentTarget.length > 0) {
                        var color = getRandomColor();
                        var fgColor = getContrast(color.substring(1));
                        $currentTarget.css({background: color, color: fgColor});
                        $currentTarget.next().find('input').val(color);
                        if ($currentTarget.next().find('input').attr('ng-model')) 
                            $scope[$currentTarget.next().find('input').attr('ng-model')] = color;
                        
                    }
                };

                function getRandomColor() {
                    var letters = '0123456789ABCDEF';
                    var color = '#';
                    for (var i = 0; i < 6; i++)
                        color += letters[Math.floor(Math.random() * 16)];

                    return color;
                }

                function getContrast(hexcolor){
                    hexcolor = hexcolor.replace('#', '');
                    if (hexcolor.length === 3) {
                        var v = hexcolor[0];
                        hexcolor = hexcolor + v + v + v;
                    }
                    var r = parseInt(hexcolor.substr(0,2),16);
                    var g = parseInt(hexcolor.substr(2,2),16);
                    var b = parseInt(hexcolor.substr(4,2),16);
                    var yiq = ((r*299)+(g*587)+(b*114))/1000;
                    return (yiq >= 128) ? '#444' : '#f7f8fa';
                }

                $scope.editTag = function($event) {
                    if (_.isNull($event.target) || _.isUndefined($event.target) ||
                        $event.target.tagName.toLowerCase() === 'label' ||
                        $event.target.tagName.toLowerCase() === 'input')
                        return true;

                    //currentTarget = ng-click() bound to. "<tr>"
                    var id = $event.currentTarget.dataset.tagoid;
                    if (!id) return true;

                    History.pushState(null, null, '/settings/tags/' + id);
                };

                $scope.submitUpdateTag = function($event) {
                    var $form = $($event.currentTarget);
                    var tagId = $form.attr('data-tag-id');
                    var tagName = $form.find('input[name="tag-' + tagId + '-name"]').val();
                    if (tagName.length < 3)
                        helpers.UI.showSnackbar('Invalid Tag Name', true);
                     else {
                        $http.put('/api/v1/tags/' + tagId, {
                            name: tagName
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).success(function() {
                            helpers.UI.showSnackbar('Tag: ' + tagName + ' updated successfully', false);
                            var $h5 = $('h5.tag-' + tagId + '-name');
                            if ($h5.length > 0)
                                $h5.text(tagName);
                            $scope.cancelEditTagClicked(tagId, null);
                        }).error(function(err) {
                            helpers.UI.showSnackbar(err.error);
                        });
                    }
                };

                $scope.removeTagClicked = function(tagId) {
                    var tagName = $('#view-tag-' + tagId).find('h5').text();
                    UIkit.modal.confirm('Really delete tag <strong>' + tagName + '</strong><br /><i style="font-size: 13px; color: #e53935;">This will remove the tag from all associated tickets!</i>', function() {
                        return $scope.deleteTag(tagId);
                    }, {
                        labels: {'Ok': 'Yes', 'Cancel': 'No'}, confirmButtonClass: 'md-btn-danger'
                    });
                };

                $scope.deleteTag = function(tagId) {
                    if (_.isUndefined(tagId) || tagId.length < 1) {
                        helpers.UI.showSnackbar('Unable to get tag ID', true);
                        return true;
                    }

                    var tagName = $('#view-tag-' + tagId).find('h5').text();

                    $http({
                        method: 'DELETE',
                        url: '/api/v1/tags/' + tagId
                    }).then(function successCallback(response) {
                        if (response.data.success) {
                            helpers.UI.showSnackbar('Successfully removed tag: ' + tagName, false);

                            return History.pushState(null, null, '/settings/tickets/?refresh=' + new Date().getTime());
                        }
                    }, function errorCallback(response) {
                        $log.error('[trudesk:settings:deleteTag] Error - ' + response.data.error);
                        helpers.UI.showSnackbar('Unable to remove Tag. Check console.', true);

                    });
                };
            });
    });