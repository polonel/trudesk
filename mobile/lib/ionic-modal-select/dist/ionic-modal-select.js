/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(1);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	compile.$inject = ["$compile"];
	modalSelect.$inject = ["$ionicModal", "$timeout", "$filter", "$parse", "$templateCache"];
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	/*!
	 * Copyright 2015 Inmagik SRL.
	 * http://www.inmagik.com/
	 *
	 * ionic-modal-select, v1.3.2
	 * Modal select directive for Ionic framework.
	 *
	 * By @bianchimro
	 *
	 * Licensed under the MIT license. Please see LICENSE for more information.
	 *
	 */
	
	angular.module('ionic-modal-select', []).directive('compile', compile).directive('modalSelect', modalSelect);
	
	function compile($compile) {
		return function (scope, iElement, iAttrs) {
			var x = scope.$watch(function (scope) {
				// watch the 'compile' expression for changes
				return scope.$eval(iAttrs.compile);
			}, function (value) {
				// when the 'compile' expression changes
				// assign it into the current DOM
				iElement.html(value);
	
				// compile the new DOM and link it to the current
				// scope.
				// NOTE: we only compile .childNodes so that
				// we don't get into infinite loop compiling ourselves
				$compile(iElement.contents())(scope);
	
				//deactivate watch if "compile-once" is set to "true"
				if (iAttrs.compileOnce === 'true') {
					x();
				}
			});
		};
	}
	
	function modalSelect($ionicModal, $timeout, $filter, $parse, $templateCache) {
	
		var modalTemplateMultiple = __webpack_require__(2);
		var modalTemplate = __webpack_require__(3);
	
		return {
			restrict: 'A',
			require: 'ngModel',
			scope: {
				initialOptions: "=options",
				optionGetter: "&",
				searchFilters: "=searchFilters",
				searchProperties: '=',
				onSelect: "&",
				onSearch: "&",
				onReset: "&",
				onClose: "&"
			},
			link: function link(scope, iElement, iAttrs, ngModelController, transclude) {
	
				var shortList = true;
				var shortListBreak = iAttrs.shortListBreak ? parseInt(iAttrs.shortListBreak) : 10;
				var setFromProperty = iAttrs.optionProperty;
				var onOptionSelect = iAttrs.optionGetter;
				var clearSearchOnSelect = iAttrs.clearSearchOnSelect !== "false" ? true : false;
				var searchProperties = scope.searchProperties ? scope.searchProperties : false;
	
				//multiple values settings.
				var multiple = iAttrs.multiple ? true : false;
				if (multiple) {
					scope.isChecked = {};
				}
				var multipleNullValue = iAttrs.multipleNullValue ? scope.$eval(iAttrs.multipleNullValue) : [];
	
				scope.ui = {
					modalTitle: iAttrs.modalTitle || 'Select an option',
					okButton: iAttrs.okButton || 'OK',
					hideReset: iAttrs.hideReset !== "true" ? false : true,
					resetButton: iAttrs.resetButton || 'Reset',
					cancelButton: iAttrs.cancelButton || 'Cancel',
					loadListMessage: iAttrs.loadListMessage || 'Loading',
					modalClass: iAttrs.modalClass || '',
					headerFooterClass: iAttrs.headerFooterClass || 'bar-stable',
					value: null,
					selectedClass: iAttrs.selectedClass || 'option-selected',
					itemClass: iAttrs.itemClass || 'item item-text-wrap',
					searchTemplate: iAttrs.searchTemplate || (multiple ? modalTemplateMultiple : modalTemplate),
	
					//search stuff
					hasSearch: iAttrs.hasSearch !== "true" ? false : true,
					searchValue: '',
					searchPlaceholder: iAttrs.searchPlaceholder || 'Search',
					subHeaderClass: iAttrs.subHeaderClass || 'bar-stable',
					cancelSearchButton: iAttrs.cancelSearchButton || 'Clear'
	
				};
	
				var allOptions = [];
				scope.options = [];
	
				if (iAttrs.optionsExpression) {
					var optionsExpression = iAttrs.optionsExpression;
					var match = optionsExpression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
					if (!match) {
						throw new Error("collection-repeat expected expression in form of '_item_ in " + "_collection_[ track by _id_]' but got '" + iAttrs.optionsExpression + "'.");
					}
					//var keyExpr = match[1];
					var listExpr = match[2];
					var listGetter = $parse(listExpr);
					var s = iElement.scope();
	
					scope.$watch(function () {
						return listGetter(s);
					}, function (nv, ov) {
						initialOptionsSetup(nv);
						updateListMode();
					}, true);
				} else {
					scope.$watchCollection('initialOptions', function (nv) {
						initialOptionsSetup(nv);
						updateListMode();
					});
				}
	
				//#TODO: this is due to different single vs multiple template
				//but adds lots of complexity here and in search
				function initialOptionsSetup(nv) {
					nv = nv || [];
					if (!multiple) {
						allOptions = angular.copy(nv);
						scope.options = angular.copy(nv);
					} else {
						allOptions = nv.map(function (item, idx) {
							return [idx, angular.copy(item)];
						});
						scope.options = angular.copy(allOptions);
					}
				}
	
				// getting options template
				var opt = iElement[0].querySelector('.option');
				if (!opt) {
					throw new Error({
						name: 'modalSelectError:noOptionTemplate',
						message: 'When using modalSelect directive you must include an element with class "option"\n\t\t\t\t\t\t to provide a template for your select options.',
						toString: function toString() {
							return this.name + " " + this.message;
						}
					});
				}
				scope.inner = angular.element(opt).html();
	
				//add support for .remove for older devices
				if (!('remove' in Element.prototype)) {
					Element.prototype.remove = function () {
						this.parentNode.removeChild(this);
					};
				}
	
				angular.element(opt).remove();
	
				var notFound = iElement[0].querySelector('.not-found');
				if (notFound) {
					scope.notFound = angular.element(notFound).html();
					angular.element(notFound).remove();
				}
	
				function updateListMode() {
					//shortList controls wether using ng-repeat instead of collection-repeat
					if (iAttrs.useCollectionRepeat === "true") {
						shortList = false;
					} else if (iAttrs.useCollectionRepeat === "false") {
						shortList = true;
					} else {
						if (typeof scope.options !== "undefined") {
							shortList = !!(scope.options.length < shortListBreak);
						}
					}
	
					scope.ui.shortList = shortList;
				}
	
				ngModelController.$render = function () {
					scope.ui.value = ngModelController.$viewValue;
				};
	
				var getSelectedValue = scope.getSelectedValue = function (option) {
					var val = null;
					if (option === null || option === undefined) {
						return option;
					}
					if (onOptionSelect) {
						return scope.optionGetter({ option: option });
					}
					if (setFromProperty) {
						val = option[setFromProperty];
					} else {
						val = option;
					}
					return val;
				};
	
				scope.setOption = function (option) {
					var oldValue = ngModelController.$viewValue;
					var val = getSelectedValue(option);
					ngModelController.$setViewValue(val);
					ngModelController.$render();
	
					if (scope.onSelect) {
						scope.onSelect({ newValue: val, oldValue: oldValue });
					}
					scope.modal.hide().then(function () {
						scope.showList = false;
						if (scope.ui.hasSearch) {
							if (clearSearchOnSelect) {
								scope.ui.searchValue = '';
							}
						}
					});
				};
	
				// Filter object {id: <filterId>, active: <boolean>}
				// Used as auxiliary query params when querying server for search results
				scope.setFilter = function (filterId) {
					angular.forEach(scope.searchFilters, function (filter) {
						if (filter.id == filterId) {
							filter.active = !filter.active;
						} else {
							filter.active = false;
						}
					});
	
					// Trigger another search when the search filters change
					if (scope.onSearch) {
						scope.onSearch({ query: scope.ui.searchValue });
					}
				};
	
				scope.unsetValue = function () {
					$timeout(function () {
						ngModelController.$setViewValue("");
						ngModelController.$render();
						scope.modal.hide();
						scope.showList = false;
						if (scope.onReset && angular.isFunction(scope.onReset)) {
							scope.onReset();
						}
					});
				};
	
				scope.setValues = function () {
					var checkedItems = [];
					angular.forEach(scope.isChecked, function (v, k) {
						if (v) {
							checkedItems.push(allOptions[k][1]);
						}
					});
					var oldValues = ngModelController.$viewValue;
					var vals = checkedItems.map(function (item) {
						return getSelectedValue(item);
					});
					ngModelController.$setViewValue(vals);
					ngModelController.$render();
	
					if (scope.onSelect) {
						scope.onSelect({ newValue: vals, oldValue: oldValues });
					}
					scope.modal.hide().then(function () {
						scope.showList = false;
						if (scope.ui.hasSearch) {
							if (clearSearchOnSelect) {
								scope.ui.searchValue = '';
							}
						}
					});
				};
	
				scope.unsetValues = function () {
					$timeout(function () {
						ngModelController.$setViewValue(multipleNullValue);
						ngModelController.$render();
						scope.isChecked = {};
						scope.modal.hide();
						scope.showList = false;
						if (scope.onReset && angular.isFunction(scope.onReset)) {
							scope.onReset();
						}
					});
				};
	
				scope.closeModal = function () {
					scope.modal.hide().then(function () {
						scope.showList = false;
					});
				};
	
				scope.compareValues = function (a, b) {
					return angular.equals(a, b);
				};
	
				//loading the modal
				var modalTpl = null;
				if (iAttrs.searchTemplate) {
					scope.modal = $ionicModal.fromTemplate($templateCache.get(iAttrs.searchTemplate), { scope: scope });
				} else {
					modalTpl = multiple ? modalTemplateMultiple : modalTemplate;
					scope.modal = $ionicModal.fromTemplate(modalTpl, { scope: scope });
				}
	
				var hiddenCb = null;
				scope.$on('$destroy', function () {
					if (hiddenCb) {
						hiddenCb();
						hiddenCb = null;
					}
					scope.modal.remove();
				});
	
				if (scope.onClose && angular.isFunction(scope.onClose)) {
					hiddenCb = scope.$on('modal.hidden', function () {
						scope.onClose();
					});
				}
	
				iElement.on('click', function () {
					if (shortList) {
						scope.showList = true;
						scope.modal.show();
					} else {
						scope.modal.show().then(function () {
							scope.showList = true;
							scope.ui.shortList = shortList;
						});
					}
				});
	
				//filter function
				if (scope.ui.hasSearch) {
					scope.$watch('ui.searchValue', function (nv) {
						var whatToSearch;
						if (!multiple) {
							whatToSearch = allOptions;
						} else {
							whatToSearch = allOptions.map(function (item) {
								return item[1];
							});
						}
	
						if (iAttrs.onSearch) {
							scope.onSearch({ query: nv });
						} else {
							var filteredOpts = $filter('filter')(whatToSearch, nv, function (actual, expected) {
								if (!actual) {
									// if actual is an empty string, empty object, null, or undefined
									return false;
								}
								if (searchProperties) {
									if ((typeof actual === 'undefined' ? 'undefined' : _typeof(actual)) == 'object') {
										for (var i = 0; i < searchProperties.length; i++) {
											if (actual[searchProperties[i]] && actual[searchProperties[i]].toLowerCase().indexOf(expected.toLowerCase()) >= 0) {
												return true;
											}
										}
									}
									return false;
								} else {
									if (actual.toString().toLowerCase().indexOf(expected.toLowerCase()) >= 0) {
										return true;
									}
								}
								return false;
							});
	
							var oldLen = scope.options.length;
							if (!multiple) {
								scope.options = filteredOpts;
							} else {
								//#TODO: lots of loops here!
								var newOpts = [];
								angular.forEach(filteredOpts, function (item) {
									var originalItem = allOptions.find(function (it) {
										return it[1] == item;
									});
									if (originalItem) {
										newOpts.push(originalItem);
									}
								});
								scope.options = newOpts;
							}
							if (oldLen != scope.options.length) {
								//#todo: should resize scroll or scroll up here
							}
						}
					});
					scope.clearSearch = function () {
						scope.ui.searchValue = '';
					};
				}
	
				scope.copyOpt = function (option) {
					return angular.copy(option);
				};
	
				//#TODO ?: WRAP INTO $timeout?
				ngModelController.$render();
			}
		};
	}

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = " <ion-modal-view class=\"ionic-select-modal\" ng-class=\"::ui.modalClass\">\n\n    <ion-header-bar ng-class=\"::ui.headerFooterClass\">\n      <h1 class=\"title\">{{::ui.modalTitle}}</h1>\n    </ion-header-bar>\n\n    <div class=\"bar bar-subheader item-input-inset\" ng-class=\"::ui.subHeaderClass\" ng-if=\"ui.hasSearch\">\n      <label class=\"item-input-wrapper\">\n        <i class=\"icon ion-ios-search placeholder-icon\"></i>\n        <input type=\"search\" placeholder=\"{{::ui.searchPlaceholder}}\" ng-model=\"ui.searchValue\">\n      </label>\n      <button type=\"button\" class=\"button button-clear\" ng-click=\"clearSearch()\">\n        {{ ui.cancelSearchButton }}\n      </button>\n    </div>\n\n    <ion-content class=\"has-header\" ng-class=\"{'has-subheader':ui.hasSearch}\">\n    <div class=\"text-center\" ng-if=\"!ui.shortList && !showList\" style=\"padding-top:40px;\">\n        <h4 class=\"muted\">{{::ui.loadListMessage}}</h4>\n        <p>\n            <ion-spinner></ion-spinner>\n        </p>\n    </div>\n\n    <div ng-if=\"showList\">\n        <!--collection-repeat mode -->\n        <!-- not working right now -->\n        <!--\n        <div ng-if=\"!ui.shortList\" >\n            <div class=\"list\" class=\"animate-if\" >\n                <div\n                    class=\"item item-checkbox\" ng-class=\"ui.itemClass\"\n                     collection-repeat=\"optionm in options track by $index\">\n                    <label class=\"checkbox\">\n                        <input type=\"checkbox\" ng-model=\"isChecked[optionm[0]]\">\n                    </label>\n\n                    <div compile=\"inner\" ng-init=\"option=optionm[1]\" compile-once=\"false\"></div>\n\n                </div>\n            </div>\n        </div>\n        -->\n\n        <!-- ng-repeat mode -->\n        <div ng-if=\"ui.shortList || true\">\n            <div class=\"list\">\n                <div\n                  class=\"item item-checkbox\" ng-class=\"ui.itemClass\"\n                  ng-repeat=\"optionm in options track by optionm[0]\">\n                    <label class=\"checkbox\">\n                        <input type=\"checkbox\" ng-model=\"isChecked[optionm[0]]\">\n                    </label>\n                    <div ng-init=\"option=optionm[1]\" compile=\"inner\" compile-once=\"true\"></div>\n                </div>\n            </div>\n        </div>\n    </div>\n    </ion-content>\n    <ion-footer-bar ng-class=\"::ui.headerFooterClass\">\n        <button class=\"button button-stable\" ng-click=\"closeModal()\">{{ui.cancelButton}}</button>\n        <div class=\"title\" style=\"padding-top:6px\">\n            <button class=\"button button-navbar\" ng-click=\"setValues()\">OK</button>\n        </div>\n        <button ng-if=\"::!ui.hideReset\" class=\"button button-stable\" ng-click=\"unsetValues()\">{{ui.resetButton}}</button>\n    </ion-footer-bar>\n</ion-modal-view>\n"

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = " <ion-modal-view class=\"ionic-select-modal\" ng-class=\"::ui.modalClass\">\n\n    <ion-header-bar ng-class=\"::ui.headerFooterClass\">\n      <h1 class=\"title\">{{::ui.modalTitle}}</h1>\n    </ion-header-bar>\n\n    <div class=\"bar bar-subheader item-input-inset\" ng-class=\"::ui.subHeaderClass\" ng-if=\"ui.hasSearch\">\n      <label class=\"item-input-wrapper\">\n        <i class=\"icon ion-ios-search placeholder-icon\"></i>\n        <input type=\"search\" placeholder=\"{{::ui.searchPlaceholder}}\" ng-model=\"ui.searchValue\">\n      </label>\n      <button type=\"button\" class=\"button button-clear\" ng-click=\"clearSearch()\">\n        {{ ui.cancelSearchButton }}\n      </button>\n    </div>\n\n    <ion-content class=\"has-header\" ng-class=\"{'has-subheader':ui.hasSearch}\">\n        <div class=\"text-center\" ng-if=\"!ui.shortList && !showList\" style=\"padding-top:40px;\">\n            <h4 class=\"muted\">{{::ui.loadListMessage}}</h4>\n            <p>\n                <ion-spinner></ion-spinner>\n            </p>\n        </div>\n        <div ng-if=\"showList\">\n            <div ng-if=\"!ui.shortList\">\n                <div class=\"list\" ng-if=\"showList\" class=\"animate-if\">\n                    <div\n                      ng-class=\"{ '{{::ui.itemClass}}' : true, '{{::ui.selectedClass}}': compareValues(getSelectedValue(option), ui.value) }\"\n                      collection-repeat=\"option in options track by $index\"\n                      ng-click=\"setOption(option)\"\n                      ng-class=\"{'{{::ui.selectedClass}}': compareValues(getSelectedValue(option), ui.value) }\">\n                        <div compile=\"inner\" compile-once=\"true\"></div>\n                    </div>\n                </div>\n            </div>\n            <div ng-if=\"ui.shortList\">\n                <div class=\"list\">\n                    <div\n                      ng-repeat=\"option in options track by $index\"\n                      ng-click=\"setOption(option)\"\n                      ng-class=\"{ '{{::ui.itemClass}}' : true, '{{::ui.selectedClass}}': compareValues(getSelectedValue(option), ui.value) }\">\n                        <div compile=\"inner\" compile-once=\"true\"></div>\n                    </div>\n                </div>\n            </div>\n        </div>\n\n        <div ng-if=\"notFound && options.length == 0\">\n            <div compile=\"notFound\" compile-once=\"true\" ng-click=\"closeModal()\"></div>\n        </div>\n\n    </ion-content>\n\n    <ion-footer-bar ng-class=\"::ui.headerFooterClass\">\n        <button type=\"button\" class=\"button button-stable modal-select-close-button\" ng-click=\"closeModal()\">{{ui.cancelButton}}</button>\n        <button type=\"button\" ng-if=\"::!ui.hideReset\" class=\"button button-stable\" ng-click=\"unsetValue()\">{{ui.resetButton}}</button>\n    </ion-footer-bar>\n\n</ion-modal-view>\n"

/***/ }
/******/ ]);
//# sourceMappingURL=ionic-modal-select.js.map