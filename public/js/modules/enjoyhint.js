/**
 .                              .o8                     oooo
 .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    06/05/2015
 Author:     Chris Brame

 **/

define('modules/enjoyhint', [
    'jquery',
    'modules/helpers',
    'enjoyhint',
    'history'

], function($, helpers) {
    var enjoyhint = {};
    var enjoyhint_instance = null;
    enjoyhint.init = function() {
        $(document).ready(function() {
            enjoyhint_instance = new EnjoyHint({

            });

            var enjoyhint_steps = [
                {
                    'next .logo>img' : 'Welcome to the guided <span style="color: #e74c3c;">tour.</span> <br />' +
                        'We will walk you through the use of trudesk. <br /><br />' +
                        '<span style="color: #e74c3c">If you wish you can skip the tour and continue it later.</span>',
                    margin: 10,
                    hideArrow: true
                },
//                {
//                    'click .fa-comments' : '<span style="color: #e74c3c;">Online Users:</span> This will show you which users are currently logged into trudesk.<br/>' +
//                        'Click the icon to open the dropdown.',
//                    'shape': 'circle',
//                    'showSkip' : false,
//                    'radius': 40
//                },
//                {
//                    'next #online-Users': 'This is the online users list.<br/>Here you can start a chat session with any online user.',
//                    'showSkip': false
//                },
//                {
//                    'click a[data-notifications="notifications"]': 'Lets open the <span style="color: #e74c3c;">notifications</span>.<br/>Click the icon.',
//                    'shape': 'circle',
//                    'radius': 40,
//                    'showSkip': false,
//                    onBeforeStart: function() {
//                        helpers.hideAllpDropDowns();
//                    }
//                },
//                {
//                    'next div#notifications': 'The <span style="color: #e74c3c;">notification</span> window shows system wide notifications.<br/>You can quickly access new and updated tickets from here.',
//                    margin: 10,
//                    showSkip: false
//                },
//                {
//                    'click a[data-notifications="mail-notifications"]': 'This is your <span style="color: #e74c3c;">message notifications</span>.<br/>It updates in real-time when a message arrives.',
//                    shape: 'circle',
//                    'radius': 40,
//                    showSkip: false,
//                    onBeforeStart: function() {
//                        helpers.hideAllpDropDowns();
//                    }
//                },
//                {
//                    'next div#mail-notifications': 'Unread Messages will show here.',
//                    margin: 10,
//                    showSkip: false
//                },
//                {
//                    'click a.eh-sendNewMessage': 'Lets send a message.<br/>Click "Send a New Message".',
//                    margin: 2,
//                    showSkip: false
//                },
//                {
//                    'click div#newMessageTo_chosen': 'Click the <span style="color: #e74c3c;">To:</span> box to open a dropdown of all available users.',
//                    margin: 4,
//                    showSkip: false
//                },
//                {
//                    'next div#newMessageTo_chosen>.chosen-drop': 'This is the list of all available users.<br/>You can start typing your name, then select it from the list.' +
//                                                                 '<br/><br/><span style="color: #e74c3c;">Once you select your name click Next.</span>',
//                    margin: 5,
//                    showSkip: false
//                },
//                {
//                    'next input#newMessageSubject': 'Click the <span style="color: #e74c3c;">Subject:</span> box and enter "Tour Message" into the subject.'+
//                                                     '<br/><br/><span style="color: #e74c3c;">Once you have a subject click Next.</span>',
//                    margin: 5,
//                    showSkip: false
//                },
//                {
//                    'next textarea#newMessageText': 'Message text will go here. For now I\'ll fill in some text for you. :)',
//                    margin: 5,
//                    showSkip: false,
//                    onBeforeStart: function() {
//                        var textarea = $('textarea#newMessageText');
//                        textarea.val('Tour Message. This is just a simple message sent during the interactive tour.');
//                    }
//                },
////                {
////                    'click button.eh-sendNewMessageButton': 'Click the <span style="color: #e74c3c;">Send Message</span> button to send the message to yourself.',
////                    margin: 5,
////                    showSkip: false
////                },
//                {
//                    'click a.navHome': 'Lets take a look at the dashboard. Click the <span style="color: #e74c3c;">Home</span> link.',
//                    margin: -2,
//                    showSkip: false,
//                    onBeforeStart: function() {
//                        $('#newMessageModal').foundation('reveal', 'close');
//                    }
//                },
//                {
//                    'next .eh-donutCharts': 'This is the current progress of all tickets within <span style="color: #e74c3c;">Trudesk.</span>',
//                    margin: 20,
//                    showSkip: false,
//                    timeout: 1500
//                },
                {
                    'click a.navTickets': 'Tickets',
                    showSkip: false,
                    margin: -2,
                    onBeforeStart: function() {
                        helpers.hideAllpDropDowns();

                    }
                },
                {
                    'next .top-nav': 'Next I\'ll show you around the Tickets within <span style="color: #e74c3c;">Trudesk.</span>.<br/>I\'ll go ahead and fill out a demo Ticket.',
                    margin: -5,
                    showSkip: false,
                    hideArrow: true,
                    onBeforeStart: function() {

                    }
                },
                {
                    'next table#ticketTable>tbody>tr': 'This is a ticket.',
                    'showSkip' : false,
                    //timeout: 1700,
                    onBeforeStart: function() {

                    }
                }
            ];

            enjoyhint_instance.set(enjoyhint_steps);

            enjoyhint_instance.run();
        });
    };

    enjoyhint.run = function() {
        if (enjoyhint_instance === null) return;
        enjoyhint_instance.run();
    };

    enjoyhint.setCurrentStep = function(step) {
        if (enjoyhint_instance === null) return;
        enjoyhint_instance.setCurrentStep(step);
    };

    enjoyhint.resume = function() {
        if (enjoyhint_instance === null) return;
        enjoyhint_instance.resumeScript();
    };

    enjoyhint.trigger = function(e) {
        if (enjoyhint_instance === null) return;
        enjoyhint_instance.trigger(e);
    };

    return enjoyhint;
});