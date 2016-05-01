var sendMail = require('./mailer');
var bodyParser = require('body-parser');

module.exports = function(app, viewsDir){

  app
  // MIDDLEWARE
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended: true}))
  // STATIC PAGES
  .get('/', function(req, res){
    res.sendFile(viewsDir + '/index.html');
  })
  .get('/work/alcatel-lucent', function(req, res){
    res.sendFile(viewsDir + '/work/alcatel.html');
  })
  .get('/work/discovery', function(req, res){
    res.sendFile(viewsDir + '/work/discovery.html');
  })
  .get('/work/geniac', function(req, res){
    res.sendFile(viewsDir + '/work/geniac.html');
  })
  // CONTACT FORM
  .post('/contact', function (req, res) {
    sendMail(req, res);
  });
};
