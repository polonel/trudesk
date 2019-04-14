/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define('modules/tour', ['jquery', 'shepherd', 'uikit', 'tether'], function ($, Shepherd, UIKit) {
  var tour = {}

  tour = new Shepherd.Tour({
    defaults: {
      classes: 'shepherd-theme-square shepherd-theme-arrows'
    }
  })

  tour.addStep('welcome', {
    title: 'Welcome!',
    text:
      '<div class="logo" style="margin-left: 70px;">' +
      '<svg style="width: 140px; height: 75px;" viewBox="0 0 288.9 70.1">' +
      '<path style="fill: #222;" d="M28.5,28.4c-0.1,1.6-0.7,3.4-1.6,5.4c-2.4-0.3-4.6-0.4-6.8-0.4h-1.7c-2.9,13.9-4.3,22.6-4.3,26.1 c0,1.8,0.4,2.7,1.2,2.7c0.8,0,2.9-0.8,6.2-2.3l1.7,3.1C17.7,67.7,12.5,70,7.8,70c-2.2,0-4-0.7-5.4-2.1c-1.4-1.4-2.1-3.2-2.1-5.5	c0-2.3,0.3-4.9,0.8-7.7c0.5-2.9,1.3-6.4,2.2-10.6c0.9-4.2,1.6-7.5,2.1-10.1c-2.3,0.2-4,0.4-5.2,0.6c-0.1-0.8-0.2-1.8-0.2-3	c0-1.3,0.1-2.3,0.3-3.1h5.9c0.5-3.4,0.8-6.6,0.8-9.6L6.8,16v-0.3c4.9-1.7,9.5-2.5,13.8-2.5c0.2,1.3,0.4,2.8,0.4,4.7	c0,1.9-0.5,5.4-1.6,10.6H28.5z"/>' +
      '<path style="fill: #222;" d="M29.6,69.1H29c-0.1-0.5-0.2-1.6-0.2-3.4c0-1.8,0.8-6.6,2.5-14.4c1.7-7.8,2.5-12.3,2.5-13.4	c0-1.9-0.9-4.1-2.6-6.4l-0.8-1.1l0.1-1.2c3.4-0.9,8.8-1.4,16.2-1.4c0.8,1.6,1.1,3.9,1.1,6.8c0.7-1.1,2.1-2.6,4.3-4.5	c2.2-1.9,4.4-2.8,6.8-2.8c3.4,0,5.1,2.9,5.1,8.8c-0.3,0.4-0.7,0.9-1.3,1.5c-0.5,0.6-1.6,1.4-3.2,2.5c-1.6,1.1-3.1,1.7-4.6,2	c-0.1,0-0.6-0.8-1.6-2.5c-1-1.7-1.8-2.5-2.3-2.5c-1.6,0.6-2.9,1.5-4.1,2.8c-2.9,12.9-4.3,21.3-4.3,25.1c0,1.4,0,2.3,0.1,2.9	C40.5,68.7,36.2,69.1,29.6,69.1z"/>' +
      '<path style="fill: #222;" d="M62.7,61.8c0-2.7,0.8-7.2,2.4-13.7c1.6-6.5,2.4-10.4,2.4-11.9c0-1.5-1.1-3.4-3.4-5.9l0.1-1.2	c4.3-0.9,9.9-1.3,16.8-1.3c0.3,0.8,0.5,2.3,0.5,4.4c0,2.1-0.9,6.7-2.6,13.6c-1.8,6.9-2.6,11.3-2.6,12.9s0.6,2.5,1.9,2.5	c1.8,0,3.9-0.7,6.3-2c0.3-1.5,0.9-4.4,1.9-8.6c2.3-10,3.4-17.2,3.4-21.5c2.2-0.9,6.1-1.3,11.8-1.3h1.8c0,2.9-0.9,8.7-2.6,17.2	c-1.8,8.5-2.6,13.5-2.6,15c0,1.5,0.3,2.2,0.9,2.2c0.4,0,2.2-0.8,5.3-2.3l1.8,3c-5.6,4.6-10.4,6.9-14.6,6.9c-2,0-3.7-0.6-5.1-1.7	c-1.4-1.1-2.2-2.6-2.4-4.4c-5.1,4.1-9.7,6.2-13.8,6.2c-2.2,0-4-0.7-5.4-2.2C63.4,66.5,62.7,64.4,62.7,61.8z"/>' +
      '<path style="fill: #222;" d="M153.2,63.1c-5.3,4.6-10,6.8-14,6.8c-4,0-6.4-2-7-6c-1.9,1.9-4,3.3-6.3,4.4c-2.3,1.1-4.3,1.6-6.1,1.6	c-3,0-5.6-1.3-7.7-3.9c-2.1-2.6-3.2-6.7-3.2-12.2c0-8.3,1.8-14.7,5.3-19.5c3.5-4.7,7.5-7.1,11.9-7.1c4.4,0,8.1,1,11.1,3	c1.9-10.1,2.9-18.1,2.9-23.9l-0.5-3.9c4.7-1.6,9.3-2.4,13.8-2.4c0.5,1.1,0.8,2.3,0.8,3.7c0,4.6-1.4,13.8-4.1,27.8	c-2.8,14-4.1,23.5-4.1,28.5c0,1.5,0.3,2.3,1,2.3c0.4,0,1.6-0.6,3.6-1.8l0.9-0.6L153.2,63.1z M130.6,32.8c-2.2,0-4.1,2.2-5.7,6.5	c-1.6,4.3-2.4,8.6-2.4,12.8c0,4.2,0.3,6.9,0.9,8.1c0.6,1.2,1.5,1.8,2.7,1.8c2.1,0,4.1-0.8,6.1-2.5c0.2-2.5,1.6-10.8,4.2-25	C134.3,33.4,132.3,32.8,130.6,32.8z"/>' +
      '<path style="fill: #222;" d="M155.5,52.6c0-7.8,2.4-14,7.1-18.5c4.7-4.5,10.1-6.8,16.1-6.8c3.7,0,6.7,0.9,9.1,2.7c2.4,1.8,3.6,4.2,3.6,7.3	c0,3-0.8,5.6-2.3,7.6c-1.5,2.1-3.4,3.7-5.6,4.8c-4.4,2.2-8.5,3.6-12.2,4.1l-2.3,0.3c0.4,5.9,2.8,8.8,7.2,8.8c1.5,0,3.1-0.4,4.8-1.1	c1.7-0.8,3-1.5,3.9-2.3l1.4-1.1l2.3,3c-0.5,0.7-1.5,1.6-3,2.7c-1.5,1.1-2.9,2.1-4.2,2.8c-3.6,2-7.6,3-11.9,3 c-4.3,0-7.7-1.5-10.2-4.6C156.7,62.3,155.5,58.1,155.5,52.6z M176.5,45.5c1.9-2.1,2.8-4.9,2.8-8.3c0-3.4-1-5.1-3-5.1	c-2.4,0-4.2,2-5.5,6.1c-1.3,4-1.9,7.8-1.9,11.3C172.1,49,174.6,47.6,176.5,45.5z"/>' +
      '<path style="fill: #222;" d="M223.2,56.6c0,3.9-1.7,7.2-5.2,9.7c-3.5,2.5-7.4,3.8-11.9,3.8c-4.4,0-8-0.9-10.6-2.8c-2.6-1.9-3.9-3.5-3.9-5	c0-0.9,1.1-2.3,3.3-4.3c2.2-2,4-3.2,5.5-3.6c3.1,2.3,5.7,6,7.7,11c2.3-0.2,3.5-1.3,3.5-3.3c0-2.9-2.5-7-7.6-12.2	c-5.1-5.3-7.6-9.5-7.6-12.6c0-3.1,1.4-5.5,4.2-7.3c2.8-1.7,6.2-2.6,10.2-2.6c4,0,7,0.7,9,2.1c2,1.4,3,3.3,3,5.7	c0,2.4-1.9,5.7-5.7,10c0.4,0.4,1,1,1.7,1.7c0.7,0.7,1.6,2.1,2.7,4.1C222.6,52.9,223.2,54.8,223.2,56.6z M218.1,35.2	c0-2.2-1.5-3.3-4.5-3.3c-1.4,0-2.6,0.3-3.6,0.9c-0.9,0.6-1.4,1.3-1.4,2c0,1.4,1.4,3.3,4.1,5.8l1.4,1.2	C216.8,39.6,218.1,37.4,218.1,35.2z"/>' +
      '<path style="fill: #222;" d="M238.1,6.9c0-2.1-0.2-3.5-0.6-4.4C242.4,0.8,247,0,251.3,0c0.6,0.6,0.8,2,0.8,4.3c0,5.2-1.7,15.1-5.2,29.8	c5.6-4.6,11.1-6.8,16.5-6.8c2.4,0,4.5,0.8,6.2,2.3c1.7,1.5,2.5,3.7,2.5,6.6c0,5.4-4.4,9.3-13.2,11.7c2.1,6.5,3.9,10.9,5.4,13.2	c0.7,1,1.2,1.5,1.5,1.5c0.7,0,2.1-0.5,4.3-1.6l1-0.5l1.5,3.2c-1.5,1.4-3.6,2.8-6.2,4.2c-2.7,1.4-5.1,2.1-7.3,2.1	c-4.9,0-8.3-4.4-10.2-13.3c-0.9-3.8-1.4-7.4-1.6-10.7c4-0.9,7-2.1,9-3.4c2-1.3,3-3.1,3-5.2c0-2.1-1.1-3.1-3.2-3.1	c-2.1,0-5.7,2.1-10.7,6.4c-3.1,13.2-4.7,22.2-4.7,27.1c-3.4,1-7.9,1.5-13.4,1.5c-0.1-1.1-0.1-2-0.1-2.8c0-2.7,1.8-11.9,5.4-27.6	C236.3,23.1,238.1,12.5,238.1,6.9z"/>' +
      '<circle style="fill: #E74C3C;" cx="284.9" cy="64.7" r="4"/>' +
      '</svg>' +
      '</div>' +
      "Welcome to the trudesk tour! <br /> I'm going to guide you through the system and show you around a little. <br /><br />" +
      '<span style="font-style: italic;">You may choose to skip the tour if you do not require it. Simply press the skip button below.</span>',
    buttons: [
      {
        text: 'Lets Start',
        action: tour.next
      },
      {
        text: 'Skip',
        classes: 'uk-float-left',
        action: function () {
          var username = window.trudeskSessionService.getUser().username
          $.ajax({
            url: '/api/v1/users/' + username + '/updatepreferences',
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            data: JSON.stringify({
              preference: 'tourCompleted',
              value: true
            }),
            success: function () {
              tour.cancel()
            },
            error: function (error) {
              console.error(error)
            }
          })
        }
      }
    ],
    when: {
      show: function () {
        var overlay = $('#serverRestarting')
        overlay.css('z-index', 999).removeClass('hide')
        overlay.find('*').hide()
      },
      hide: function () {
        var overlay = $('#serverRestarting')
        overlay.animate({ opacity: 0 }, 500, function () {
          overlay.css('z-index', 9999).addClass('hide')
          overlay.find('*').show()
        })
      }
    }
  })

  tour.addStep('dashboard', {
    title: 'Dashboard',
    text: 'This is your dashboard screen. It will show you stats at a glance.'
  })

  tour.addStep('topbar', {
    title: 'Top Nav',
    text: 'This is your top nav. It has quick links to frequently used functions and notifications.',
    attachTo: '.top-nav bottom'
  })

  tour.addStep('addTicket', {
    title: 'Quick Link - Add Ticket',
    text:
      '<strong> Add Ticket </strong> quick link will is the fastest way to submit and enter a ticket. Go ahead give it a push!',
    attachTo: '.top-menu .tour-addTicket bottom',
    buttons: [],
    when: {
      show: function () {
        var $target = $('.tour-addTicket')
        $target.on('click', advanceTourDelayed)
        $('button.uk-modal-close').attr('disabled', true)
        $('button#submitNewTicket').attr('disabled', true)
      },
      hide: function () {
        setTimeout(function () {
          var $target = $('.tour-addTicket')
          $target.off('click', advanceTourDelayed)
        }, 5000)
      }
    }
  })

  tour.addStep('addTicketForm', {
    title: 'Add Ticket Form',
    text:
      "The great ticket form. Use this to submit new request. Don't worry it's pretty simple. Remember, always try to be as detailed as possible.",
    attachTo: '#ticketCreateModal .uk-modal-dialog left',
    when: {
      hide: function () {
        UIKit.modal($('#ticketCreateModal')).hide()
      }
    }
  })

  tour.addStep('messagesIcon', {
    title: 'Messages Notification',
    text: 'Here you will see your notification for chat messages sent by other users.',
    attachTo: '.tour-messagesNotification bottom'
  })

  tour.addStep('ticketNotifications', {
    title: 'Ticket Notifications',
    text: "This is where you'll get notification updates about tickets.",
    attachTo: '.tour-ticketNotifications bottom'
  })

  tour.addStep('onlineUserListButton', {
    title: 'Chat - User List',
    text: 'Push this to open the user list to quickly send a message to any user.',
    attachTo: '.tour-onlineUserListButton bottom',
    buttons: [],
    // advanceOn: '.tour-onlineUserListButton click',
    when: {
      show: function () {
        var $target = $('.tour-onlineUserListButton')
        $target.on('click', function () {
          setTimeout(function () {
            tour.show('onlineUserList')
          }, 300)
        })
      },
      hide: function () {
        var $target = $('.tour-onlineUserListButton')
        $target.off('click')
      }
    }
  })

  tour.addStep('onlineUserList', {
    title: 'Chat - User List',
    text: 'There it is! Your user list. Lets move on!',
    when: {
      hide: function () {
        // History.pushState(null, null, '/tickets');
      }
    }
  })

  // tour.addStep('profileButton', {
  //     title: 'Profile',
  //     text: 'Clicking your profile picture will open up your profile dropdown.',
  //     attachTo: 'img#profileImage bottom'
  // });

  tour.addStep('sidebar_tickets', {
    title: 'Tickets',
    text: "This is the core of trudesk. You'll find all your current and past tickets located here.",
    attachTo: '.navTickets right',
    buttons: [],
    when: {
      show: function () {
        UIKit.offcanvas.hide()
        // $('#page-content').css({background: 'rgba(0,0,0,0.5)'});
        $('#page-content').css({ opacity: 0.5 })
        var $target = $('.navTickets')
        $target.on('click', function () {
          tour.next()
        })
      }
    }
  })

  tour.addStep('tickets_page', {
    title: 'Tickets',
    text:
      'Here you will find all new, open, or pending tickets. If any tickets are overdue they will flash red. <br /><br />' +
      'Take a minute to review this screen and click next to proceed.'
  })

  tour.addStep('sidebar_messages', {
    title: 'Messages',
    text: 'This will take you to your messages. Messages are sent between users privately and securely.',
    attachTo: '.navMessages right',
    buttons: [],
    when: {
      show: function () {
        var $target = $('.navMessages')
        $target.on('click', function () {
          setTimeout(function () {
            tour.next()
          }, 1000)
        })
      }
    }
  })

  tour.addStep('message_list', {
    title: 'Message List',
    text:
      'Here you will find your current active conversations. If there are no current conversation, you can start a conversation. We will view that next.',
    attachTo: 'ul.message-items right'
  })

  tour.addStep('start_conversation', {
    title: 'Start New Conversation',
    text: 'Simply click the (+) sign to start a new conversation with a user.',
    attachTo: '#convo-actions a right',
    buttons: [],
    when: {
      show: function () {
        var $target = $('#convo-actions a')
        $target.on('click', function () {
          tour.next()
        })
      }
    }
  })

  tour.addStep('all_user_list', {
    title: 'User List',
    text:
      'Here you will find the same list as before, the all user list. Clicking on a user will start the conversation.',
    attachTo: '#new-convo-user-list right',
    when: {
      show: function () {
        $('.all-user-list *').css({ 'pointer-events': 'none' })
      }
    }
  })

  tour.on('complete', function () {})

  tour.init = function () {
    tour.start()
  }

  function advanceTourDelayed () {
    setTimeout(function () {
      tour.next()
    }, 300)
  }

  return tour
})
