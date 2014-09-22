$j = jQuery.noConflict();

var socket = io();
socket.on('receivedMessage', function(data) {
    console.log(data);
    var messages = $j('.chat-box[data-chat-userId="' + data.to + '"]').find('.chat-box-messages .chat-message-list');
    messages.append(createChatMessageDiv(data.message));
    messages.parent().getNiceScroll(0).resize().doScrollTop(messages.height() + 500, 100);
});

$j(document).ready(function() {
    socket.emit('userOnline',
        {
            id: 2
        }
    );
    //Auto Growing TextArea
    //$j('.textAreaAutogrow').autogrow({onInitialize: true});
    $j('textarea.textAreaAutogrow').autogrow({
        postGrowCallback: chatBoxTextAreaGrowCallback,
        enterPressed: function(self, v) {
            var messages = self.parent().siblings('.chat-box-messages');
            //var messageDiv = createChatMessageDiv(v);
            //messages.children('.chat-message-list').append(messageDiv);
            messages.getNiceScroll(0).resize().doScrollTop(messages.height(), 100);
            socket.emit('receivedMessage',
                {
                    to: self.parents('.chat-box').attr('data-chat-userId'),
                    message: v
                });
        }
    });
    $j('.chat-box-text').click(function(e) {
        if ($j(this).children('textarea').is(":focus")) {
            e.stopPropagation();
            return false;
        }

        $j(this).children('textarea').focus();
        var val = $j(this).children('textarea').val();
        $j(this).children('textarea').val('').val(val);
    });
    $j('.chatCloseBtn').click(function() {
        $j(this).parents('.chat-box[data-chat-userId]').remove();
    });
    $j('.chat-box-title').click(function() {
        var p = $j(this).parents('.chat-box-position');
        if (p.css('top') === '-252px') {
            p.animate({
                top: 0
            }, 250);
        } else {
            p.animate({
                top: -252
            }, 250);
        }
    });
});

function createChatMessageDiv(v) {
    var html  = '<div class="chat-message chat-message-user clearfix" data-chat-messageId="12">';
    html += '<div class="chat-text-wrapper">';
    html += '<div class="chat-text chat-text-user">';
    html += '<div class="chat-text-inner"><span>' + v + '</span>';
    html += '</div></div></div></div>';

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