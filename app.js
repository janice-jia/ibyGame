var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var routes = require('./routes/index');
var users = require('./routes/users');
var game = require('./routes/game');


var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'ibySession',
    cookie: {maxAge: 60 * 1000},
    resave: false,
    saveUninitialized: true
}));


// catch 从分享进来的如果不是首页链接则跳转回首页链接
app.use(function (req, res, next) {
    if (req.originalUrl == '/') {
        req.session.filterShare = true;
        next();
    } else {
        if(!req.session.filterShare){
            res.redirect('/');
        }else{
            next();
        }
    }
});


app.use('/', routes);
app.use('/users', users);
app.use('/game', game);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    console.info(11111111111111111);
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
