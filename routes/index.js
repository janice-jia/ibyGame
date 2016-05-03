var express = require('express');
var mongodb = require('../module/mongodb.js');
var router = express.Router();
var wechat_cfg = require('../config/wechat.cfg');
var signature = require('../module/signature.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: '全国拼图大PK'});
});

module.exports = router;
