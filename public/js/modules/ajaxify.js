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
    'pages/dashboard',
    'pages/messages',
    'pages/tickets',
    'pages/accounts',
    'pages/groups',
    'modules/ajaximgupload',
    'pages/editaccount',
    'pages/singleTicket',
    'pages/reports',
    'modules/ui',
    'modules/chat',
    'history'

], function($, angular, helpers, nav, dashboardPage, messagesPage, ticketsPage, accountsPage, groupsPage, ajaxImgUpload, editAccountPage, singleTicketPage, reportsPage, ui) {
    $(window).on('statechangecomplete', function() {
        //Global
        var $ele = $('#page-content');
        $ele.ready(function() {
            angular.bootstrap($ele, ['trudesk']);
        });

        $(document).foundation({
            abide: {
                patterns: {
                    is5Long: /.{5,}/
                }
            },
            reveal: {
                animation: 'fade',
                animation_speed: 200,
                close_on_background_click: true,
                close_on_esc: true
            }
        });

        ui.init();
        helpers.init();
        ajaxImgUpload.init();
        nav.init();

        //Dashbaord
        dashboardPage.init();

        //Messages
        messagesPage.stopRefresh();
        messagesPage.init();

        //Tickets
        ticketsPage.init();
        singleTicketPage.init();

        //Accounts
        accountsPage.init();
        editAccountPage.init();

        //Groups
        groupsPage.init();

        //Reports
        reportsPage.init();

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
            contentSelector = '.wrapper > .row:not(.top-nav):first,article:first,.article:first,.post:first',
            $content = $(contentSelector).filter(':first'),
            contentNode = $content.get(0),
            $menu = $('.sidebar > .side-nav').filter(':first'),
            activeClass = 'active',
            activeSelector = '.active',
            menuChildrenSelector = '> li,> ul > li,> li > ul > li',
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
            $this.find('a:internal:not(.no-ajaxy)').click(function(event){
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
            //$content.animate({opacity:0},800);

            // Ajax Request the Traditional Page
            $.ajax({
                url: url,
                success: function(data, textStatus, jqXHR){
                    // Prepare
                    var
                        $data = $(documentHtml(data)),
                        $dataBody = $data.find('.document-body:first'),
                        $dataContent = $dataBody.find(contentSelector).filter(':first'),
                        $menuChildren, contentHtml, $scripts;

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
                    $menuChildren = $menu.find(menuChildrenSelector);
                    $menuChildren.filter(activeSelector).removeClass(activeClass);
                    $menuChildren = $menuChildren.has(
                                'a[href^="'+relativeUrl+'"],' +
                                'a[href^="/'+relativeUrl+'"],' +
                                'a[href^="'+url+'"]' +
                                'a[data-url^="'+relativeUrl+'"]'

                    );

//                    if ( $menuChildren.length === 1 ) { $menuChildren.addClass(activeClass); }



                    // Update the content
                    $content.stop(true,true);
                    $content.html(contentHtml).ajaxify().css('opacity',100).show(); /* you could fade in here if you'd like */

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

                    // Complete the change
                    if ( $body.ScrollTo||false ) { $body.ScrollTo(scrollOptions); } /* http://balupton.com/projects/jquery-scrollto */
                    $body.removeClass('loading');
                    $window.trigger(completedEventName);

                    // Inform Google Analytics of the change
                    if ( typeof window._gaq !== 'undefined' ) {
                        window._gaq.push(['_trackPageview', relativeUrl]);
                    }

                    // Inform ReInvigorate of a state change
                    if ( typeof window.reinvigorate !== 'undefined' && typeof window.reinvigorate.ajax_track !== 'undefined' ) {
                        reinvigorate.ajax_track(url);
                        // ^ we use the full url here as that is what reinvigorate supports
                    }
                },
                error: function(jqXHR, textStatus, errorThrown){
                    document.location.href = url;
                    console.log('Error Loading Document!!!');
                    return false;
                }
            }); // end ajax

        }); // end onStateChange

    }); // end onDomLoad

});