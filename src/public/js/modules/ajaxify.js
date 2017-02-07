/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

define('modules/ajaxify', [
    'jquery',
    'angular',
    'modules/helpers',
    'modules/navigation',
    'pages/pageloader',
    'modules/socket',
    'history'

], function($, angular, helpers, nav, pageLoader, socketClient) {

    $(window).on('statechangecomplete', function() {
        //Global
        var $ele = $('#page-content');
        $ele.ready(function() {
            angular.bootstrap($ele, ['trudesk']);
        });

        socketClient.ui.init(socketClient.socket);
        socketClient.chat.getOpenWindows();
        socketClient.chat.updateOnlineBubbles();

        helpers.init();
        helpers.hideAllUiKitDropdowns();

        nav.init();

        //Page Loader
        pageLoader.init();

        //Load UI Animations Load
        helpers.UI.cardShow();
        helpers.countUpMe();

        $.event.trigger('$trudesk:ready');
    });


    // Prepare our Variables
    var
        History = window.History,
        document = window.document;

    // Check to see if History.js is enabled for our Browser
    if ( !History.enabled ) {
        return false;
    }

    // Wait for Document
    $(function(){
        // Prepare Variables
        var
        /* Application Specific Variables */
            contentSelector = '.wrapper > .ajaxyContent:first',
            $content = $(contentSelector).filter(':first'),
            contentNode = $content.get(0),
            //$menu = $('.sidebar > .side-nav').filter(':first'),
            //activeClass = 'active',
            //activeSelector = '.active',
            //menuChildrenSelector = '> li,> ul > li,> li > ul > li',
            completedEventName = 'statechangecomplete',
        /* Application Generic Variables */
            $window = $(window),
            $body = $(document.body),
            rootUrl = History.getRootUrl(),
            scrollOptions = {
                duration: 800,
                easing:'swing'
            };

        // Ensure Content
        if ( $content.length === 0 ) {
            $content = $body;
        }

        // Internal Helper
        $.expr[':'].internal = function(obj, index, meta, stack){
            // Prepare
            var
                $this = $(obj),
                url = $this.attr('href')||'',
                isInternalLink;

            // Check link
            isInternalLink = url.substring(0,rootUrl.length) === rootUrl || url.indexOf(':') === -1;

            // Ignore or Keep
            return isInternalLink;
        };

        // HTML Helper
        var documentHtml = function(html){
            // Prepare
            var result = String(html)
                    .replace(/<\!DOCTYPE[^>]*>/i, '')
                    .replace(/<(html|head|body|title|meta|script)([\s\>])/gi,'<div class="document-$1"$2')
                    .replace(/<\/(html|head|body|title|meta|script)\>/gi,'</div>')
                ;

            // Return
            return $.trim(result);
        };

        // Ajaxify Helper
        $.fn.ajaxify = function(){
            // Prepare
            var $this = $(this);

            // Ajaxify
            $this.find('a:internal:not(.no-ajaxy):not(.ajaxify-bound)').addClass('ajaxify-bound').on('click', function(event){
                // Prepare
                var
                    $this = $(this),
                    url = $this.attr('href'),
                    title = $this.attr('title')||null;

                // Continue as normal for cmd clicks etc
                if ( event.which == 2 || event.metaKey ) { return true; }

                // Ajaxify this link
                History.pushState(null,title,url);
                event.preventDefault();
                return false;
            });

            // Chain
            return $this;
        };

        // Ajaxify our Internal Links
        $body.ajaxify();

        // Hook into State Changes
        $window.bind('statechange',function(){
            // Prepare Variables
            var
                State = History.getState(),
                url = State.url,
                relativeUrl = url.replace(rootUrl,'');

            // Set Loading
            $body.addClass('loading');

            // Start Fade Out
            // Animating to opacity to 0 still keeps the element's height intact
            // Which prevents that annoying pop bang issue when loading in new content
            //$content.animate({opacity:0},100);

            // Ajax Request the Traditional Page

            $.ajax({
                url: url,
                success: function(data, textStatus, jqXHR){
                    // Prepare
                    var
                        $data = $(documentHtml(data)),
                        $dataBody = $data.find('.document-body:first'),
                        $dataContent = $dataBody.find(contentSelector).filter(':first'),
                        contentHtml, $scripts;

                    // Fetch the scripts
                    $scripts = $dataContent.find('.document-script');
                    if ( $scripts.length ) {
                        $scripts.detach();
                    }

                    // Fetch the content
                    contentHtml = $dataContent.html();
                    if ( !contentHtml ) {
                        document.location.href = url;
                        return false;
                    }

                    // Update the menu -- Custom to close submenu and add classes
                    // This is not needed because I am settin the menu active on the node.js route (Controller)
                    // $menuChildren = $menu.find(menuChildrenSelector);
                    // $menuChildren.filter(activeSelector).removeClass(activeClass);
                    // $menuChildren = $menuChildren.has(
                    //             'a[href^="'+relativeUrl+'"],' +
                    //             'a[href^="/'+relativeUrl+'"],' +
                    //             'a[href^="'+url+'"]' +
                    //             'a[data-url^="'+relativeUrl+'"]'
                    //
                    // );

//                    if ( $menuChildren.length === 1 ) { $menuChildren.addClass(activeClass); }


                    // This fixes showing the overflow on scrollers when removing them before page load
                    $('#page-content').animate({opacity:0}, 0, function() {
                        helpers.removeAllScrollers();
                        //Memory Leak Fix- Remove events before destroying content;
                        var $oldContent = $('#page-content');
                        $oldContent.find('*').off('click click.chosen mouseup mousemove mousedown change');

                        // Update the content
                        $content.stop(true,true);
                        $oldContent.find('*').remove();
                        $oldContent = null;

                        $content.html(contentHtml).ajaxify().css('opacity',1).show(); /* you could fade in here if you'd like */

                        // Update the title
                        document.title = $data.find('.document-title:first').text();
                        try {
                            document.getElementsByTagName('title')[0].innerHTML = document.title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
                        }
                        catch ( Exception ) { }

                        // Add the scripts
                        $scripts.each(function(){
                            var $script = $(this), scriptText = $script.text(), scriptNode = document.createElement('script');
                            if ( $script.attr('src') ) {
                                if ( !$script[0].async ) { scriptNode.async = false; }
                                scriptNode.src = $script.attr('src');
                            }
                            scriptNode.appendChild(document.createTextNode(scriptText));
                            contentNode.appendChild(scriptNode);
                        });

                        //helpers.removeAllScrollers();

                        // Complete the change
                        if ( $body.ScrollTo||false ) { $body.ScrollTo(scrollOptions); } /* http://balupton.com/projects/jquery-scrollto */
                        $body.removeClass('loading');
                        $window.trigger(completedEventName);

                        // Inform Google Analytics of the change
                        if ( typeof window._gaq !== 'undefined' ) {
                            window._gaq.push(['_trackPageview', relativeUrl]);
                        }
                    });

                },
                error: function(jqXHR, textStatus, errorThrown){
                    document.location.href = url;
                    console.log('[trudesk:ajaxify:Load] - Error Loading Document!!!');
                    console.error(errorThrown);
                    return false;
                }
            }); // end ajax

        }); // end onStateChange

    }); // end onDomLoad

});