define('modules/chat',[
    'jquery',
    'socketio',
    'underscore',
    'modules/helpers',
    'autogrow'

], function($, io, _, helpers) {
    var chatClient = {};
    var socket = io.connect();

    chatClient.init = function() {

    };

    socket.removeAllListeners('connect');
    socket.on('connect', function(data) {
        socket.emit('joinChatServer');
    });

    socket.removeAllListeners('connectingToSocketServer');
    socket.on('connectingToSocketServer', function(data) {

    });

    socket.removeAllListeners('updateUsers');
    socket.on('updateUsers', function(data) {
        var html = '';
        var onlineList = $('#online-Users-List').find('> ul');
        onlineList.html('');
        var username = $('.profile-name[data-username]').attr('data-username');
        _.each(data, function(v, k) {
            var onlineUser = v.user;
            if (onlineUser.username === username) return true;
            var imageUrl = onlineUser.image;
            if (_.isUndefined(imageUrl)) imageUrl = 'defaultProfile.jpg';
            html += '<li>';
            html += '<a class="messageNotification no-ajaxify" data-action="startChat" data-chatUser="' + onlineUser._id + '" href="#" role="button">';
            html += '<div class="clearfix">';
            html += '<div class="profilePic left"><img src="/uploads/users/' + imageUrl + '" alt="profile"/></div>';
            html += '<div class="messageAuthor"><strong>' + onlineUser.fullname + '</strong></div>';
            html += '<div class="messageSnippet">';
            html += '<span>' + onlineUser.title + '</span>';
            html += '</div>';
            html += '<div class="messageDate">';
            html += '<time datetime="2014-08-25T12:00" class="timestamp">Aug 25</time>';
            html += '</div>';
            html += '</div>';
            html += '</a>';
            html += '</li>';
        });

        onlineList.append(html);
        chatClient.bindActions();
    });

    socket.removeAllListeners('spawnChatWindow');
    socket.on('spawnChatWindow', function(data) {
        chatClient.openChatWindow(data);
    });

    socket.removeAllListeners('chatMessage');
    socket.on('chatMessage', function(data) {
        var type = data.type;
        var to = data.to;
        var from = data.from;
        var chatBox = '',
            chatMessage = '',
            chatMessageList = '',
            scroller = '',
            selector = '';

        if (type === 's') {
            chatBox = $('.chat-box[data-chat-userId="' + to + '"]');
            chatMessage = createChatMessageDiv(data.message);
            chatMessageList = chatBox.find('.chat-message-list:first');
            scroller = chatBox.find('.chat-box-messages');
            chatMessageList.append(chatMessage);
            helpers.scrollToBottom(scroller);
        } else if (type === 'r') {
            selector = '.chat-box[data-chat-userId="' + from + '"]';
            chatBox = $(selector);
            if (chatBox.length < 1) {
                chatClient.openChatWindow(data.fromUser);
                chatBox = $(selector);
            }

            chatMessage = createChatMessageFromUser(data.fromUser, data.message);
            chatMessageList = chatBox.find('.chat-message-list:first');
            chatMessageList.append(chatMessage);

            scroller = chatBox.find('.chat-box-messages');
            helpers.scrollToBottom(scroller);
        }
    });

    chatClient.bindActions = function() {
        $(document).ready(function() {
            $('*[data-action="startChat"]').each(function() {
                var self = $(this);
                self.off('click');
                self.click(function(e) {
                    var user = self.attr('data-chatUser');
                    socket.emit('spawnChatWindow', user);
                    e.preventDefault();
                });
            });


            $('textarea.textAreaAutogrow').off('keydown');
            $('textarea.textAreaAutogrow').autogrow({
                postGrowCallback: chatBoxTextAreaGrowCallback,
                enterPressed: function(self, v) {
                    var messages = self.parent().siblings('.chat-box-messages');
                    //var messageDiv = createChatMessageDiv(v);
                    //messages.children('.chat-message-list').append(messageDiv);
                    helpers.scrollToBottom(messages);
                    //messages.getNiceScroll(0).resize().doScrollTop(messages.height(), 100);
                    socket.emit('chatMessage',
                        {
                            to: self.parents('.chat-box').attr('data-chat-userId'),
                            from: $('.profile-name[data-userId]').attr('data-userId'),
                            type: 's',
                            message: v
                        });
                }
            });

            $('.chat-box-text').off('click');
            $('.chat-box-text').click(function(e) {
                if ($(this).children('textarea').is(":focus")) {
                    e.stopPropagation();
                    return false;
                }

                $(this).children('textarea').focus();
                var val = $(this).children('textarea').val();
                $(this).children('textarea').val('').val(val);
            });
            $('.chatCloseBtn').off('click');
            $('.chatCloseBtn').click(function() {
                $(this).parents('.chat-box[data-chat-userId]').remove();
            });
            $('.chat-box-title').off('click');
            $('.chat-box-title').click(function() {
                console.log('bind');
                var p = $(this).parents('.chat-box-position');
                if (p.css('top') === '-252px') {
                    p.animate({
                        top: -19
                    }, 250);
                } else {
                    p.animate({
                        top: -252
                    }, 250);
                }
            });
        });
    }

    chatClient.openChatWindow = function(user) {
        var username = $('.profile-name[data-username]').attr('data-username');
        if (user.username === username) return true;

        var cWindow = $('.chat-box-position').find('.chat-box[data-chat-userId="' + user._id + '"]');
        if (cWindow.length > 0) {
            cWindow.find('textarea').focus();
            return true;
        }

        var html = '<div class="chat-box-position">';
            html += '<div class="chat-box" data-chat-userId="' + user._id + '">';
            html += '<div class="chat-box-title">';
            html += '<div class="chat-box-title-buttons right">';
            html += '<a href="#" class="chatCloseBtn"><i class="fa fa-times"></i></a>';
            html += '</div>';
            html += '<h4 class="chat-box-title-text-wrapper">';
            html += '<a href="#">' + user.fullname + '</a>';
            html += '</h4>';
            html += '</div>';
            html += '<div class="chat-box-messages scrollable">';
            html += '<div class="chat-message-list" data-chat-userId="' + user._id + '">';
            html += '</div>';
            html += '</div>';
            html += '<div class="chat-box-text">';
            html += '<textarea class="textAreaAutogrow autogrow-short" name="message" rows="1"></textarea>';
            html += '</div>';
            html += '</div>';
            html += '</div>';

        $('.chat-box-wrapper').append(html);
        helpers.setupScrollers('.chat-box[data-chat-userId="' + user._id + '"] > div.scrollable');
        this.bindActions();
    };

    function createChatMessageDiv(message) {
        var html  = '<div class="chat-message chat-message-user clearfix" data-chat-messageId="12">';
        html += '<div class="chat-text-wrapper">';
        html += '<div class="chat-text chat-text-user">';
        html += '<div class="chat-text-inner"><span>' + message + '</span>';
        html += '</div></div></div></div>';

        return html;
    }

    function createChatMessageFromUser(user, message) {
        var imageUrl = user.image;
        if (_.isUndefined(imageUrl)) imageUrl = 'defaultProfile.jpg';
        var html  = '<div class="chat-message clearfix">';
            html += '<div class="chat-user-profile"><a href="#"><img src="/uploads/users/' + imageUrl + '" alt="' + user.fullname + '"/></a></div>';
            html += '<div class="chat-text-wrapper">';
            html += '<div class="chat-text">';
            html += '<div class="chat-text-inner">';
            html += '<span>' + message + '</span>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';

        return html;
    }

    function chatBoxTextAreaGrowCallback(self, oldHeight, newHeight) {
        if (oldHeight === newHeight)
            return true;

        var textAreaHeight = self.parent().outerHeight();
        var messages = self.parent().siblings('.chat-box-messages');

        switch (textAreaHeight) {
            case 29:
                messages.height(204);
                break;
            case 46:
                messages.height(187);
                break;
            case 63:
                messages.height(172);
                break;
            default:
                messages.height(156);
        }

        var ns = messages.getNiceScroll(0);
        if (ns) {
            ns.resize();
            ns.doScrollTop(99999, 100);
        }
    }

    return chatClient;
});