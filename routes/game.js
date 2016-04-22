var express = require('express');
var router = express.Router();


router.get('/start', function(req, res, next) {
  res.render('start', { title: '开始游戏' });
});

router.get('/start1', function(req, res, next) {
  res.render('start', { title: '开始游戏' });
});

router.post('/luckydraw', function(req, res, next) {
  res.render('luckydraw', { title: '抽奖' });
});


module.exports = router;
