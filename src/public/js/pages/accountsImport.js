/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

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
], function ($, _, helpers, velocity, UIkit, socket) {
  var accountsImportPage = {}
  var state = {}
  accountsImportPage.init = function (callback) {
    $(document).ready(function () {
      var testPage = $('#page-content').find('.accountsImport')
      if (testPage.length < 1) {
        if (typeof callback === 'function') {
          return callback()
        }

        return false
      }

      helpers.resizeAll()

      accountsImportPage.wizardCSV()
      accountsImportPage.csvUpload()

      accountsImportPage.wizardJson()
      accountsImportPage.jsonUpload()

      accountsImportPage.wizardLdap()

      state.csvUploaded = false
      state.csvData = null

      if (typeof callback === 'function') {
        return callback()
      }
    })
  }

  accountsImportPage.wizardCSV = function () {
    var $wizardCsv = $('#wizard_csv')

    if ($wizardCsv.length) {
      $wizardCsv.steps({
        headerTag: 'h3',
        bodyTag: 'section',
        transitionEffect: 'slideLeft',
        trigger: 'change',
        cssClass: 'wizard wizard-green',
        onInit: function (event, currentIndex) {
          contentHeight($wizardCsv, currentIndex)

          $wizardCsv
            .find('.button_next')
            .addClass('disabled')
            .attr('aria-disabled', true)
            .find('a')
            .attr('disabled', true)

          setTimeout(function () {
            $(window).resize()
          }, 100)
        },
        onStepChanging: function (event, currentIndex, newIndex) {
          if (currentIndex === 0 && newIndex === 1) {
            // Review Uploaded Data
            if (!state.csvUploaded) {
              return false
            }
          }

          return true
        },
        onStepChanged: function (event, currentIndex) {
          if (currentIndex === 2) {
            // Last step Disable all until done.
            $wizardCsv.find('.steps ul li').each(function () {
              $(this).addClass('disabled')
            })
            $wizardCsv.find('.actions ul li').addClass('disabled')
            $wizardCsv
              .find('.button_previous')
              .addClass('disabled')
              .attr('aria-disabled', true)

            var csvStatusBox = $('#csv-import-status-box')
            var csvStatusUL = csvStatusBox.find('ul')
            csvStatusUL.append('<li>Starting import...</li>')
            disableUIElements()

            // send data
            setTimeout(function () {
              socket.accountsImporter.sendAccountData('csv', state.addedUsers, state.updatedUsers)
            }, 1000)
          }

          // Disable all future steps when moving backwards
          $('.steps .current')
            .nextAll()
            .removeClass('done')
            .addClass('disabled')

          contentHeight($wizardCsv, currentIndex)
        },
        onFinished: function () {
          location.href = '/accounts'
        }
      })
    }
  }

  accountsImportPage.csvUpload = function () {
    var progressbar = $('#progressbar')

    var bar = progressbar.find('.uk-progress-bar')

    var settings = {
      action: '/accounts/import/csv/upload',
      allow: '*.csv',
      loadstart: function () {
        bar.css('width', '0%').text('0%')
        progressbar.removeClass('uk-hidden')
      },
      progress: function (percent) {
        percent = Math.ceil(percent)
        bar.css('width', percent + '%').text(percent + '%')
      },
      notallowed: function () {
        helpers.UI.showSnackbar('Invalid File Type. Please upload a CSV file.', true)
      },
      error: function (err) {
        console.error(err)
        helpers.UI.showSnackbar('An unknown error occurred. Check Console', true)
      },
      allcomplete: function (response) {
        response = JSON.parse(response)
        if (!response.success) {
          console.log(response)
          helpers.UI.showSnackbar('An Error occurred. Check Console', true)
          return false
        }

        state.csvUploaded = true
        state.csvData = response.contents
        state.addedUsers = response.addedUsers
        state.updatedUsers = response.updatedUsers

        $('#csv-review-list').val(csvReviewRender(response.addedUsers, response.updatedUsers))

        console.log(state.csvData)

        bar.css('width', '100%').text('100%')

        setTimeout(function () {
          progressbar.addClass('uk-hidden')

          $('#wizard_csv').steps('setStep', 1)
        }, 1000)

        // helpers.UI.showSnackbar('Upload Complete', false);
      }
    }

    UIkit.uploadSelect($('#upload-select'), settings)
    UIkit.uploadDrop($('#upload-drop'), settings)
  }

  accountsImportPage.wizardJson = function () {
    var $wizardJson = $('#wizard_json')

    if ($wizardJson.length) {
      $wizardJson.steps({
        headerTag: 'h3',
        bodyTag: 'section',
        transitionEffect: 'slideLeft',
        trigger: 'change',
        cssClass: 'wizard wizard-blue-gray',
        onInit: function (event, currentIndex) {
          contentHeight($wizardJson, currentIndex)

          $wizardJson
            .find('.button_next')
            .addClass('disabled')
            .attr('aria-disabled', true)
            .find('a')
            .attr('disabled', true)

          setTimeout(function () {
            $(window).resize()
          }, 100)
        },
        onStepChanging: function (event, currentIndex, newIndex) {
          if (currentIndex === 0 && newIndex === 1) {
            // Review Uploaded Data
            if (!state.jsonUploaded) {
              return false
            }
          }

          return true
        },
        onStepChanged: function (event, currentIndex) {
          if (currentIndex === 2) {
            // Last step Disable all until done.
            $wizardJson.find('.steps ul li').each(function () {
              $(this).addClass('disabled')
            })
            $wizardJson.find('.actions ul li').addClass('disabled')
            $wizardJson
              .find('.button_previous')
              .addClass('disabled')
              .attr('aria-disabled', true)

            var csvStatusBox = $('#json-import-status-box')
            var csvStatusUL = csvStatusBox.find('ul')
            csvStatusUL.append('<li>Starting import...</li>')
            disableUIElements()

            // send data
            setTimeout(function () {
              socket.accountsImporter.sendAccountData('json', state.addedUsers, state.updatedUsers)
            }, 1000)
          }

          // Disable all future steps when moving backwards
          $('.steps .current')
            .nextAll()
            .removeClass('done')
            .addClass('disabled')

          contentHeight($wizardJson, currentIndex)
        },
        onFinished: function () {
          location.href = '/accounts'
        }
      })
    }
  }

  accountsImportPage.jsonUpload = function () {
    var progressbar = $('#json-progressbar')

    var bar = progressbar.find('.uk-progress-bar')

    var settings = {
      action: '/accounts/import/json/upload',
      allow: '*.json',
      loadstart: function () {
        bar.css('width', '0%').text('0%')
        progressbar.removeClass('uk-hidden')
      },
      progress: function (percent) {
        percent = Math.ceil(percent)
        bar.css('width', percent + '%').text(percent + '%')
      },
      notallowed: function () {
        helpers.UI.showSnackbar('Invalid File Type. Please upload a JSON file.', true)
      },
      error: function (err) {
        console.error(err)
        helpers.UI.showSnackbar('An unknown error occurred. Check Console', true)
      },
      allcomplete: function (response) {
        response = JSON.parse(response)
        if (!response.success) {
          console.log(response)
          helpers.UI.showSnackbar('An Error occurred. Check Console', true)
          return false
        }

        state.jsonUploaded = true
        state.jsonData = response.contents
        state.addedUsers = response.addedUsers
        state.updatedUsers = response.updatedUsers

        $('#json-review-list').val(csvReviewRender(response.addedUsers, response.updatedUsers))

        bar.css('width', '100%').text('100%')

        setTimeout(function () {
          progressbar.addClass('uk-hidden')

          $('#wizard_json').steps('setStep', 1)
        }, 1000)
      }
    }

    UIkit.uploadSelect($('#json-upload-select'), settings)
    UIkit.uploadDrop($('#json-upload-drop'), settings)
  }

  accountsImportPage.wizardLdap = function () {
    var $wizardLdap = $('#wizard_ldap')
    var $connectionForm = $('#wizard_ldap_connection_form')

    var ldapSuccess = false

    var addedUsers = []

    var updatedUsers = []

    if ($wizardLdap.length) {
      $wizardLdap.steps({
        headerTag: 'h3',
        bodyTag: 'section',
        transitionEffect: 'slideLeft',
        trigger: 'change',
        cssClass: 'wizard',
        onInit: function (event, currentIndex) {
          contentHeight($wizardLdap, currentIndex)

          // $wizardLdap.find('.button_next').addClass('disabled').attr('aria-disabled', true).find('a').attr('disabled', true);
          $wizardLdap.find('.button_next > a').html("Connect  <i class='material-icons'>&#xE315;</i>")

          setTimeout(function () {
            $(window).resize()
          }, 100)
        },
        onStepChanging: function (event, currentIndex, newIndex) {
          if (currentIndex === 0 && newIndex === 1) {
            var verifyStatus = $('#wizard_ldap_verify_text')
            var data = $connectionForm.serializeObject()

            $wizardLdap.find('#wizard_ldap_verify_spinner').removeClass('uk-hidden')
            $wizardLdap.find('#wizard_ldap_verify_icon').addClass('uk-hidden')
            $wizardLdap.find('.button_next > a').html("Next  <i class='material-icons'>&#xE315;</i>")
            setTimeout(function () {
              $.ajax({
                url: '/accounts/import/ldap/bind',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(data),
                beforeSend: function () {
                  // $wizardLdap.siblings('.card-spinner').removeClass('uk-hidden');
                },
                error: function (err) {
                  console.error(err)
                  verifyStatus.text(
                    'An error occured while trying to bind to the ldap server. Please check connection settings.'
                  )
                  $wizardLdap.find('#wizard_ldap_verify_spinner').addClass('uk-hidden')
                  $wizardLdap
                    .find('#wizard_ldap_verify_icon')
                    .removeClass('md-color-green uk-hidden')
                    .addClass('md-color-red')
                    .find('> i')
                    .html('&#xE000;')
                  // $wizardLdap.steps('setStep', 0);
                },
                success: function (response) {
                  if (response.success) {
                    ldapSuccess = true
                    verifyStatus.text('Successfully connected to ldap server. Please click next to review accounts.')
                    $wizardLdap.find('#wizard_ldap_verify_spinner').addClass('uk-hidden')
                    $wizardLdap
                      .find('#wizard_ldap_verify_icon')
                      .removeClass('md-color-red uk-hidden')
                      .addClass('md-color-green')
                      .find('> i')
                      .html('&#xE86C;')
                    addedUsers = response.addedUsers
                    updatedUsers = response.updatedUsers

                    $('#ldap-review-list').val(ldapReviewRender(response.addedUsers, response.updatedUsers))
                  } else {
                    verifyStatus.text(
                      'An error occured while trying to bind to the ldap server. Please check connection settings.'
                    )
                    $wizardLdap.find('#wizard_ldap_verify_spinner').addClass('uk-hidden')
                    $wizardLdap
                      .find('#wizard_ldap_verify_icon')
                      .removeClass('md-color-green uk-hidden')
                      .addClass('md-color-red')
                      .find('> i')
                      .html('&#xE000;')
                  }
                },
                complete: function () {
                  setTimeout(function () {
                    $wizardLdap.siblings('.card-spinner').addClass('uk-hidden')
                  }, 800)
                }
              })
            }, 500)
          }

          if (newIndex === 0) {
            ldapSuccess = false
          }

          if (currentIndex === 1 && newIndex === 0) {
            // Verify to Connection
            $wizardLdap.find('.button_next > a').html("Connect  <i class='material-icons'>&#xE315;</i>")
          }

          if (currentIndex === 1 && newIndex === 2) {
            // Verify to Review
            if (!ldapSuccess) return false
          }

          // if (newIndex === 3) {
          //
          //     // $wizardLdap.find('.button_previous').addClass('disabled').attr('aria-disabled', true);
          //     // $wizardLdap.find('.button_finish').addClass('disabled').attr('aria-disabled', true);
          // }

          return true
        },
        onStepChanged: function (event, currentIndex) {
          if (currentIndex === 3) {
            // Last step Disable all until done.
            $wizardLdap.find('.steps ul li').each(function () {
              $(this).addClass('disabled')
            })
            $wizardLdap.find('.actions ul li').addClass('disabled')
            $wizardLdap
              .find('.button_previous')
              .addClass('disabled')
              .attr('aria-disabled', true)

            var ldapStatusBox = $('#ldap-import-status-box')
            var ldapStatusUL = ldapStatusBox.find('ul')
            ldapStatusUL.append('<li>Starting import...</li>')
            disableUIElements()

            // send data
            setTimeout(function () {
              socket.accountsImporter.sendAccountData('ldap', addedUsers, updatedUsers)
            }, 1000)
          }

          // Disable all future steps when moving backwards
          $('.steps .current')
            .nextAll()
            .removeClass('done')
            .addClass('disabled')

          contentHeight($wizardLdap, currentIndex)
        },
        onFinished: function () {
          location.href = '/accounts'
        }
      })
    }
  }

  function disableUIElements () {
    // $(window).on('beforeunload', function() {
    //     return 'Are you sure? We are still importing users.';
    // });

    $('.sidebar').css({ width: 0 })
    $('.side-nav-bottom-panel').css({ width: 0 })
    $('#page-content').css('margin-left', 0)
    $('.top-menu').css({ display: 'none' })
    $('.js-wizard-select-wrapper').css({ display: 'none' })
    $('.js-wizard-cancel').each(function () {
      $(this).css({ display: 'none' })
    })
  }

  function ldapReviewRender (addedUsers, updatedUsers) {
    var addedUsersTemplate = []
    var updatedUsersTemplate = []

    if (addedUsers === null) addedUsers = []
    if (updatedUsers === null) updatedUsers = []

    for (var i = 0; i < addedUsers.length; i++) {
      addedUsersTemplate.push(
        addedUsers[i].sAMAccountName +
          ' | action=add username=' +
          addedUsers[i].sAMAccountName +
          ' name=' +
          addedUsers[i].displayName +
          ' email=' +
          addedUsers[i].mail +
          ' title=' +
          addedUsers[i].title
      )
    }

    for (var k = 0; k < updatedUsers.length; k++) {
      updatedUsersTemplate.push(
        updatedUsers[k].username +
          ' | action=update username=' +
          updatedUsers[k].username +
          ' name=' +
          updatedUsers[k].fullname +
          ' email=' +
          updatedUsers[k].email +
          ' title=' +
          updatedUsers[k].title
      )
    }

    var sep = []

    if (addedUsersTemplate.length > 0) {
      sep.push('----------------')
    }

    return _.union(addedUsersTemplate, sep, updatedUsersTemplate).join('\r')
  }

  function csvReviewRender (addedUsers, updatedUsers) {
    var addedUsersTemplate = []
    var updatedUsersTemplate = []

    if (addedUsers === null) addedUsers = []
    if (updatedUsers === null) updatedUsers = []

    for (var i = 0; i < addedUsers.length; i++) {
      addedUsersTemplate.push(
        addedUsers[i].username +
          ' | action=add username=' +
          addedUsers[i].username +
          ' name=' +
          addedUsers[i].fullname +
          ' email=' +
          addedUsers[i].email +
          ' title=' +
          addedUsers[i].title
      )
    }

    for (var k = 0; k < updatedUsers.length; k++) {
      updatedUsersTemplate.push(
        updatedUsers[k].username +
          ' | action=update username=' +
          updatedUsers[k].username +
          ' name=' +
          updatedUsers[k].fullname +
          ' email=' +
          updatedUsers[k].email +
          ' title=' +
          updatedUsers[k].title
      )
    }

    var sep = []

    if (addedUsersTemplate.length > 0) {
      sep.push('----------------')
    }

    return _.union(addedUsersTemplate, sep, updatedUsersTemplate).join('\r')
  }

  function contentHeight (thisWizard, step) {
    var thisHeight = $(thisWizard)
      .find('.step-' + step)
      .actual('outerHeight')
    $(thisWizard)
      .children('.content')
      .velocity({ height: thisHeight }, { duration: 140, easing: [0.215, 0.61, 0.355, 1] })
  }

  return accountsImportPage
})
