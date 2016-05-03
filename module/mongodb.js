//mongoskin链接
//var db = require('mongoskin').db('mongodb://superadmin:123456@192.168.1.6:10000/bykj_act');
var db = require('mongoskin').db('mongodb://xiaojia:qwe123@localhost:27017/mongoskin');
db.bind('mongoskin');


module.exports = db;