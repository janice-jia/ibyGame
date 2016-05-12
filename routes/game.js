var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('../config/mongodb.js');
var router = express.Router();
var wechat_cfg = require('../config/wechat.cfg');
//var http = require('http');
//var cache = require('memory-cache');
var signature = require('../module/signature.js');
var async = require('async');


//拼图
router.get('/start', function(req, res, next) {
    var url = req.protocol + '://' + req.host + req.baseUrl + req.path; //获取当前url
    async.series({
        /* 获取项目动态 */
        signatureMap:function(callback){
            signature.sign(url,function(signatureMap){
                signatureMap.appId = wechat_cfg.appid;
                callback(null, signatureMap);
            });
        },
        /* 获取拼图难易度,行与列,值越大,难度越高 */
        difficultyLevel:function(callback){
            mongodb.collection('sys_parameter').findById('10004', function(err,data){
                callback(null, data.numValue);
            })
        }
    },function(err, results){
        res.render('start', {
            title: '开始游戏',
            signatureMap:results.signatureMap,
            difficultyLevel:results.difficultyLevel, /* 拼图难易度,行与列,值越大,难度越高 */
            //activityLogId:'sssssss'   //当前用户拼图_id
        });
    })

});

//查看规则
router.get('/rules', function(req, res, next) {
    res.render('rules', {title: '抽奖规则'});
});

//保存or更新访问统计
router.post('/log', function(req, res, next) {
    if(req.body._id){
        mongodb.collection('activity_game').updateById(req.body._id,{$set: {time: req.body.time,changeN: req.body.changeN,shareN: req.body.shareN}},function(err,data){
            if(!err){
                mongodb.collection('activity_game').findById(req.body._id, function(err,data){
                    res.send(data);
                })
            }
        });
    }else{
        mongodb.collection('activity_game').save(req.body,function(err,data){
            res.send(data.ops[0]);
        });
    }

});

//保存访问统计
router.post('/changeNum', function(req, res, next) {
    var activityLogId = req.body.activityLogId;
    mongodb.collection('activity_game').findById(activityLogId, function(err,data){
        mongodb.collection('activity_game').update(
            {_id: data._id},
            {$set: {changeN: parseInt(data.changeN) + 1}},
            {strict: true},function(err1,data1){
                res.send(data1);
            });
    });
});

//获取中奖次数
router.get('/changeNum', function(req, res, next) {
    var activityLogId = req.query.activityLogId;
    mongodb.collection('activity_game').findById(activityLogId,function(err,data){
        res.send(JSON.stringify(data));
    });
});

//微信分享成功之后改变状态
router.post('/share', function(req, res, next) {
    var activityLogId = req.body.activityLogId;
    mongodb.collection('activity_game').updateById(activityLogId,{$set: {shareN: true}},function(){
        res.send(true);
    });
});


//抽中奖品后添加联系信息
router.post('/addlog', function(req, res, next) {
    mongodb.collection('activity_awd_logs').save(req.body ,function(err,data){
        res.send(data.ops[0]);
    });
});


