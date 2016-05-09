var express = require('express');
var session = require('express-session');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: '全国拼图大PK',layout: 'layout'});
});

module.exports = router;
