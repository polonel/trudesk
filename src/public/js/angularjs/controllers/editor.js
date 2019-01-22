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
  'history'
], function (angular, _, $, socket, UIKit, helpers, grapesjs, grapesjsEmail) {
  return angular
    .module('trudesk.controllers.editor', [])
    .controller('editorController', function ($scope, $window, $http, $cookies, $timeout, $log) {
      $(document).ready(function () {
        var editor = grapesjs.init({
          container: '#web-editor',
          plugins: ['gjs-preset-newsletter'],
          pluginOpts: {
            'gjs-preset-newsletter': {
              modalTitleImport: 'Import template'
            }
          },
          storageManager: { type: null },
          panels: {}
        })

        editor.addComponents(
          '<table class="main-body" style="box-sizing: border-box; min-height: 150px; padding: 5px;width: 100%; height: 100%;" width="100%" height="100%">\n' +
            '    <tbody style="box-sizing: border-box;">\n' +
            '    <tr class="row" style="box-sizing: border-box; vertical-align: top;" valign="top">\n' +
            '        <td class="main-body-cell" style="box-sizing: border-box; border-collapse: separate; font-family: Heebo, serif; font-size: 9px;">\n' +
            '            <table class="container" style="box-sizing: border-box; font-family: Heebo, serif; min-height: 300px; padding: 5px;margin: auto;height: 0px; width: 90%; max-width: 550px;" width="90%" height="0">\n' +
            '                <tbody style="box-sizing: border-box;">\n' +
            '                <tr style="box-sizing: border-box;">\n' +
            '                    <td class="container-cell" style="box-sizing: border-box; vertical-align: top; font-size: medium; border: 1px solid #cccccc; border-collapse: separate; padding: 0 0 50px;background-color: #ffffff; border-radius: 5px 5px 0 0; text-align: center;" valign="top" bgcolor="#ffffff" align="center">\n' +
            '                        <table class="c1766" style="box-sizing: border-box; margin: 0 auto 10px 0;padding: 5px;width: 100%; min-height: 70px; border-radius: 5px 5px 0 0; border-collapse: separate; background-color: #eee;" width="100%" bgcolor="#eee">\n' +
            '                            <tbody style="box-sizing: border-box;">\n' +
            '                            <tr style="box-sizing: border-box;">\n' +
            '                                <td class="cell c1776" style="box-sizing: border-box; width: 70%; vertical-align: middle; text-align: center;" width="70%" valign="middle" align="center">\n' +
            '                                    <img src="https://forum.trudesk.io/uploads/default/original/1X/d74e1a34ad78927921eaf0a1b1c05df17b04f7a3.png" class="c6107" style="box-sizing: border-box; color: black; min-height: 30px; height: 30px; margin: 0 auto 0 auto; width: auto; text-align: center;" height="30">\n' +
            '                                </td>\n' +
            '                            </tr>\n' +
            '                            </tbody>\n' +
            '                        </table>\n' +
            '                        <table class="c5785" style="box-sizing: border-box; height: 150px; margin: 0 auto 10px auto; padding: 5px 5px 5px 5px; width: 100%;" width="100%" height="150">\n' +
            '                            <tbody style="box-sizing: border-box;">\n' +
            '                            <tr style="box-sizing: border-box;">\n' +
            '                                <td class="c5809" style="box-sizing: border-box; font-size: 12px; font-weight: 300; vertical-align: top; color: rgb(111, 119, 125); margin: 0; padding: 0; text-align: center;" valign="top" align="center">\n' +
            '                                    <div class="c5909" style="box-sizing: border-box; padding: 10px; font-size: 22px; font-weight: 600; text-align: center;">New Ticket Created\n' +
            '                                    </div>\n' +
            '                                    <div class="c6001" style="box-sizing: border-box; padding: 10px; margin: 0 0 25px 0;">A new ticket has been created by\n' +
            '                                        <strong style="box-sizing: border-box;">{{ticket.owner.fullname}}</strong>. Ticket details are below.\n' +
            '                                        <br style="box-sizing: border-box;">\n' +
            '                                    </div>\n' +
            '                                    <table class="c8348" style="text-align: left; box-sizing: border-box; height: 150px; margin: 0 auto 10px auto; padding: 5px 5px 5px 5px; width: 100%;" width="100%" height="150">\n' +
            '                                        <tbody style="box-sizing: border-box;">\n' +
            '                                        <tr style="box-sizing: border-box;">\n' +
            '                                            <td class="c8372" style="text-align: left; box-sizing: border-box; font-size: 12px; font-weight: 300; vertical-align: top; color: rgb(111, 119, 125); margin: 0; padding: 5px 5px 5px 5px; width: 55px;" width="55" valign="top">\n' +
            '                                                {{#if ticket.owner.image}}\n' +
            '                                                    <img src="//{{base_url}}/uploads/users/{{ticket.owner.image}}" class="c8604" style="box-sizing: border-box; color: black; width: 50px; height: 50px; border-radius: 25px 25px 25px 25px; border: 1px solid #cccccc;" width="50" height="50">\n' +
            '                                                {{else}}\n' +
            '                                                    <img src="//{{base_url}}/uploads/users/defaultProfile.jpg" class="c8604" style="box-sizing: border-box; color: black; width: 50px; height: 50px; border-radius: 25px 25px 25px 25px; border: 1px solid #cccccc;" width="50" height="50">\n' +
            '                                                {{/if}}\n' +
            '                                            </td>\n' +
            '                                            <td class="c8381" style="text-align: left; box-sizing: border-box; font-size: 12px; font-weight: 300; vertical-align: top; color: rgb(111, 119, 125); margin: 0; padding: 0; width: 100%; border-collapse: separate;" width="100%" valign="top">\n' +
            '                                                <div class="c9552" style="box-sizing: border-box; padding: 3px 3px 3px 10px; font-size: 16px; font-weight: 700;">{{ticket.subject}}\n' +
            '                                                </div>\n' +
            '                                                <a href="mailto:{{ticket.owner.email}}" class="c9151" style="text-align: left; box-sizing: border-box; color: #E74C3C; padding: 0 0 0 10px; text-decoration: none;">{{ticket.owner.fullname}} &lt;{{ticket.owner.email}}&gt;</a>\n' +
            '                                                <div class="c10139" style="text-align: left; box-sizing: border-box; padding: 10px;">{{{ticket.issue}}}\n' +
            '                                                </div>\n' +
            '                                            </td>\n' +
            '                                        </tr>\n' +
            '                                        </tbody>\n' +
            '                                    </table>\n' +
            '                                </td>\n' +
            '                            </tr>\n' +
            '                            </tbody>\n' +
            '                        </table>\n' +
            '                        <table class="c7208" style="box-sizing: border-box; height: 150px; margin: 0 auto 10px auto; padding: 5px 5px 5px 5px; width: 100%;" width="100%" height="150">\n' +
            '                            <tbody style="box-sizing: border-box;">\n' +
            '                            <tr style="box-sizing: border-box;">\n' +
            '                                <td class="c7232" style="box-sizing: border-box; font-size: 12px; font-weight: 300; vertical-align: top; color: rgb(111, 119, 125); margin: 0; padding: 20px 0 0 0; text-align: center;" valign="top" align="center">\n' +
            '                                    <a href="{{base_url}}/tickets/{{ticket.uid}}" class="button" style="text-decoration: none; box-sizing: border-box; font-size: 16px; padding-top: 10px; padding-left: 20px; padding-right: 20px; padding-bottom: 10px; color: rgb(255, 255, 255); text-align: center; border-radius: 3px;background-color: #e74c3c; border-collapse: separate; font-weight: 700; margin: 0 0 0 0;">View Ticket #{{ticket.uid}}</a>\n' +
            '                                </td>\n' +
            '                            </tr>\n' +
            '                            </tbody>\n' +
            '                        </table>\n' +
            '                    </td>\n' +
            '                </tr>\n' +
            '                </tbody>\n' +
            '            </table>\n' +
            '        </td>\n' +
            '    </tr>\n' +
            '    </tbody>\n' +
            '</table>\n' +
            '</body>\n' +
            '</html>',
          {}
        )
      })
    })
})