//抽奖页面
router.get('/luckydraw', function(req, res, next) {
    var activityLogId = req.query.activityLogId;
    var url = req.protocol + '://' + req.host + req.originalUrl; //获取当前url
    async.series({
        /* 微信签名 */
        signatureMap:function(callback){
            signature.sign(url,function(signatureMap){
                signatureMap.appId = wechat_cfg.appid;
                callback(null, signatureMap);
            });
        },
        drawList:function(callback){
            mongodb.collection('activity_awd_logs').find().toArray(function(err, data){
                callback(null,data);
            })
        },
        totalTimes:function(callback){
            mongodb.collection('activity_game').findById(activityLogId, function(err,data){
                if(data){
                    callback(null,data.time);
                }else{
                    callback(null,null);
                }
            })
        },
    },function(err, results){
        var totalTimes = 0;
        if(req.query.gameTime){
            var totalTimes = req.query.gameTime;
        }else{
            totalTimes = results.totalTimes;
        }
        if(activityLogId){
            var findStr = {};
            mongodb.collection('activity_lottery').find({actCd:"WX00002"}, {'grp': 0}).toArray(
                function(err,data){
                    if(totalTimes >= 90){
                        //设置奖品
                        setPrize(["20002", "20001", "20003", "Z9999", "Z9997", "Z9998"]);
                        data = orderData();
                    }else if(totalTimes >= 60 && totalTimes < 90){
                        // >= 60 && <90s  10元话费  20元话费 50元话费 100元话费 苏泊尔旅行杯 苏泊尔微压炒锅 谢谢参与
                        setPrize(["20002", "20001", "20003", "20004","20005", "20006", "Z9999", "Z9997", "Z9998"]);
                        data = orderData();
                    }else if(totalTimes >= 30 && totalTimes < 60){
                        // >= 30 && < 60s  10元话费  20元话费 50元话费 100元话费 苏泊尔旅行杯 苏泊尔微压炒锅 WHS滑雪服 旅行箱 谢谢参与
                        setPrize(["20002", "20001", "20003", "20004","20005", "20006", "20007", "20008", "Z9999", "Z9997", "Z9998"]);
                        data = orderData();
                    }else if(totalTimes < 30){
                        // < 30  10元话费  20元话费 50元话费 100元话费 苏泊尔旅行杯 苏泊尔微压炒锅 WHS滑雪服 旅行箱 iPhone SE 谢谢参与
                        setPrize(["20002", "20001", "20003", "20004","20005", "20006", "20007", "20008", "20009", "Z9999", "Z9997", "Z9998"]);
                        data = orderData();
                    }


                    //设置奖品
                    //奖品名称          奖品代码        奖品位置
                    //10元话费             20002           5
                    //20元话费             20001           1
                    //50元话费             20003           8
                    //100元话费            20004           3
                    //苏泊尔旅行杯         20005           7
                    //苏泊尔微压炒锅       20006           10
                    //WHS滑雪服            20007           2
                    //旅行箱               20008           4
                    //iPhone SE            20009           0
                    //谢谢参与             Z9999           6
                    //谢谢参与             Z9997           9
                    //谢谢参与             Z9998           11
                    function setPrize(prizeList){
                        for(var i = 0; i < data.length; i++){
                            for(var j = 0; j < prizeList.length; j++){
                                if(data[i].code ==  "20002" && prizeList[j] ==  "20002"){//10元话费
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 5;
                                }else if(data[i].code == "20001" && prizeList[j] ==  "20001"){//20元话费
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 1;
                                }else if(data[i].code == "20003" && prizeList[j] == "20003"){//50元话费
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 8;
                                }else if(data[i].code == "20004" && prizeList[j] == "20004"){//100元话费
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 3;
                                }else if(data[i].code == "20005" && prizeList[j] == "20005"){//苏泊尔旅行杯
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 7;
                                }else if(data[i].code == "20006" && prizeList[j] == "20006"){//苏泊尔微压炒锅
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 10;
                                }else if(data[i].code == "20007" && prizeList[j] == "20007"){//WHS滑雪服
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 2;
                                }else if(data[i].code == "20008" && prizeList[j] == "20008"){//旅行箱
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 4;
                                }else if(data[i].code == "20009" && prizeList[j] == "20009"){//iPhone SE
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 0;
                                }else if(data[i].code == "Z9999" && prizeList[j] == "Z9999"){//谢谢参与
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 6;
                                } else if(data[i].code == "Z9997" && prizeList[j] == "Z9997"){//谢谢参与
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 9;
                                } else if(data[i].code == "Z9998" && prizeList[j] == "Z9998"){//谢谢参与
                                    data[i].drawStatus = true;
                                    data[i].drawStop = 11;
                                }
                            }
                        }
                    }

                    function orderData(){
                        var aData = [];
                        for (var i = 0; i < data.length; i++){
                            if(data[i].code == "20009"){
                                aData[0] = data[i];
                            }else if(data[i].code == "20001"){
                                aData[1] = data[i];
                            }else if(data[i].code == "20007"){
                                aData[2] = data[i];
                            }else if(data[i].code == "20004"){
                                aData[3] = data[i];
                            }else if(data[i].code == "20008"){
                                aData[4] = data[i];
                            }else if(data[i].code == "20002"){
                                aData[5] = data[i];
                            }else if(data[i].code == "Z9999"){
                                aData[6] = data[i];
                            }else if(data[i].code == "20005"){
                                aData[7] = data[i];
                            }else if(data[i].code == "20003"){
                                aData[8] = data[i];
                            }else if(data[i].code == "Z9997"){
                                aData[9] = data[i];
                            }else if(data[i].code == "20006"){
                                aData[10] = data[i];
                            }else if(data[i].code == "Z9998"){
                                aData[11] = data[i];
                            }
                        }
                        return aData;
                    }
                    //console.info('data=======',data);
                    res.render('luckydraw', {
                        title: '抽奖',
                        lotteryList:data,       //奖品list
                        lotteryListString:JSON.stringify(data),       //奖品list
                        totalTimes:totalTimes,   //拼图总时间
                        signatureMap:results.signatureMap,//微信签名信息
                        activityLogId:activityLogId,   //当前用户拼图_id
                        drawList:results.drawList //中奖记录
                    });
                }
            );
        }else{
            res.send("没有获取到拼图时间哇！！！");
        }
    })


});

