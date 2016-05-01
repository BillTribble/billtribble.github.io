var express = require('express'),
    compression = require('compression'),
    path = require('path'),
    favicon = require('serve-favicon');

var app = express();
app.use(compression());

var environment = process.env.environment || 'development';

var baseDir = __dirname + '/rel/';
var viewsDir = baseDir + 'views/';

if (environment === 'development') {
  baseDir = __dirname;
  viewsDir = baseDir + '/views/';
}

app.use(favicon(baseDir + '/favicon.ico'));

// Server
app.use(express.static(baseDir, { 
	maxAge: ~~(Math.random() * 86400000) + 800000 // Sets a random expires time
}));

// Routes
require('./lib/routes.js')(app, viewsDir);

app.listen(process.env.PORT || 3000);
