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
 *  Updated:    1/20/19 10:03 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define([
  'angular',
  'underscore',
  'jquery',
  'modules/socket',
  'uikit',
  'modules/helpers',
  'grapesjs',
  'grapesjsEmail',
  'handlebars',
  'moment',
  'history'
], function (angular, _, $, socket, UIKit, helpers, grapesjs, grapesjsEmail, Handlebars, moment) {
  return angular
    .module('trudesk.controllers.editor', [])
    .controller('editorController', function ($scope, $window, $http, $cookies, $timeout, $log) {
      $timeout(function () {
        Handlebars.registerHelper('formatDate', function (date, format) {
          return moment
            .utc(date)
            .tz(helpers.getTimezone())
            .format(format)
        })

        var longDateFormat = helpers.getLongDateFormat()
        var timeFormat = helpers.getTimeFormat()
        var longDateWithTimeFormat = longDateFormat + ' ' + timeFormat

        $(document).ready(function () {
          var template = $scope.template
          var editor = grapesjs.init({
            container: '#web-editor',
            plugins: ['gjs-preset-newsletter'],
            pluginOpts: {
              'gjs-preset-newsletter': {
                modalTitleImport: 'Import template'
              }
            },
            canvas: {
              // Workaround for a bug preventing links from being deleted
              // https://github.com/artf/grapesjs/issues/1699
              notTextable: ['button', 'a', 'input[type=checkbox]', 'input[type=radio]']
            },
            storageManager: {
              type: 'remote',
              autosave: false,
              urlStore: '/api/v1/editor/save',
              urlLoad: '/api/v1/editor/load/' + template,
              contentTypeJson: true,
              storeStyles: false,
              storeComponents: false,
              params: { template: template }
            },
            assetManager: {
              upload: '/api/v1/editor/assets/upload',
              multiUpload: false
            },
            commands: {
              defaults: [
                {
                  id: 'store-data',
                  run: function (editor, sender) {
                    sender.set('active', 0)
                    editor.store()
                  }
                }
              ]
            }
          })

          // Make sure the editor is really fresh
          editor.DomComponents.clear()
          editor.CssComposer.clear()
          editor.UndoManager.clear()
          editor.setComponents()
          editor.setStyle()

          var pfx = editor.getConfig().stylePrefix
          var modal = editor.Modal
          var cmdm = editor.Commands
          var codeViewer = editor.CodeManager.getViewer('CodeMirror').clone()
          var pnm = editor.Panels
          var container = document.createElement('div')
          var btnEdit = document.createElement('button')

          codeViewer.set({
            codeName: 'htmlmixed',
            readOnly: 0,
            theme: 'hopscotch',
            autoBeautify: true,
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineWrapping: true,
            styleActiveLine: true,
            smartIndent: true,
            indentWithTabs: true
          })

          btnEdit.innerHTML = 'Edit'
          btnEdit.className = pfx + 'btn-prim ' + pfx + 'btn-import'
          btnEdit.onclick = function () {
            var code = codeViewer.editor.getValue()
            editor.DomComponents.getWrapper().set('content', '')
            editor.setComponents(code.trim())
            modal.close()
          }

          cmdm.add('html-edit', {
            run: function (editor, sender) {
              sender && sender.set('active', 0)
              var viewer = codeViewer.editor
              modal.setTitle('Edit code')
              if (!viewer) {
                var txtarea = document.createElement('textarea')
                container.appendChild(txtarea)
                container.appendChild(btnEdit)
                codeViewer.init(txtarea)
                viewer = codeViewer.editor
              }
              var InnerHtml = editor.getHtml()
              var Css = editor.getCss()
              modal.setContent('')
              modal.setContent(container)
              codeViewer.setContent('<style>' + Css + '</style>' + InnerHtml)
              modal.open()
              viewer.refresh()
            }
          })

          // pnm.addButton('options', [
          //   {
          //     id: 'edit',
          //     className: 'fa fa-edit',
          //     command: 'html-edit',
          //     attributes: {
          //       title: 'Edit'
          //     }
          //   }
          // ])

          var comps = editor.DomComponents
          var defaultType = comps.getType('default')
          var defaultModel = defaultType.model

          var context = {
            ticket: {
              owner: {},
              priority: {
                name: 'Normal',
                htmlColor: 'green'
              },
              issue: '{{{ticket.issue}}}',
              comments: [
                {
                  date: new Date(),
                  owner: {
                    fullname: '{{FULLNAME}}',
                    email: '{{EMAIL}}'
                  },
                  comment: '{{COMMENT TEXT}}'
                },
                {
                  date: new Date(),
                  owner: {
                    fullname: '{{FULLNAME}}',
                    email: '{{EMAIL}}'
                  },
                  comment: '{{COMMENT TEXT}}'
                }
              ]
            }
          }

          comps.addType('handlebars', {
            model: defaultModel.extend(
              {
                defaults: Object.assign({}, defaultModel.prototype.defaults, {
                  tagName: 'handlebars',
                  droppable: true,
                  editable: true
                }),
                toHTML: function () {
                  // If I have components I'll follow the original method
                  // otherwise return the template
                  if (this.components().length) {
                    return defaultModel.prototype.toHTML.apply(this, arguments)
                  } else {
                    return this.get('components')
                  }
                }
              },
              {
                // isComponent is mandatory when you define new components
                isComponent: function (el) {
                  if (el.tagName === 'HANDLEBARS') return { type: 'handlebars' }
                }
              }
            ),
            view: defaultType.view.extend({
              onRender: function () {
                var $el = this.$el
                var model = this.model
                var html = model.toHTML()
                var template = Handlebars.compile(html)
                $el.empty()
                $el.append(template(context))
                return this
              }
            })
          })

          editor.BlockManager.add('profilePicture', {
            label: 'Ticket Owner-Profile Pic',
            category: 'Ticket Components',
            attributes: { class: 'fa fa-image' },
            content: {
              type: 'handlebars',
              components:
                '<span>\n' +
                '{{#if ticket.owner.image}}\n' +
                '<div style="width: 50px; height: 50px;"><img src="{{base_url}}/uploads/users/{{ticket.owner.image}}" style="box-sizing: border-box; width: 50px; height: 50px; border-radius: 25px 25px 25px 25px;" width="50" height="50"></div>\n' +
                '{{else}}\n' +
                '<img src="{{base_url}}/uploads/users/defaultProfile.jpg" style="box-sizing: border-box; width: 50px; height: 50px; border-radius: 25px 25px 25px 25px;" width="50" height="50">\n' +
                '{{/if}}\n' +
                '</span>\n'
            }
          })

          editor.BlockManager.add('ticket-comments', {
            label: 'Ticket Comments Loop',
            category: 'Ticket Components',
            attributes: { class: 'fa fa-comment' },
            content: {
              type: 'handlebars',
              style: { width: '100%' },
              components:
                '<div style="width: 100%;">\n' +
                '{{#each ticket.comments}}' +
                '<table style="box-sizing: border-box; margin: 0 auto 15px auto; padding: 5px 5px 5px 5px; width: 100%; border-bottom: 1px solid #ccc;" width="100%" height="auto">\n' +
                '                  <tbody style="box-sizing: border-box;">\n' +
                '                    <tr style="box-sizing: border-box;">\n' +
                '                      <td style="box-sizing: border-box; padding: 0; margin: 0; vertical-align: top; width: 65px;" width="65" valign="top">\n' +
                '                        <span style="box-sizing: border-box;">\n' +
                '                          {{#if owner.image}}\n' +
                '                          <img src="{{base_url}}/uploads/users/{{owner.image}}" style="box-sizing: border-box; width: 50px; height: 50px; border-radius: 25px 25px 25px 25px;" width="50" height="50">\n' +
                '                          {{else}}\n' +
                '                          <img src="{{base_url}}/uploads/users/defaultProfile.jpg" style="box-sizing: border-box; width: 50px; height: 50px; border-radius: 25px 25px 25px 25px;" width="50" height="50">\n' +
                '                          {{/if}}\n' +
                '                        </span>\n' +
                '                      </td>\n' +
                '                      <td style="box-sizing: border-box; padding: 0; margin: 0; vertical-align: top; width: auto; text-align: left;" valign="top" align="left">\n' +
                '                        <div style="box-sizing: border-box; padding: 3px 10px; font-family: Helvetica, serif; font-size: 14px; font-weight: 600; color: rgb(111, 119, 125); text-align: left;">{{owner.fullname}}\n' +
                '                        </div>\n' +
                '                        <a href="mailto:{{email}}" style="box-sizing: border-box; color: rgb(231, 76, 60); font-size: 13px; padding: 0 0 0 0; margin: 0 0 0 10px;">{{owner.email}}</a>\n' +
                '                         <div style="box-sizing: border-box; margin-left: 10px; margin-top: 3px; display: block; font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: rgb(111, 119, 125); width: 100%;">{{formatDate date "' +
                longDateWithTimeFormat +
                '"}}</div>\n' +
                '                        <div style="box-sizing: border-box; margin-top: 10px; padding: 3px 10px; font-family: Helvetica, serif; font-size: 14px; color: #666666;">{{{comment}}}\n' +
                '                        </div>\n' +
                '                      </td>\n' +
                '                    </tr>\n' +
                '                  </tbody>\n' +
                '                </table>\n' +
                '{{/each}}\n' +
                '</div>'
            }
          })

          editor.BlockManager.add('email-with-fullname', {
            label: 'Owner Fullname - Email',
            category: 'Ticket Components',
            attributes: { class: 'fa fa-envelope' },
            content: {
              editable: true,
              type: 'link',
              style: {
                color: 'rgb(231, 76, 60)',
                'font-size': '13px',
                display: 'inline-block'
              },
              attributes: { href: 'mailto:{{ticket.owner.email}}' },
              content: '{{ticket.owner.fullname}} - {{ticket.owner.email}}'
            }
          })

          editor.BlockManager.add('view-ticket-button', {
            label: 'View Ticket Button',
            category: 'Ticket Components',
            attributes: { class: 'fa fa-hand-pointer-o' },
            content: {
              type: 'link',
              style: {
                padding: '10px 20px',
                display: 'inline-block',
                color: 'rgb(255, 255, 255)',
                'font-size': '16px',
                'font-weight': 'bold',
                'text-align': 'center',
                'text-decoration': 'none',
                background: 'rgb(231, 76, 60)',
                'border-radius': '3px'
              },
              attributes: { href: '{{base_url}}/tickets/{{ticket.uid}}' },
              content: 'View Ticket #{{ticket.uid}}'
            }
          })

          pnm.addButton('options', {
            id: 'save',
            className: 'fa fa-save',
            command: 'store-data',
            attributes: { title: 'Save' }
          })

          $http.get('/api/v1/editor/assets').then(
            function (res) {
              editor.AssetManager.add(res.data.assets)
            },
            function (err) {
              $log.error(err)
              helpers.UI.showSnackbar(err.error, true)
            }
          )

          editor.AssetManager.addType('image', {
            view: {
              onRemove: function (e) {
                var model = this.model

                UIKit.modal.confirm(
                  'Are you sure you want to delete asset?',
                  function () {
                    $http
                      .post(
                        '/api/v1/editor/assets/remove',
                        {
                          fileUrl: model.id
                        },
                        {
                          headers: { 'Content-Type': 'application/json' }
                        }
                      )
                      .then(
                        function () {
                          model.collection.remove(model)
                        },
                        function (err) {
                          $log.error(err)
                          helpers.UI.showSnackbar(err.error, true)
                        }
                      )
                  },
                  {
                    labels: { Ok: 'Yes', Cancel: 'No' },
                    confirmButtonClass: 'md-btn-danger'
                  }
                )
              }
            }
          })

          editor.on('asset:upload:error', function (err) {
            var errObj = angular.fromJson(err)
            $log.error(errObj)
            helpers.UI.showSnackbar('Error: ' + errObj.error.message, true)
          })

          editor.on('storage:start:store', function (objectToStore) {
            objectToStore.assets = '[]'
            objectToStore.fullHtml =
              '<!DOCTYPE html>\n' +
              '<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">\n' +
              '<head>\n' +
              '    <meta charset="utf-8">\n' +
              '    <meta name="viewport" content="width=device-width">\n' +
              '    <meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
              '    <meta name="x-apple-disable-message-reformatting">\n' +
              '</head>\n' +
              '<body>' +
              editor.runCommand('gjs-get-inlined-html') +
              '</body>\n' +
              '</html>'
          })

          editor.on('storage:end:store', function (result) {
            if (result.success) {
              helpers.UI.showSnackbar('Saved template successfully.')
            }
          })

          editor.on('storage:error', function (err) {
            var errObj = angular.fromJson(err)
            $log.error(errObj)
            helpers.UI.showSnackbar('Error: ' + errObj.error.message, true)
            if (errObj.invalid) {
              $('#web-editor').remove()
              $('#web-editor-invalid-notification')
                .removeClass('hide')
                .parent()
                .css('position', 'relative')
              setTimeout(function () {
                $window.location.href = '/settings/mailer'
              }, 3000)
            }
          })
        })
      }, 0)
    })
})
