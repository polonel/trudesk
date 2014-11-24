var nodeMailer = require('nodemailer');
var transporter = nodeMailer.createTransport({
    host:   'granvillecounty.org',
    port:   25,
    auth: {
        user: 'chris.brame',
        pass: 'A03251969a'
    }
});


module.exports = function() {
    transporter.sendMail({
        from:   'trudesk@granvillecounty.org',
        to:     'polonel@gmail.com',
        subject:    'Testing TruDesk Email',
        text:       'Hello this is from TruDesk'
    });

    console.log('mail sent');
};


