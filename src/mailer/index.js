var nodeMailer = require('nodemailer');
var transporter = nodeMailer.createTransport({
    host:   'mailer.com',
    port:   25,
    auth: {
        user: 'chris',
        pass: '1234'
    }
});


module.exports = function() {
    transporter.sendMail({
        from:   'trudesk@123.org',
        to:     'polonel@gmail.com',
        subject:    'Testing TruDesk Email',
        text:       'Hello this is from TruDesk'
    });

    console.log('mail sent');
};


