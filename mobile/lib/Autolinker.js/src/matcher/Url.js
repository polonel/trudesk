/*global Autolinker */
/**
 * @class Autolinker.matcher.Url
 * @extends Autolinker.matcher.Matcher
 *
 * Matcher to find URL matches in an input string.
 *
 * See this class's superclass ({@link Autolinker.matcher.Matcher}) for more details.
 */
Autolinker.matcher.Url = Autolinker.Util.extend( Autolinker.matcher.Matcher, {

	/**
	 * @cfg {Object} stripPrefix (required)
	 *
	 * The Object form of {@link Autolinker#cfg-stripPrefix}.
	 */

	/**
	 * @cfg {Boolean} stripTrailingSlash (required)
	 * @inheritdoc Autolinker#stripTrailingSlash
	 */


	/**
	 * @private
	 * @property {RegExp} matcherRegex
	 *
	 * The regular expression to match URLs with an optional scheme, port
	 * number, path, query string, and hash anchor.
	 *
	 * Example matches:
	 *
	 *     http://google.com
	 *     www.google.com
	 *     google.com/path/to/file?q1=1&q2=2#myAnchor
	 *
	 *
	 * This regular expression will have the following capturing groups:
	 *
	 * 1.  Group that matches a scheme-prefixed URL (i.e. 'http://google.com').
	 *     This is used to match scheme URLs with just a single word, such as
	 *     'http://localhost', where we won't double check that the domain name
	 *     has at least one dot ('.') in it.
	 * 2.  Group that matches a 'www.' prefixed URL. This is only matched if the
	 *     'www.' text was not prefixed by a scheme (i.e.: not prefixed by
	 *     'http://', 'ftp:', etc.)
	 * 3.  A protocol-relative ('//') match for the case of a 'www.' prefixed
	 *     URL. Will be an empty string if it is not a protocol-relative match.
	 *     We need to know the character before the '//' in order to determine
	 *     if it is a valid match or the // was in a string we don't want to
	 *     auto-link.
	 * 4.  Group that matches a known TLD (top level domain), when a scheme
	 *     or 'www.'-prefixed domain is not matched.
	 * 5.  A protocol-relative ('//') match for the case of a known TLD prefixed
	 *     URL. Will be an empty string if it is not a protocol-relative match.
	 *     See #3 for more info.
	 */
	matcherRegex : (function() {
		var schemeRegex = /(?:[A-Za-z][-.+A-Za-z0-9]*:(?![A-Za-z][-.+A-Za-z0-9]*:\/\/)(?!\d+\/?)(?:\/\/)?)/,  // match protocol, allow in format "http://" or "mailto:". However, do not match the first part of something like 'link:http://www.google.com' (i.e. don't match "link:"). Also, make sure we don't interpret 'google.com:8000' as if 'google.com' was a protocol here (i.e. ignore a trailing port number in this regex)
		    wwwRegex = /(?:www\.)/,                  // starting with 'www.'
		    domainNameRegex = Autolinker.RegexLib.domainNameRegex,
		    tldRegex = Autolinker.RegexLib.tldRegex,  // match our known top level domains (TLDs)
		    alphaNumericCharsStr = Autolinker.RegexLib.alphaNumericCharsStr,

		    // Allow optional path, query string, and hash anchor, not ending in the following characters: "?!:,.;"
		    // http://blog.codinghorror.com/the-problem-with-urls/
		    urlSuffixRegex = new RegExp( '[' + alphaNumericCharsStr + '\\-+&@#/%=~_()|\'$*\\[\\]?!:,.;\u2713]*[' + alphaNumericCharsStr + '\\-+&@#/%=~_()|\'$*\\[\\]\u2713]' );

		return new RegExp( [
			'(?:', // parens to cover match for scheme (optional), and domain
				'(',  // *** Capturing group $1, for a scheme-prefixed url (ex: http://google.com)
					schemeRegex.source,
					domainNameRegex.source,
				')',

				'|',

				'(',  // *** Capturing group $2, for a 'www.' prefixed url (ex: www.google.com)
					'(//)?',  // *** Capturing group $3 for an optional protocol-relative URL. Must be at the beginning of the string or start with a non-word character (handled later)
					wwwRegex.source,
					domainNameRegex.source,
				')',

				'|',

				'(',  // *** Capturing group $4, for known a TLD url (ex: google.com)
					'(//)?',  // *** Capturing group $5 for an optional protocol-relative URL. Must be at the beginning of the string or start with a non-word character (handled later)
					domainNameRegex.source + '\\.',
					tldRegex.source,
				')',
			')',

			'(?:' + urlSuffixRegex.source + ')?'  // match for path, query string, and/or hash anchor - optional
		].join( "" ), 'gi' );
	} )(),


	/**
	 * A regular expression to use to check the character before a protocol-relative
	 * URL match. We don't want to match a protocol-relative URL if it is part
	 * of another word.
	 *
	 * For example, we want to match something like "Go to: //google.com",
	 * but we don't want to match something like "abc//google.com"
	 *
	 * This regular expression is used to test the character before the '//'.
	 *
	 * @private
	 * @type {RegExp} wordCharRegExp
	 */
	wordCharRegExp : /\w/,


	/**
	 * The regular expression to match opening parenthesis in a URL match.
	 *
	 * This is to determine if we have unbalanced parenthesis in the URL, and to
	 * drop the final parenthesis that was matched if so.
	 *
	 * Ex: The text "(check out: wikipedia.com/something_(disambiguation))"
	 * should only autolink the inner "wikipedia.com/something_(disambiguation)"
	 * part, so if we find that we have unbalanced parenthesis, we will drop the
	 * last one for the match.
	 *
	 * @private
	 * @property {RegExp}
	 */
	openParensRe : /\(/g,

	/**
	 * The regular expression to match closing parenthesis in a URL match. See
	 * {@link #openParensRe} for more information.
	 *
	 * @private
	 * @property {RegExp}
	 */
	closeParensRe : /\)/g,


	/**
	 * @constructor
	 * @param {Object} cfg The configuration properties for the Match instance,
	 *   specified in an Object (map).
	 */
	constructor : function( cfg ) {
		Autolinker.matcher.Matcher.prototype.constructor.call( this, cfg );

		// @if DEBUG
		if( cfg.stripPrefix == null ) throw new Error( '`stripPrefix` cfg required' );
		if( cfg.stripTrailingSlash == null ) throw new Error( '`stripTrailingSlash` cfg required' );
		// @endif

		this.stripPrefix = cfg.stripPrefix;
		this.stripTrailingSlash = cfg.stripTrailingSlash;
	},


	/**
	 * @inheritdoc
	 */
	parseMatches : function( text ) {
		var matcherRegex = this.matcherRegex,
		    stripPrefix = this.stripPrefix,
		    stripTrailingSlash = this.stripTrailingSlash,
		    tagBuilder = this.tagBuilder,
		    matches = [],
		    match;

		while( ( match = matcherRegex.exec( text ) ) !== null ) {
			var matchStr = match[ 0 ],
			    schemeUrlMatch = match[ 1 ],
			    wwwUrlMatch = match[ 2 ],
			    wwwProtocolRelativeMatch = match[ 3 ],
			    //tldUrlMatch = match[ 4 ],  -- not needed at the moment
			    tldProtocolRelativeMatch = match[ 5 ],
			    offset = match.index,
			    protocolRelativeMatch = wwwProtocolRelativeMatch || tldProtocolRelativeMatch,
				prevChar = text.charAt( offset - 1 );

			if( !Autolinker.matcher.UrlMatchValidator.isValid( matchStr, schemeUrlMatch ) ) {
				continue;
			}

			// If the match is preceded by an '@' character, then it is either
			// an email address or a username. Skip these types of matches.
			if( offset > 0 && prevChar === '@' ) {
				continue;
			}

			// If it's a protocol-relative '//' match, but the character before the '//'
			// was a word character (i.e. a letter/number), then we found the '//' in the
			// middle of another word (such as "asdf//asdf.com"). In this case, skip the
			// match.
			if( offset > 0 && protocolRelativeMatch && this.wordCharRegExp.test( prevChar ) ) {
				continue;
			}

			// Handle a closing parenthesis at the end of the match, and exclude
			// it if there is not a matching open parenthesis in the match
			// itself.
			if( this.matchHasUnbalancedClosingParen( matchStr ) ) {
				matchStr = matchStr.substr( 0, matchStr.length - 1 );  // remove the trailing ")"
			} else {
				// Handle an invalid character after the TLD
				var pos = this.matchHasInvalidCharAfterTld( matchStr, schemeUrlMatch );
				if( pos > -1 ) {
					matchStr = matchStr.substr( 0, pos ); // remove the trailing invalid chars
				}
			}

			var urlMatchType = schemeUrlMatch ? 'scheme' : ( wwwUrlMatch ? 'www' : 'tld' ),
			    protocolUrlMatch = !!schemeUrlMatch;

			matches.push( new Autolinker.match.Url( {
				tagBuilder            : tagBuilder,
				matchedText           : matchStr,
				offset                : offset,
				urlMatchType          : urlMatchType,
				url                   : matchStr,
				protocolUrlMatch      : protocolUrlMatch,
				protocolRelativeMatch : !!protocolRelativeMatch,
				stripPrefix           : stripPrefix,
				stripTrailingSlash    : stripTrailingSlash
			} ) );
		}

		return matches;
	},


	/**
	 * Determines if a match found has an unmatched closing parenthesis. If so,
	 * this parenthesis will be removed from the match itself, and appended
	 * after the generated anchor tag.
	 *
	 * A match may have an extra closing parenthesis at the end of the match
	 * because the regular expression must include parenthesis for URLs such as
	 * "wikipedia.com/something_(disambiguation)", which should be auto-linked.
	 *
	 * However, an extra parenthesis *will* be included when the URL itself is
	 * wrapped in parenthesis, such as in the case of "(wikipedia.com/something_(disambiguation))".
	 * In this case, the last closing parenthesis should *not* be part of the
	 * URL itself, and this method will return `true`.
	 *
	 * @private
	 * @param {String} matchStr The full match string from the {@link #matcherRegex}.
	 * @return {Boolean} `true` if there is an unbalanced closing parenthesis at
	 *   the end of the `matchStr`, `false` otherwise.
	 */
	matchHasUnbalancedClosingParen : function( matchStr ) {
		var lastChar = matchStr.charAt( matchStr.length - 1 );

		if( lastChar === ')' ) {
			var openParensMatch = matchStr.match( this.openParensRe ),
			    closeParensMatch = matchStr.match( this.closeParensRe ),
			    numOpenParens = ( openParensMatch && openParensMatch.length ) || 0,
			    numCloseParens = ( closeParensMatch && closeParensMatch.length ) || 0;

			if( numOpenParens < numCloseParens ) {
				return true;
			}
		}

		return false;
	},


	/**
	 * Determine if there's an invalid character after the TLD in a URL. Valid
	 * characters after TLD are ':/?#'. Exclude scheme matched URLs from this
	 * check.
	 *
	 * @private
	 * @param {String} urlMatch The matched URL, if there was one. Will be an
	 *   empty string if the match is not a URL match.
	 * @param {String} schemeUrlMatch The match URL string for a scheme
	 *   match. Ex: 'http://yahoo.com'. This is used to match something like
	 *   'http://localhost', where we won't double check that the domain name
	 *   has at least one '.' in it.
	 * @return {Number} the position where the invalid character was found. If
	 *   no such character was found, returns -1
	 */
	matchHasInvalidCharAfterTld : function( urlMatch, schemeUrlMatch ) {
		if( !urlMatch ) {
			return -1;
		}

		var offset = 0;
		if ( schemeUrlMatch ) {
			offset = urlMatch.indexOf(':');
			urlMatch = urlMatch.slice(offset);
		}

		var re = /^((.?\/\/)?[A-Za-z0-9\u00C0-\u017F\.\-]*[A-Za-z0-9\u00C0-\u017F\-]\.[A-Za-z]+)/;
		var res = re.exec( urlMatch );
		if ( res === null ) {
			return -1;
		}

		offset += res[1].length;
		urlMatch = urlMatch.slice(res[1].length);
		if (/^[^.A-Za-z0-9:\/?#]/.test(urlMatch)) {
			return offset;
		}

		return -1;
	}

} );
