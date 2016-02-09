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

define('pages/accounts', [
    'underscore',
    'jquery',
    'modules/helpers',
    'uikit',
    'inview',
    'nicescroll',
    'datatables',
    'dt_responsive',
    'dt_grouping',
    'dt_foundation',
    'dt_scroller',
    'history'

], function(_, $, helpers, UIkit) {
    var accountsPage = {};

    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

    accountsPage.init = function() {
        $(document).ready(function() {
            accountsPage.setupGrid();
        });
        UIkit.ready(function() {
            Waypoint.refreshAll();
            helpers.resizeAll();

            $('.s-ajaxify').on('click', function (e) {
                e.preventDefault();
                var href = $(e.target).attr('href');

                History.pushState(null, null, href);
            });
        });
    };



    accountsPage.setupGrid = function() {
        // get all filters
        //var userArray = [];
        var $account_list = $('#account_list');
        //$account_list.children().each(function() {
        //    var thisfilter = $(this).attr('data-uk-filter');
        //    if (!_.isUndefined(thisfilter)) {
        //        if ( $.inArray( thisfilter, userArray ) == -1) {
        //            userArray.push(thisfilter.split(',')[1]);
        //        }
        //    }
        //});
        //var userArray_length = userArray.length;

        // initialize dynamic grid
        var myGrid = UIkit.grid($account_list,{
            controls: '#account_list_filter',
            gutter: 20
        });

        var scrollspy = $('#scrollspy'),
            $scroller = $account_list.parents('.scrollable'),
            spinner = scrollspy.find('i'),
            $filterAll = $('.filter-all'),
            getAccounts = function() {
                if (!$filterAll.hasClass('uk-active')) return true;
                var page = $("#__accounts-page");
                spinner.removeClass('uk-hidden');
                if (_.isNaN(parseInt(page.text()))) {
                    console.log('[trudesk:accountsPage:setupGrid] - Error: Invalid Page Number...');
                    return false;
                }
                var pageNum = parseInt(page.text());

                $.ajax({
                    url: '/api/v1/users?page=' + pageNum
                }).done(function (data) {
                    spinner.addClass('uk-hidden');
                    var users = data.users;
                    if (_.size(users) < 1) return true;
                    _.each(users, function (u) {
                        var html = buildUserHTML(u, false);
                        if (html.length > 0) $account_list.append(html);
                    });

                    UIkit.$html.trigger('changed.uk.dom');

                    console.log(pageNum);
                    page.text(pageNum + 1);
                }).fail(function (err) {
                    console.log('[trudesk:accountsPage:setupGrid] - Error: ' + err.error);
                });
            };

        setTimeout(function() {
            //scrollspy.waypoint({
            //    handler: _.throttle(function(direction) {
            //        if (direction !== 'down') return;
            //        getAccounts();
            //    }, 50, { trailing: false}),
            //    context: $scroller,
            //    offset: '110%',
            //    continuous: false
            //});

            setInterval(function() {
                if (UIkit.Utils.isInView(scrollspy, {topoffset: 100}))
                    _.throttle(function() {
                        getAccounts();
                    }, 2000, {trailing: false});
            }, 2000);

            //new Waypoint.Inview({
            //    entered: _.throttle(function(direction) {
            //        getAccounts();
            //    }, 100, {trailing: false}),
            //    context: $scroller,
            //    element: scrollspy
            //});
        }, 2500);

        $('#account_list_filter li a').on('click', function() {
            $('#account_list_search').val('');
            $('.tru-card[data-search-result]').remove();
            setTimeout(function() {
                helpers.resizeAll();
            }, 280);
        });

        $("#account_list_search").keyup(function(e) {
            e.preventDefault();
            var key = event.keyCode || event.which;

            var sValue = $(this).val().toLowerCase();

            if (key === 13) {
                if (sValue.length < 3) {
                    $('#account_list_filter li.uk-active a').trigger('click');
                    return true;
                }

                $.ajax({
                    url: '/api/v1/users?search=' + sValue,
                    success: function(data) {
                        $account_list.children().css('display', 'none');
                        var users = data.users;
                        _.each(users, function(u) {
                            $account_list.append(buildUserHTML(u, true));
                        });

                        $('.s-ajaxify').on('click', function(e) {
                            e.preventDefault();
                            var href = $(e.target).attr('href');

                            History.pushState(null, null, href);
                        });

                        UIkit.$html.trigger('changed.uk.dom');
                        helpers.resizeAll();
                    },
                    error: function(error) {
                        console.log('[trudesk:accountsPage:setupGrid] - Error: ' + error.error );
                    }
                });
            }

            return false;
        });

        //// find user
        //$("#account_list_search").keyup(function(){
        //    var sValue = $(this).val().toLowerCase();
        //
        //    if(sValue.length > 2) {
        //        var filteredItems = '';
        //        for($i=0;$i<userArray_length;$i++) {
        //            if(userArray[$i].toLowerCase().indexOf(sValue) !== -1) {
        //                filteredItems += (filteredItems.length > 1 ? ',' : '') + userArray[$i];
        //            }
        //        }
        //        if(filteredItems){
        //            // filter grid items
        //            myGrid.filter(filteredItems);
        //            filteredItems = '';
        //        } else {
        //            // show all
        //            myGrid.filter('all');
        //        }
        //    } else {
        //        // reset filter
        //        myGrid.filter();
        //    }
        //
        //});
    };

    function buildUserHTML(user, addRemove) {
        if (!addRemove) {
            var $card = $('[data-card-username="' + user.username + '"]');
            if ($card.length > 0) return '';
        }

        var html    =  '<div data-uk-filter="' + user.role + ',' + user.fullname + '">';
            if (addRemove)
            html    +=      '<div class="tru-card tru-card-hover" data-card-username="' + user.username + '" data-search-result>';
            else
            html    +=      '<div class="tru-card tru-card-hover" data-card-username="' + user.username + '">';

            if (user.role == 'admin')
            html    +=          '<div class="tru-card-head tru-card-head-admin">';
            else
            html    +=          '<div class="tru-card-head">';

            html    +=              '<div class="tru-card-head-menu" data-uk-dropdown="{pos: \'bottom-right\'}">';
            html    +=                  '<i class="material-icons tru-icon">&#xE5D4;</i>';
            html    +=                  '<div class="uk-dropdown uk-dropdown-small">';
            html    +=                      '<ul class="uk-nav">';
            html    +=                          '<li><a href="/accounts/' + user.username + '" class="s-ajaxify">Edit</a></li>';
            html    +=                          '<li><a href="#" data-username="' + user.username + '" ng-click="deleteAccount($event)">Remove</a></li>';
            html    +=                      '</ul>';
            html    +=                  '</div>';
            html    +=              '</div>';
            html    +=              '<div class="text-center">';
            if (user.image)
            html    +=                  '<img src="/uploads/users/' + user.image + '" alt="Profile Pic" class="tru-card-head-avatar" />';
            else
            html    +=                  '<img src="/uploads/users/defaultProfile.jpg" alt="Profile Pic" class="tru-card-head-avatar" />';

            html    +=              '</div>';
            html    +=              '<h3 class="tru-card-head-text text-center">';
            html    +=                  user.fullname;
            html    +=                  '<span class="uk-text-truncate">' + (_.isUndefined(user.title) ? '' : user.title.capitalizeFirstLetter()) + '</span>';
            html    +=              '</h3>';
            html    +=          '</div>';
            html    +=          '<div class="tru-card-content">';
            html    +=              '<ul class="tru-list">';
            html    +=                  '<li>';
            html    +=                      '<div class="tru-list-content">';
            html    +=                          '<span class="tru-list-heading">Role</span>';
            html    +=                          '<span class="uk-text-small uk-text-muted">' + user.role.capitalizeFirstLetter() + '</span>';
            html    +=                      '</div>';
            html    +=                  '</li>';
            html    +=                  '<li>';
            html    +=                      '<div class="tru-list-content">';
            html    +=                          '<span class="tru-list-heading">Email</span>';
            html    +=                          '<span class="uk-text-small uk-text-muted uk-text-truncate"><a href="mailto:' + user.email + '">' + user.email + '</a></span>';
            html    +=                      '</div>';
            html    +=                  '</li>';
            html    +=                  '<li>';
            html    +=                      '<div class="tru-list-content">';
            html    +=                          '<span class="tru-list-heading">Groups</span>';
            html    +=                          '<span class="uk-text-small uk-text-muted uk-text-truncate">';
            html    +=                          '</span>';
            html    +=                      '</div>';
            html    +=                  '</li>';
            html    +=              '</ul>';
            html    +=          '</div>';
            html    +=      '</div>';
            html    +=  '</div>';

        return html;
    }

    return accountsPage;
});