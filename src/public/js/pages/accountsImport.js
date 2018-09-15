/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    04/07/2016
 Author:     Chris Brame

 **/

define('pages/accountsImport', [
    'jquery',
    'underscore',
    'modules/helpers',
    'velocity',
    'uikit',
    'modules/socket',

    'jquery_steps',
    'jquery_actual',
    'history'

], function($, _, helpers, velocity, UIkit, socket) {
    var accountsImportPage = {};
    var state = {};
    accountsImportPage.init = function(callback) {
        $(document).ready(function() {
            var testPage = $('#page-content').find('.accountsImport');
            if (testPage.length < 1) {
                if (typeof callback === 'function')
                    return callback();

                return;
            }

            helpers.resizeAll();

            accountsImportPage.wizard_csv();
            accountsImportPage.csvUpload();

            accountsImportPage.wizard_json();
            accountsImportPage.jsonUpload();

            accountsImportPage.wizard_ldap();

            state.csvUploaded = false;
            state.csvData = null;

            if (typeof callback === 'function')
                return callback();
        });
    };

    accountsImportPage.wizard_csv = function() {
        var $wizard_csv = $('#wizard_csv');

        if ($wizard_csv.length) {
            $wizard_csv.steps({
                headerTag: 'h3',
                bodyTag: 'section',
                transitionEffect: 'slideLeft',
                trigger: 'change',
                cssClass: 'wizard wizard-green',
                onInit: function(event, currentIndex) {
                    content_height($wizard_csv, currentIndex);

                    $wizard_csv.find('.button_next').addClass('disabled').attr('aria-disabled', true).find('a').attr('disabled', true);

                    setTimeout(function() {
                        $(window).resize();
                    }, 100);
                },
                onStepChanging: function(event, currentIndex, newIndex) {
                    if (currentIndex === 0 && newIndex === 1) {
                        // Review Uploaded Data
                        if (!state.csvUploaded)
                            return false;
                    }

                    return true;
                },
                onStepChanged: function(event, currentIndex) {
                    if (currentIndex === 2) {
                        //Last step Disable all until done.
                        $wizard_csv.find('.steps ul li').each(function(){ $(this).addClass('disabled'); } );
                        $wizard_csv.find('.actions ul li').addClass('disabled');
                        $wizard_csv.find('.button_previous').addClass('disabled').attr('aria-disabled', true);

                        var csvStatusBox = $('#csv-import-status-box');
                        var csvStatusUL = csvStatusBox.find('ul');
                        csvStatusUL.append('<li>Starting import...</li>');
                        disableUIElements();

                        //send data
                        setTimeout(function() {
                            socket.accountsImporter.sendAccountData('csv', state.addedUsers, state.updatedUsers);
                        }, 1000);
                    }

                    //Disable all future steps when moving backwards
                    $('.steps .current').nextAll().removeClass('done').addClass('disabled');

                    content_height($wizard_csv, currentIndex);
                },
                onFinished: function() {
                    location.href = '/accounts';
                }
            })
        }
    };

    accountsImportPage.csvUpload = function() {
        var progressbar = $('#progressbar'),
            bar = progressbar.find('.uk-progress-bar'),
            settings = {
                action: '/accounts/import/csv/upload',
                allow: '*.csv',
                loadstart: function() {
                    bar.css("width", "0%").text("0%");
                    progressbar.removeClass('uk-hidden');
                },
                progress: function(percent) {
                    percent = Math.ceil(percent);
                    bar.css("width", percent+"%").text(percent + "%");
                },
                notallowed: function(file) {
                    helpers.UI.showSnackbar('Invalid File Type. Please upload a CSV file.', true);
                },
                error: function(err) {
                    console.error(err);
                    helpers.UI.showSnackbar('An unknown error occurred. Check Console', true);
                },
                allcomplete: function(response) {
                    response = JSON.parse(response);
                    if (!response.success) {
                        console.log(response);
                        helpers.UI.showSnackbar('An Error occurred. Check Console', true);
                        return false;
                    }

                    state.csvUploaded = true;
                    state.csvData = response.contents;
                    state.addedUsers = response.addedUsers;
                    state.updatedUsers = response.updatedUsers;

                    $('#csv-review-list').val(csvReviewRender(response.addedUsers, response.updatedUsers));

                    console.log(state.csvData);

                    bar.css("width", "100%").text("100%");

                    setTimeout(function() {
                        progressbar.addClass('uk-hidden');

                        $('#wizard_csv').steps('setStep', 1);
                    }, 1000);

                    // helpers.UI.showSnackbar('Upload Complete', false);
                }
            };

            UIkit.uploadSelect($('#upload-select'), settings);
            UIkit.uploadDrop($('#upload-drop'), settings);
    };

    accountsImportPage.wizard_json = function() {
        var $wizard_json = $('#wizard_json');

        if ($wizard_json.length) {
            $wizard_json.steps({
                headerTag: 'h3',
                bodyTag: 'section',
                transitionEffect: 'slideLeft',
                trigger: 'change',
                cssClass: 'wizard wizard-blue-gray',
                onInit: function(event, currentIndex) {
                    content_height($wizard_json, currentIndex);

                    $wizard_json.find('.button_next').addClass('disabled').attr('aria-disabled', true).find('a').attr('disabled', true);

                    setTimeout(function() {
                        $(window).resize();
                    }, 100);
                },
                onStepChanging: function(event, currentIndex, newIndex) {
                    if (currentIndex === 0 && newIndex === 1) {
                        // Review Uploaded Data
                        if (!state.jsonUploaded)
                            return false;
                    }

                    return true;
                },
                onStepChanged: function(event, currentIndex) {
                    if (currentIndex === 2) {
                        //Last step Disable all until done.
                        $wizard_json.find('.steps ul li').each(function(){ $(this).addClass('disabled'); } );
                        $wizard_json.find('.actions ul li').addClass('disabled');
                        $wizard_json.find('.button_previous').addClass('disabled').attr('aria-disabled', true);

                        var csvStatusBox = $('#json-import-status-box');
                        var csvStatusUL = csvStatusBox.find('ul');
                        csvStatusUL.append('<li>Starting import...</li>');
                        disableUIElements();

                        //send data
                        setTimeout(function() {
                            socket.accountsImporter.sendAccountData('json', state.addedUsers, state.updatedUsers);
                        }, 1000);
                    }

                    //Disable all future steps when moving backwards
                    $('.steps .current').nextAll().removeClass('done').addClass('disabled');

                    content_height($wizard_json, currentIndex);
                },
                onFinished: function() {
                    location.href = '/accounts';
                }
            })
        }
    };

    accountsImportPage.jsonUpload = function() {
        var progressbar = $('#json-progressbar'),
            bar = progressbar.find('.uk-progress-bar'),
            settings = {
                action: '/accounts/import/json/upload',
                allow: '*.json',
                loadstart: function() {
                    bar.css("width", "0%").text("0%");
                    progressbar.removeClass('uk-hidden');
                },
                progress: function(percent) {
                    percent = Math.ceil(percent);
                    bar.css("width", percent+"%").text(percent + "%");
                },
                notallowed: function(file) {
                    helpers.UI.showSnackbar('Invalid File Type. Please upload a JSON file.', true);
                },
                error: function(err) {
                    console.error(err);
                    helpers.UI.showSnackbar('An unknown error occurred. Check Console', true);
                },
                allcomplete: function(response) {
                    response = JSON.parse(response);
                    if (!response.success) {
                        console.log(response);
                        helpers.UI.showSnackbar('An Error occurred. Check Console', true);
                        return false;
                    }

                    state.jsonUploaded = true;
                    state.jsonData = response.contents;
                    state.addedUsers = response.addedUsers;
                    state.updatedUsers = response.updatedUsers;

                    $('#json-review-list').val(csvReviewRender(response.addedUsers, response.updatedUsers));

                    bar.css("width", "100%").text("100%");

                    setTimeout(function() {
                        progressbar.addClass('uk-hidden');

                        $('#wizard_json').steps('setStep', 1);
                    }, 1000);

                }
            };

        UIkit.uploadSelect($('#json-upload-select'), settings);
        UIkit.uploadDrop($('#json-upload-drop'), settings);
    };

    accountsImportPage.wizard_ldap = function() {
        var $wizard_ldap = $('#wizard_ldap');
        var $connectionForm = $('#wizard_ldap_connection_form');

        var ldapSuccess = false;

        var addedUsers = [],
            updatedUsers = [];

        if ($wizard_ldap.length) {
            $wizard_ldap.steps({
                headerTag: 'h3',
                bodyTag: 'section',
                transitionEffect: 'slideLeft',
                trigger: 'change',
                cssClass: 'wizard',
                onInit: function(event, currentIndex) {
                    content_height($wizard_ldap, currentIndex);

                    // $wizard_ldap.find('.button_next').addClass('disabled').attr('aria-disabled', true).find('a').attr('disabled', true);
                    $wizard_ldap.find('.button_next > a').html('Connect  <i class=\'material-icons\'>&#xE315;</i>');

                    setTimeout(function() {
                        $(window).resize();
                    }, 100);
                },
                onStepChanging: function(event, currentIndex, newIndex) {
                    if (currentIndex === 0 && newIndex === 1) {
                        var verifyStatus = $('#wizard_ldap_verify_text');
                        var data = $connectionForm.serializeObject();

                        $wizard_ldap.find('#wizard_ldap_verify_spinner').removeClass('uk-hidden');
                        $wizard_ldap.find('#wizard_ldap_verify_icon').addClass('uk-hidden');
                        $wizard_ldap.find('.button_next > a').html('Next  <i class=\'material-icons\'>&#xE315;</i>');
                        setTimeout(function() {
                            $.ajax({
                                url: '/accounts/import/ldap/bind',
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                contentType: 'application/json',
                                dataType: 'json',
                                data: JSON.stringify(data),
                                beforeSend: function() {
                                    // $wizard_ldap.siblings('.card-spinner').removeClass('uk-hidden');
                                },
                                error: function(err) {
                                    console.error(err);
                                    verifyStatus.text('An error occured while trying to bind to the ldap server. Please check connection settings.');
                                    $wizard_ldap.find('#wizard_ldap_verify_spinner').addClass('uk-hidden');
                                    $wizard_ldap.find('#wizard_ldap_verify_icon').removeClass('md-color-green uk-hidden').addClass('md-color-red').find('> i').html('&#xE000;')
                                    // $wizard_ldap.steps('setStep', 0);
                                },
                                success: function(response) {
                                    if (response.success) {
                                        ldapSuccess = true;
                                        verifyStatus.text('Successfully connected to ldap server. Please click next to review accounts.');
                                        $wizard_ldap.find('#wizard_ldap_verify_spinner').addClass('uk-hidden');
                                        $wizard_ldap.find('#wizard_ldap_verify_icon').removeClass('md-color-red uk-hidden').addClass('md-color-green').find('> i').html('&#xE86C;')
                                        addedUsers = response.addedUsers;
                                        updatedUsers = response.updatedUsers;

                                        $('#ldap-review-list').val(ldapReviewRender(response.addedUsers, response.updatedUsers));
                                    } else {
                                        verifyStatus.text('An error occured while trying to bind to the ldap server. Please check connection settings.');
                                        $wizard_ldap.find('#wizard_ldap_verify_spinner').addClass('uk-hidden');
                                        $wizard_ldap.find('#wizard_ldap_verify_icon').removeClass('md-color-green uk-hidden').addClass('md-color-red').find('> i').html('&#xE000;')
                                    }
                                },
                                complete: function() {
                                    setTimeout(function(){
                                        $wizard_ldap.siblings('.card-spinner').addClass('uk-hidden');
                                    }, 800);
                                }
                            });
                        }, 500);
                    }

                    if (newIndex === 0) {
                        ldapSuccess = false;
                    }

                    if (currentIndex === 1 && newIndex === 0) {
                        //Verify to Connection
                        $wizard_ldap.find('.button_next > a').html('Connect  <i class=\'material-icons\'>&#xE315;</i>');
                    }

                    if (currentIndex === 1 && newIndex === 2) {
                        // Verify to Review
                        if (!ldapSuccess) return false;
                    }

                    if (newIndex === 3) {

                        // $wizard_ldap.find('.button_previous').addClass('disabled').attr('aria-disabled', true);
                        // $wizard_ldap.find('.button_finish').addClass('disabled').attr('aria-disabled', true);
                    }

                    return true;
                },
                onStepChanged: function(event, currentIndex) {
                    if (currentIndex === 3) {
                        //Last step Disable all until done.
                        $wizard_ldap.find('.steps ul li').each(function(){ $(this).addClass('disabled'); } );
                        $wizard_ldap.find('.actions ul li').addClass('disabled');
                        $wizard_ldap.find('.button_previous').addClass('disabled').attr('aria-disabled', true);

                        var ldapStatusBox = $('#ldap-import-status-box');
                        var ldapStatusUL = ldapStatusBox.find('ul');
                        ldapStatusUL.append('<li>Starting import...</li>');
                        disableUIElements();

                        //send data
                        setTimeout(function() {
                            socket.accountsImporter.sendAccountData('ldap', addedUsers, updatedUsers);
                        }, 1000);
                    }

                    //Disable all future steps when moving backwards
                    $('.steps .current').nextAll().removeClass('done').addClass('disabled');

                    content_height($wizard_ldap, currentIndex);
                },
                onFinished: function() {
                    location.href = '/accounts';
                }
            })
        }
    };

    function disableUIElements() {
        // $(window).on('beforeunload', function() {
        //     return "Are you sure? We are still importing users.";
        // });

        $('.sidebar').css({width: 0});
        $('.side-nav-bottom-panel').css({width: 0});
        $('#page-content').css('margin-left', 0);
        $('.top-menu').css({display: 'none'});
        $('.js-wizard-select-wrapper').css({display: 'none'});
        $('.js-wizard-cancel').each(function() { $(this).css({display: 'none'}); });
    }

    function ldapReviewRender(addedUsers, updatedUsers) {
        var addedUsersTemplate = [];
        var updatedUsersTemplate = [];

        if (addedUsers === null) addedUsers = [];
        if (updatedUsers === null) updatedUsers = [];

        for (var i = 0; i < addedUsers.length; i++) {
            addedUsersTemplate.push(
                addedUsers[i].sAMAccountName +
                ' | action=add username=' + addedUsers[i].sAMAccountName +
                ' name=' + addedUsers[i].displayName +
                ' email=' + addedUsers[i].mail +
                ' title=' + addedUsers[i].title
            );
        }

        for (var k = 0; k < updatedUsers.length; k++) {
            updatedUsersTemplate.push(
                updatedUsers[k].username +
                ' | action=update username=' + updatedUsers[k].username +
                ' name=' + updatedUsers[k].fullname +
                ' email=' + updatedUsers[k].email +
                ' title=' + updatedUsers[k].title
            );
        }

        var sep = [];

        if (addedUsersTemplate.length > 0)
            sep.push('----------------');

        return _.union(addedUsersTemplate, sep, updatedUsersTemplate).join('\r');
    }

    function csvReviewRender(addedUsers, updatedUsers) {
        var addedUsersTemplate = [];
        var updatedUsersTemplate = [];

        if (addedUsers === null) addedUsers = [];
        if (updatedUsers === null) updatedUsers = [];

        for (var i = 0; i < addedUsers.length; i++) {
            addedUsersTemplate.push(
                addedUsers[i].username +
                ' | action=add username=' + addedUsers[i].username +
                ' name=' + addedUsers[i].fullname +
                ' email=' + addedUsers[i].email +
                ' title=' + addedUsers[i].title
            );
        }

        for (var k = 0; k < updatedUsers.length; k++) {
            updatedUsersTemplate.push(
                updatedUsers[k].username +
                ' | action=update username=' + updatedUsers[k].username +
                ' name=' + updatedUsers[k].fullname +
                ' email=' + updatedUsers[k].email +
                ' title=' + updatedUsers[k].title
            );
        }

        var sep = [];

        if (addedUsersTemplate.length > 0)
            sep.push('----------------');

        return _.union(addedUsersTemplate, sep, updatedUsersTemplate).join('\r');
    }

    function content_height(this_wizard, step) {
        var this_height = $(this_wizard).find('.step-' + step).actual('outerHeight');
        $(this_wizard).children('.content').velocity({ height: this_height }, {duration: 140, easing: [0.215,0.61,0.355,1] })
    }

    return accountsImportPage;
});