/*global $, Option */

namespace LiveExample {

	interface TextOptionCfg extends LiveExample.OptionCfg {
		size?: number;
		defaultValue?: string;
	}


	/**
	 * @class TextOption
	 *
	 * A text field option for the live example.
	 */
	export class TextOption extends Option {

		/**
		 * @cfg {Number} [size=10]
		 *
		 * The `size` attribute of the text field.
		 */
		private size: number = 10;

		/**
		 * @cfg {Boolean} [defaultValue='']
		 *
		 * The default value for the option.
		 */
		private defaultValue: string = '';


		private $textEl: JQuery;
		private $valueDisplayEl: JQuery;


		/**
		 * @constructor
		 * @param {TextOptionCfg} cfg The configuration options for this class,
		 *   specified in an Object (map).
		 */
		constructor( cfg: TextOptionCfg ) {
			super( cfg );

			this.size = cfg.size || 10;
			this.defaultValue = cfg.defaultValue || '';

			this.$containerEl.html( this.generateHtml() );
			this.$textEl = this.$containerEl.find( 'input' ).on( 'keyup change', this.fireChange.bind( this ) );
			this.$valueDisplayEl = this.$containerEl.find( '#' + this.containerId + '-value' );
		}


		/**
		 * @private
		 * @return {string}
		 */
		generateHtml() {
			var containerId = this.containerId,
				optionDescription = this.optionDescription,
				size = this.size,
				defaultValue = this.defaultValue,
				textFieldId = containerId + '-textField';

			return `
				<label for="${textFieldId}">${optionDescription}</label>
				<input type="text" id="${textFieldId}" value="${defaultValue}" size="${size}" class="textfield">
				(<code>${ this.getApiDocAnchor() }</code>)
			`;
		}


		/**
		 * @return {String}
		 */
		getValue() {
			return this.$textEl.val();
		}

	}

}