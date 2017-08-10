/// <reference path="../../../typings/tsd.d.ts" />

/*global $ */

namespace LiveExample {

	export interface OptionCfg {
		name: string;
		description: string;
	}


	/**
	 * @abstract
	 * @class Option
	 *
	 * Base class for options that can be modified in the live example.
	 */
	export abstract class Option {

		/**
		 * @cfg {String} name
		 *
		 * The name of the option. This also relates to its element ID in the
		 * live-example.html file.
		 *
		 * Ex: pass 'newWindow' for the element with ID 'option-newWindow'.
		 */

		/**
		 * @cfg {String} description
		 *
		 * The description to display for the option.
		 */


		protected optionName: string;
		protected optionDescription: string;

		/**
		 * @protected
		 * @property {String} containerId
		 *
		 * The ID of the container element in live-example.html
		 */
		protected containerId: string;

		/**
		 * @protected
		 * @property {jQuery} $containerEl
		 *
		 * A reference to the container element in the live-example.html file.
		 */
		protected $containerEl: JQuery;

		/**
		 * @private
		 * @property {Function[]} changeCallbacks
		 *
		 * The array of 'change' callbacks assigned by {@link #onChange}, and which
		 * are called by {@link #fireChange}.
		 */
		private changeCallbacks: Function[];


		/**
		 * @constructor
		 * @param {OptionCfg} cfg The configuration options for this class,
		 *   specified in an Object (map).
		 */
		constructor( cfg: OptionCfg ) {
			this.optionName = cfg.name;
			this.optionDescription = cfg.description;

			this.containerId = 'option-' + this.optionName.replace( /\./g, '-' );  // ex: 'truncate.length' -> 'trunctate-length'
			this.$containerEl = $( '#' + this.containerId );

			this.changeCallbacks = [];
		}


		/**
		 * @protected
		 * @return {String}
		 */
		protected getApiDocAnchor(): string {
			return `<a href="${ this.getApiDocLink() }" target="autolinkerDocs">${ this.optionName }</a>`;
		}


		/**
		 * @protected
		 * @return {String}
		 */
		protected getApiDocLink(): string {
			let configName: string = this.optionName.match( /[^.]+/ )[ 0 ];  // ex: 'urls.schemeMatches' -> 'urls'

			return `http://gregjacobs.github.io/Autolinker.js/docs/#!/api/Autolinker-cfg-${configName}`;
		}


		/**
		 * Retrieves the value for the option.
		 *
		 * @abstract
		 * @return {*}
		 */
		abstract getValue(): any;


		/**
		 * Registers a callback to call when the option is changed.
		 *
		 * @param {Function} callbackFn
		 * @chainable
		 */
		public onChange( callbackFn: Function ): Option {
			this.changeCallbacks.push( callbackFn );
			return this;
		}


		/**
		 * Calls all 'change' callbacks as a result of the option being changed.
		 *
		 * @protected
		 */
		protected fireChange() {
			this.changeCallbacks.forEach( cb => cb() );  // call all 'change' callbacks
		}

	}

}