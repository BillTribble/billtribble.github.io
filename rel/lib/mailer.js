var apiKey = 'key-9150e4ea4add94cdc4f32258f820db2c';
var domain = 'mailer.makeusproud.com';
var mailgun = require('mailgun-js')({apiKey: apiKey, domain: domain});
var sfs = require('spamcheck');

module.exports = function getData(req, res) {

  var data = {
    from: req.body.name + ' <' + req.body.email + '>',
    to: 'Make Us Proud <hello@makeusproud.com>',
    subject: 'Website contact',
    text: req.body.message
  };

  sfs.checkSpammer({
    ip: req.connection.remoteAddress,
    email: req.body.email
  }, function(err, isSpammer){
    if(!isSpammer){
      mailgun.messages().send(data, function (error, body) {
        if(body) {
          console.log('MESSAGE QUEUED: ', data);
          res.statusCode = 200;
          res.end();
        } else {
          console.log('MAILER ERROR: ', error);
          res.statusCode = 404;
          res.end();
        }
      });
    }
  });
    
};
