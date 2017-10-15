/// <reference path="../../../typings/tsd.d.ts" />

/*global $, Autolinker */
/*jshint browser:true */

import CheckboxOption = LiveExample.CheckboxOption;
import RadioOption = LiveExample.RadioOption;
import TextOption = LiveExample.TextOption;

declare var Autolinker:any;

$( document ).ready( function() {
	var $inputEl = $( '#input' ),
	    $outputEl = $( '#output' ),
	    $optionsOutputEl = $( '#options-output' ),

	    urlsSchemeOption: LiveExample.Option,
	    urlsWwwOption: LiveExample.Option,
	    urlsTldOption: LiveExample.Option,
	    emailOption: LiveExample.Option,
	    phoneOption: LiveExample.Option,
	    mentionOption: LiveExample.Option,
	    hashtagOption: LiveExample.Option,

	    newWindowOption: LiveExample.Option,
	    stripPrefixOption: LiveExample.Option,
	    truncateLengthOption: LiveExample.Option,
	    truncationLocationOption: LiveExample.Option,
	    classNameOption: LiveExample.Option;


	init();


	function init() {
		urlsSchemeOption = new CheckboxOption( { name: 'urls.schemeMatches', description: 'Scheme:// URLs', defaultValue: true } ).onChange( autolink );
		urlsWwwOption = new CheckboxOption( { name: 'urls.wwwMatches', description: '\'www\' URLS', defaultValue: true } ).onChange( autolink );
		urlsTldOption = new CheckboxOption( { name: 'urls.tldMatches', description: 'TLD URLs', defaultValue: true } ).onChange( autolink );
		emailOption = new CheckboxOption( { name: 'email', description: 'Email Addresses', defaultValue: true } ).onChange( autolink );
		phoneOption = new CheckboxOption( { name: 'phone', description: 'Phone Numbers', defaultValue: true } ).onChange( autolink );
		mentionOption = new RadioOption( { name: 'mention', description: 'Mentions', options: [ false, 'twitter', 'instagram' ], defaultValue: false } ).onChange( autolink );
		hashtagOption = new RadioOption( { name: 'hashtag', description: 'Hashtags', options: [ false, 'twitter', 'facebook', 'instagram' ], defaultValue: false } ).onChange( autolink );

		newWindowOption = new CheckboxOption( { name: 'newWindow', description: 'Open in new window', defaultValue: true } ).onChange( autolink );
		stripPrefixOption = new CheckboxOption( { name: 'stripPrefix', description: 'Strip prefix', defaultValue: true } ).onChange( autolink );
		truncateLengthOption = new TextOption( { name: 'truncate.length', description: 'Truncate Length', size: 2, defaultValue: '0' } ).onChange( autolink );
		truncationLocationOption = new RadioOption( { name: 'truncate.location', description: 'Truncate Location', options: [ 'end', 'middle', 'smart' ], defaultValue: 'end' } ).onChange( autolink );
		classNameOption = new TextOption( { name: 'className', description: 'CSS class(es)', size: 10 } ).onChange( autolink );

		$inputEl.on( 'keyup change', autolink );

		$inputEl.on( 'scroll', syncOutputScroll );
		$outputEl.on( 'scroll', syncInputScroll );

		// Perform initial autolinking
		autolink();
	}


	function autolink() {
		var inputText = $inputEl.val().replace( /\n/g, '<br>' ),
		    optionsObj = createAutolinkerOptionsObj(),
		    linkedHtml = Autolinker.link( inputText, optionsObj );

		$optionsOutputEl.html( createCodeSample( optionsObj ) );
		$outputEl.html( linkedHtml );
	}


	function createAutolinkerOptionsObj() {
		return {
			urls : {
				schemeMatches : urlsSchemeOption.getValue(),
				wwwMatches    : urlsWwwOption.getValue(),
				tldMatches    : urlsTldOption.getValue()
			},
			email       : emailOption.getValue(),
			phone       : phoneOption.getValue(),
			mention     : mentionOption.getValue(),
			hashtag     : hashtagOption.getValue(),

			newWindow   : newWindowOption.getValue(),
			stripPrefix : stripPrefixOption.getValue(),
			className   : classNameOption.getValue(),
			truncate    : {
				length   : +truncateLengthOption.getValue(),
				location : truncationLocationOption.getValue()
			}
		};
	}


	function createCodeSample( optionsObj:any ) {
		return [
			`var autolinker = new Autolinker( {`,
			`    urls : {`,
			`        schemeMatches : ${ optionsObj.urls.schemeMatches },`,
			`        wwwMatches    : ${ optionsObj.urls.wwwMatches },`,
			`        tldMatches    : ${ optionsObj.urls.tldMatches }`,
			`    },`,
			`    email       : ${ optionsObj.email },`,
			`    phone       : ${ optionsObj.phone },`,
			`    mention     : ${ typeof optionsObj.mention === 'string' ? "'" + optionsObj.mention + "'" : optionsObj.mention },`,
			`    hashtag     : ${ typeof optionsObj.hashtag === 'string' ? "'" + optionsObj.hashtag + "'" : optionsObj.hashtag },`,
			``,
			`    stripPrefix : ${ optionsObj.stripPrefix },`,
			`    newWindow   : ${ optionsObj.newWindow },`,
			``,
			`    truncate : {`,
			`        length   : ${ optionsObj.truncate.length },`,
			`        location : '${ optionsObj.truncate.location }'`,
			`    },`,
			``,
			`    className : '${ optionsObj.className }'`,
			`} );`,
			``,
			`var myLinkedHtml = autolinker.link( myText );`
		].join( '\n' );
	}


	function syncInputScroll() {
		$inputEl.scrollTop( $outputEl.scrollTop() );
	}

	function syncOutputScroll() {
		$outputEl.scrollTop( $inputEl.scrollTop() );
	}

} );