//根据抽奖算法返回抽奖结果
router.post('/luckyStop', function(req, res, next) {

    mongodb.collection('sys_parameter').find().toArray(function(err, parameterData){
        var ztAverage = '';      //概率：正态分布平均数
        var ztVariance = '';    //概率：正态分布方差，代表相对平均数的集中程度，越小越集中，越大取得两边值的可能性越大
        for(var i=0; i<parameterData.length; i++){
            if(parameterData[i]._id == "10002"){
                ztAverage = parameterData[i].numValue;
            }else if(parameterData[i]._id == "10003"){
                ztVariance = parameterData[i].numValue;
            }
        }

        var luckyStop =  Math.round(getNumberInNormalDistribution(ztAverage,ztVariance));

        drawCount(luckyStop);
        function drawCount(luckyStopTemp){
            mongodb.collection('activity_lottery').find({hitrate:luckyStopTemp, actCd:"WX00002"}).toArray(
                function(err,data){
                    //console.info("data=======",data);
                    if(data.length > 0){
                        data = data[0];
                        if(data.count > 0) {
                            //奖品数量--
                            mongodb.collection('activity_lottery').update(
                                {_id: data._id},
                                {$set: {count: data.count - 1}},
                                {strict: true}
                            );

                            //设置奖品位置
                            if(data.code == "20009"){
                                data.drawStop = 0;
                            }else if(data.code == "20001"){
                                data.drawStop = 1;
                            }else if(data.code == "20007"){
                                data.drawStop = 2;
                            }else if(data.code == "20004"){
                                data.drawStop = 3;
                            }else if(data.code == "20008"){
                                data.drawStop = 4;
                            }else if(data.code == "20002"){
                                data.drawStop = 5;
                            }else if(data.code == "Z9999"){
                                data.drawStop = 6;
                            }else if(data.code == "20005"){
                                data.drawStop = 7;
                            }else if(data.code == "20003"){
                                data.drawStop = 8;
                            }else if(data.code == "Z9997"){
                                data.drawStop = 9;
                            }else if(data.code == "20006"){
                                data.drawStop = 10;
                            }else if(data.code == "Z9998"){
                                data.drawStop = 11;
                            }
                        }else {
                            drawCount(Math.round(getNumberInNormalDistribution(ztAverage, ztVariance)));
                        }
                        //console.info('data=-=====',data);
                        res.send(data);
                    }else{
                        drawCount(Math.round(getNumberInNormalDistribution(ztAverage, ztVariance)));
                    }
                }
            );
        }
    });

});

//统计渠道来源、访问时间
router.get('/saveSource',function(req,res,next){
    mongodb.collection('activity_acs_logs').save(req.body,function(err,data){
        res.send(data.ops[0]);
    });
});


//抽奖算法
function randomNormalDistribution(){
    var u=0.0, v=0.0, w=0.0, c=0.0;
    do{
        //获得两个（-1,1）的独立随机变量
        u=Math.random()*2-1.0;
        v=Math.random()*2-1.0;
        w=u*u+v*v;
    }while(w==0.0||w>=1.0)
    //这里就是 Box-Muller转换
    c=Math.sqrt((-2*Math.log(w))/w);
    //返回2个标准正态分布的随机数，封装进一个数组返回
    //当然，因为这个函数运行较快，也可以扔掉一个
    //return [u*c,v*c];
    return u*c;
}

function getNumberInNormalDistribution(mean,std_dev){
    return mean+(randomNormalDistribution()*std_dev);
}

module.exports = router;
