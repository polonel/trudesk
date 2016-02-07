/*!
 * SnackBar v0.1.0
 * http://polonel.com/Snackbar
 *
 * Copyright 2016 Chris Brame and other contributors
 * Released under the MIT license
 * https://github.com/polonel/SnackBar/blob/master/LICENSE
 */

(function (window, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return factory.apply(window);
        });
    }

    // Node.JS
    else if (typeof exports === 'object') {
        module.exports = factory.call(window);
    }

    // Browser
    else {
        window.SnackBar = factory.call(window);
    }
})(typeof global === 'object' ? global : this, function () {
    'use strict';

    var SnackBar = SnackBar || {};
    SnackBar.current = null;
    var $defaults = {

        text: 'Default Text',
        textColor: '#ffffff',

        width: 'auto',

        showActionButton: true,
        actionText: 'Dismiss',
        actionTextColor: '#4caf50',

        backgroundColor: '#323232',

        pos: 'bottom-left',

        duration: 5000,

        customClass: '',

        onActionClick: function (element) {
            element.style.opacity = 0;
        }
    };

    SnackBar.show = function ($options) {
        var options = Extend(true, $defaults, $options);

        if (SnackBar.current) {
            SnackBar.current.style.opacity = 0;
            setTimeout(function () {
                var $parent = this.parentElement;
                if ($parent) // possible null if too many/fast SnackBars
                    $parent.removeChild(this);
            }.bind(SnackBar.current), 500);
        }

        SnackBar.snackbar = document.createElement('div');
        SnackBar.snackbar.className = 'snackbar-container ' + options.customClass;
        SnackBar.snackbar.style.width = options.width;
        var $p = document.createElement('p');
        $p.style.margin = 0;
        $p.style.padding = 0;
        $p.style.color = options.textColor;
        $p.style.fontSize = '14px';
        $p.style.fontWeight = 300;
        $p.style.lineHeight = '1em';
        $p.innerHTML = options.text;
        SnackBar.snackbar.appendChild($p);
        SnackBar.snackbar.style.background = options.backgroundColor;
        if (options.showActionButton) {
            var actionButton = document.createElement('button');
            actionButton.className = 'action';
            actionButton.innerHTML = options.actionText;
            actionButton.style.color = options.actionTextColor;
            actionButton.addEventListener('click', function () {
                options.onActionClick(SnackBar.snackbar);
            });
            SnackBar.snackbar.appendChild(actionButton);
        }

        setTimeout(function () {
            if (SnackBar.current === this) {
                SnackBar.current.style.opacity = 0;
            }

        }.bind(SnackBar.snackbar), $defaults.duration);

        SnackBar.snackbar.addEventListener('transitionend', function (event, elapsed) {
            if (event.propertyName === 'opacity' && this.style.opacity === 0) {
                this.parentElement.removeChild(this);
                if (SnackBar.current === this) {
                    SnackBar.current = null;
                }
            }
        }.bind(SnackBar.snackbar));

        SnackBar.current = SnackBar.snackbar;
        document.body.style.overflow = 'hidden';

        if (options.pos === 'top-left' || options.pos === 'top-center' || options.pos === 'top-right')
            SnackBar.snackbar.style.top = '-100px';

        document.body.appendChild(SnackBar.snackbar);
        var $bottom = getComputedStyle(SnackBar.snackbar).bottom;
        var $top = getComputedStyle(SnackBar.snackbar).top;
        SnackBar.snackbar.style.opacity = 1;
        SnackBar.snackbar.className = 'snackbar-container ' + options.customClass + ' snackbar-pos ' + options.pos;
        if (options.pos === 'top-left' || options.pos === 'top-right')
            SnackBar.snackbar.style.top = 0;
        else if (options.pos === 'top-center')
            SnackBar.snackbar.style.top = '25px';
        else if (options.pos === 'bottom-center')
            SnackBar.snackbar.style.bottom = '-25px';

        setTimeout(function () {
            document.body.style.overflow = 'auto';
        }, 500);
    };

    SnackBar.close = function () {
        if (SnackBar.current)
            SnackBar.current.style.opacity = 0;
    };

    // Pure JS Extend
    // http://gomakethings.com/vanilla-javascript-version-of-jquery-extend/
    var Extend = function () {

        var extended = {};
        var deep = false;
        var i = 0;
        var length = arguments.length;

        if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
            deep = arguments[0];
            i++;
        }

        var merge = function (obj) {
            for (var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                        extended[prop] = extend(true, extended[prop], obj[prop]);
                    } else {
                        extended[prop] = obj[prop];
                    }
                }
            }
        };

        for (; i < length; i++) {
            var obj = arguments[i];
            merge(obj);
        }

        return extended;

    };

    return SnackBar;
});