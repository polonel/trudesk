var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../../../typings/tsd.d.ts" />
/*global $ */
var LiveExample;
(function (LiveExample) {
    /**
     * @abstract
     * @class Option
     *
     * Base class for options that can be modified in the live example.
     */
    var Option = (function () {
        /**
         * @constructor
         * @param {OptionCfg} cfg The configuration options for this class,
         *   specified in an Object (map).
         */
        function Option(cfg) {
            this.optionName = cfg.name;
            this.optionDescription = cfg.description;
            this.containerId = 'option-' + this.optionName.replace(/\./g, '-'); // ex: 'truncate.length' -> 'trunctate-length'
            this.$containerEl = $('#' + this.containerId);
            this.changeCallbacks = [];
        }
        /**
         * @protected
         * @return {String}
         */
        Option.prototype.getApiDocAnchor = function () {
            return "<a href=\"" + this.getApiDocLink() + "\" target=\"autolinkerDocs\">" + this.optionName + "</a>";
        };
        /**
         * @protected
         * @return {String}
         */
        Option.prototype.getApiDocLink = function () {
            var configName = this.optionName.match(/[^.]+/)[0]; // ex: 'urls.schemeMatches' -> 'urls'
            return "http://gregjacobs.github.io/Autolinker.js/docs/#!/api/Autolinker-cfg-" + configName;
        };
        /**
         * Registers a callback to call when the option is changed.
         *
         * @param {Function} callbackFn
         * @chainable
         */
        Option.prototype.onChange = function (callbackFn) {
            this.changeCallbacks.push(callbackFn);
            return this;
        };
        /**
         * Calls all 'change' callbacks as a result of the option being changed.
         *
         * @protected
         */
        Option.prototype.fireChange = function () {
            this.changeCallbacks.forEach(function (cb) { return cb(); }); // call all 'change' callbacks
        };
        return Option;
    }());
    LiveExample.Option = Option;
})(LiveExample || (LiveExample = {}));
/*global $, Option */
var LiveExample;
(function (LiveExample) {
    /**
     * @class CheckboxOption
     *
     * A checkbox option for the live example.
     */
    var CheckboxOption = (function (_super) {
        __extends(CheckboxOption, _super);
        /**
         * @constructor
         * @param {CheckboxOptionCfg} cfg The configuration options for this
         *   class, specified in an Object (map).
         */
        function CheckboxOption(cfg) {
            _super.call(this, cfg);
            /**
             * @cfg {Boolean} [defaultValue=false]
             *
             * `true` to check the checkbox by default.
             */
            this.defaultValue = false;
            this.defaultValue = cfg.defaultValue || false;
            this.$containerEl.html(this.generateHtml());
            this.$checkboxEl = this.$containerEl.find(':checkbox').on('change', this.updateDisplayEl.bind(this));
            this.$valueDisplayEl = this.$containerEl.find('#' + this.containerId + '-value');
        }
        /**
         * @private
         * @return {string}
         */
        CheckboxOption.prototype.generateHtml = function () {
            var containerId = this.containerId, optionDescription = this.optionDescription, defaultValue = this.defaultValue, checkboxId = containerId + '-checkbox';
            return "\n\t\t\t\t<input type=\"checkbox\" id=\"" + checkboxId + "\" " + (defaultValue ? 'checked' : '') + ">\n\t\t\t\t<label for=\"" + checkboxId + "\">" + optionDescription + "</label>\n\t\t\t\t(<code>" + this.getApiDocAnchor() + ": <span id=\"" + containerId + "-value\">" + defaultValue + "</span></code>)\n\t\t\t";
        };
        /**
         * @private
         */
        CheckboxOption.prototype.updateDisplayEl = function () {
            this.$valueDisplayEl.html(this.getValue() + '');
            this.fireChange();
        };
        /**
         * @return {Boolean}
         */
        CheckboxOption.prototype.getValue = function () {
            return this.$checkboxEl.prop('checked');
        };
        return CheckboxOption;
    }(LiveExample.Option));
    LiveExample.CheckboxOption = CheckboxOption;
})(LiveExample || (LiveExample = {}));
/*global $, Option */
var LiveExample;
(function (LiveExample) {
    /**
     * @class RadioOption
     *
     * A radio option for the live example.
     */
    var RadioOption = (function (_super) {
        __extends(RadioOption, _super);
        /**
         * @constructor
         * @param {Object} cfg The configuration options for this class, specified
         *   in an Object (map).
         */
        function RadioOption(cfg) {
            _super.call(this, cfg);
            /**
             * @cfg {*} [defaultValue=false]
             *
             * The value in {@link #options} to select by default.
             */
            this.defaultValue = false;
            this.options = [].concat(cfg.options);
            this.defaultValue = cfg.defaultValue || false;
            this.$containerEl.html(this.generateHtml());
            this.$valueDisplayEl = this.$containerEl.find('#' + this.containerId + '-value');
            this.$containerEl
                .find(':radio').on('change', this.updateDisplayEl.bind(this));
        }
        /**
         * @private
         * @return {string}
         */
        RadioOption.prototype.generateHtml = function () {
            var containerId = this.containerId, optionDescription = this.optionDescription, defaultValue = this.defaultValue, radiosHtml = this.createRadiosHtml(this.options, defaultValue);
            return "\n\t\t\t\t<label>" + optionDescription + ": </label>\n\t\t\t\t(<code>" + this.getApiDocAnchor() + ": <span id=\"" + containerId + "-value\">" + this.formatValueForDisplay(defaultValue) + "</span></code>)\n\t\t\t\t<div class=\"pl10\">" + radiosHtml.join('<br>') + "</div>\n\t\t\t";
        };
        /**
         * Creates an array of '<input type="radio">' HTML tags.
         *
         * @private
         * @param {Array} options
         * @param {*} defaultValue
         * @return {String[]}
         */
        RadioOption.prototype.createRadiosHtml = function (options, defaultValue) {
            var _this = this;
            return options.map(function (option, idx) {
                return "\n\t\t\t\t\t<input type=\"radio\" id=\"" + _this.containerId + "-radio-" + option + "\" name=\"" + _this.containerId + "-radio\" data-option-idx=\"" + idx + "\" " + (option === _this.defaultValue ? 'checked' : '') + "> \n\t\t\t\t\t<label for=\"" + _this.containerId + "-radio-" + option + "\">" + option + "</label>\n\t\t\t\t";
            });
        };
        /**
         * @private
         */
        RadioOption.prototype.updateDisplayEl = function () {
            var displayValue = this.formatValueForDisplay(this.getValue());
            this.$valueDisplayEl.html(displayValue);
            this.fireChange();
        };
        /**
         * @return {Boolean}
         */
        RadioOption.prototype.getValue = function () {
            var optionIdx = this.$containerEl.find(':radio:checked').data('option-idx');
            return this.options[optionIdx];
        };
        /**
         * Formats an option value for display.
         *
         * Strings are surrounded with quotes, booleans and numbers are returned
         * as strings as-is.
         *
         * @param {*} value
         */
        RadioOption.prototype.formatValueForDisplay = function (value) {
            return (typeof value === 'string') ? "'" + value + "'" : (value + '');
        };
        return RadioOption;
    }(LiveExample.Option));
    LiveExample.RadioOption = RadioOption;
})(LiveExample || (LiveExample = {}));
/*global $, Option */
var LiveExample;
(function (LiveExample) {
    /**
     * @class TextOption
     *
     * A text field option for the live example.
     */
    var TextOption = (function (_super) {
        __extends(TextOption, _super);
        /**
         * @constructor
         * @param {TextOptionCfg} cfg The configuration options for this class,
         *   specified in an Object (map).
         */
        function TextOption(cfg) {
            _super.call(this, cfg);
            /**
             * @cfg {Number} [size=10]
             *
             * The `size` attribute of the text field.
             */
            this.size = 10;
            /**
             * @cfg {Boolean} [defaultValue='']
             *
             * The default value for the option.
             */
            this.defaultValue = '';
            this.size = cfg.size || 10;
            this.defaultValue = cfg.defaultValue || '';
            this.$containerEl.html(this.generateHtml());
            this.$textEl = this.$containerEl.find('input').on('keyup change', this.fireChange.bind(this));
            this.$valueDisplayEl = this.$containerEl.find('#' + this.containerId + '-value');
        }
        /**
         * @private
         * @return {string}
         */
        TextOption.prototype.generateHtml = function () {
            var containerId = this.containerId, optionDescription = this.optionDescription, size = this.size, defaultValue = this.defaultValue, textFieldId = containerId + '-textField';
            return "\n\t\t\t\t<label for=\"" + textFieldId + "\">" + optionDescription + "</label>\n\t\t\t\t<input type=\"text\" id=\"" + textFieldId + "\" value=\"" + defaultValue + "\" size=\"" + size + "\" class=\"textfield\">\n\t\t\t\t(<code>" + this.getApiDocAnchor() + "</code>)\n\t\t\t";
        };
        /**
         * @return {String}
         */
        TextOption.prototype.getValue = function () {
            return this.$textEl.val();
        };
        return TextOption;
    }(LiveExample.Option));
    LiveExample.TextOption = TextOption;
})(LiveExample || (LiveExample = {}));
/// <reference path="../../../typings/tsd.d.ts" />
/*global $, Autolinker */
/*jshint browser:true */
var CheckboxOption = LiveExample.CheckboxOption;
var RadioOption = LiveExample.RadioOption;
var TextOption = LiveExample.TextOption;
$(document).ready(function () {
    var $inputEl = $('#input'), $outputEl = $('#output'), $optionsOutputEl = $('#options-output'), urlsSchemeOption, urlsWwwOption, urlsTldOption, emailOption, phoneOption, mentionOption, hashtagOption, newWindowOption, stripPrefixOption, truncateLengthOption, truncationLocationOption, classNameOption;
    init();
    function init() {
        urlsSchemeOption = new CheckboxOption({ name: 'urls.schemeMatches', description: 'Scheme:// URLs', defaultValue: true }).onChange(autolink);
        urlsWwwOption = new CheckboxOption({ name: 'urls.wwwMatches', description: '\'www\' URLS', defaultValue: true }).onChange(autolink);
        urlsTldOption = new CheckboxOption({ name: 'urls.tldMatches', description: 'TLD URLs', defaultValue: true }).onChange(autolink);
        emailOption = new CheckboxOption({ name: 'email', description: 'Email Addresses', defaultValue: true }).onChange(autolink);
        phoneOption = new CheckboxOption({ name: 'phone', description: 'Phone Numbers', defaultValue: true }).onChange(autolink);
        mentionOption = new RadioOption({ name: 'mention', description: 'Mentions', options: [false, 'twitter', 'instagram'], defaultValue: false }).onChange(autolink);
        hashtagOption = new RadioOption({ name: 'hashtag', description: 'Hashtags', options: [false, 'twitter', 'facebook', 'instagram'], defaultValue: false }).onChange(autolink);
        newWindowOption = new CheckboxOption({ name: 'newWindow', description: 'Open in new window', defaultValue: true }).onChange(autolink);
        stripPrefixOption = new CheckboxOption({ name: 'stripPrefix', description: 'Strip prefix', defaultValue: true }).onChange(autolink);
        truncateLengthOption = new TextOption({ name: 'truncate.length', description: 'Truncate Length', size: 2, defaultValue: '0' }).onChange(autolink);
        truncationLocationOption = new RadioOption({ name: 'truncate.location', description: 'Truncate Location', options: ['end', 'middle', 'smart'], defaultValue: 'end' }).onChange(autolink);
        classNameOption = new TextOption({ name: 'className', description: 'CSS class(es)', size: 10 }).onChange(autolink);
        $inputEl.on('keyup change', autolink);
        $inputEl.on('scroll', syncOutputScroll);
        $outputEl.on('scroll', syncInputScroll);
        // Perform initial autolinking
        autolink();
    }
    function autolink() {
        var inputText = $inputEl.val().replace(/\n/g, '<br>'), optionsObj = createAutolinkerOptionsObj(), linkedHtml = Autolinker.link(inputText, optionsObj);
        $optionsOutputEl.html(createCodeSample(optionsObj));
        $outputEl.html(linkedHtml);
    }
    function createAutolinkerOptionsObj() {
        return {
            urls: {
                schemeMatches: urlsSchemeOption.getValue(),
                wwwMatches: urlsWwwOption.getValue(),
                tldMatches: urlsTldOption.getValue()
            },
            email: emailOption.getValue(),
            phone: phoneOption.getValue(),
            mention: mentionOption.getValue(),
            hashtag: hashtagOption.getValue(),
            newWindow: newWindowOption.getValue(),
            stripPrefix: stripPrefixOption.getValue(),
            className: classNameOption.getValue(),
            truncate: {
                length: +truncateLengthOption.getValue(),
                location: truncationLocationOption.getValue()
            }
        };
    }
    function createCodeSample(optionsObj) {
        return [
            "var autolinker = new Autolinker( {",
            "    urls : {",
            ("        schemeMatches : " + optionsObj.urls.schemeMatches + ","),
            ("        wwwMatches    : " + optionsObj.urls.wwwMatches + ","),
            ("        tldMatches    : " + optionsObj.urls.tldMatches),
            "    },",
            ("    email       : " + optionsObj.email + ","),
            ("    phone       : " + optionsObj.phone + ","),
            ("    mention     : " + (typeof optionsObj.mention === 'string' ? "'" + optionsObj.mention + "'" : optionsObj.mention) + ","),
            ("    hashtag     : " + (typeof optionsObj.hashtag === 'string' ? "'" + optionsObj.hashtag + "'" : optionsObj.hashtag) + ","),
            "",
            ("    stripPrefix : " + optionsObj.stripPrefix + ","),
            ("    newWindow   : " + optionsObj.newWindow + ","),
            "",
            "    truncate : {",
            ("        length   : " + optionsObj.truncate.length + ","),
            ("        location : '" + optionsObj.truncate.location + "'"),
            "    },",
            "",
            ("    className : '" + optionsObj.className + "'"),
            "} );",
            "",
            "var myLinkedHtml = autolinker.link( myText );"
        ].join('\n');
    }
    function syncInputScroll() {
        $inputEl.scrollTop($outputEl.scrollTop());
    }
    function syncOutputScroll() {
        $outputEl.scrollTop($inputEl.scrollTop());
    }
});
