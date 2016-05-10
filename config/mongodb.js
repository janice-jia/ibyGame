//mongo本地配置
//var db = require('mongoskin').db('mongodb://xiaojia:qwe123@localhost:27017/mongoskin');
//db.bind('mongoskin');


//mongo外网配置
var db = require('mongoskin').db('mongodb://root:123456@mongo.dbserver:27017/bykj_act');
db.bind('bykj_act');

module.exports = db;