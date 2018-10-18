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

define('pages/settings', [
    'jquery',
    'underscore',
    'modules/helpers',
    'uikit',
    'history'

], function($) {
    var settingsPage = {};

    settingsPage.init = function(callback) {
        $(document).ready(function() {
            var testPage = $('#page-content').find('div[data-page="settings"]');
            if (testPage.length < 1) {
                if (typeof callback === 'function')
                    return callback();

                return false;
            }

            if (typeof callback === 'function')
                return callback();
        });
    };

    return settingsPage;
});