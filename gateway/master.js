/**
 * 宝宅管理程序
 */
process.chdir( __dirname );

var child_process = require('child_process');
var fs = require("fs");
var util = require("util");
var express = require('express');
var session = require('express-session')
var cookieParser = require('cookie-parser');
var app = express();

var master_listenport =  8080;
var g_bstartingchild = false;
var g_cur_child_main = null;
var g_start_worker_res_queue = [];

var g_worker_log = [];

var g_mac = "";

var g_http_req_list  = {};

var g_config = { "passwd":"admin" };

global.mainver= "1.0.1";

function output_res( res,req,result,objext)
{
    var obj = {
        result:result ? "success" : "fail"
    };

    for( var k in objext )
    {
        obj[k] = objext[k];
    }

    var str_res = JSON.stringify( obj );
    if ( req.query.callback ){
        str_res =  req.query.callback + "(" + str_res + ");";
    }
    res.writeHead(200,{
        'Content-Type': 'text/html; charset=utf-8',
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"POST,GET",
        "Access-Control-Allow-Credentials":true
    } );
    res.end(str_res);
}


function output_http_req_list_res(cmd,result,objext) {
    var list = g_http_req_list[cmd];
    if ( list ){
        for( var k in list ){
            var itm = list[k];
            output_res( itm.res,itm.req,result,objext );
        }
        delete  g_http_req_list[cmd];
    }
}

//function output_file_res( res,req,result,file)
//{
//    var str_res = "";
//    if ( req.query.callback ){
//        str_res =  req.query.callback + "(";
//    }
//
//    res.writeHead(200,{'Content-Type': 'text/html; charset=utf-8' } );
//    res.write( str_res );
//
//    res.write( "{ result: '" + ( result ? "success" : "fail" ) + ",," );
//    res.write( " file: '" );
//
//
//    res.write( file.toString("base64") );
//    res.write( "' }" );
//
//    if ( req.query.callback ){
//        str_res =  ");";
//    }else str_res = "";
//
//    res.end(str_res);
//}

function ack_req_startworker( result,ver,id )
{
    while( g_start_worker_res_queue.length>0 )
    {
        var res_req = g_start_worker_res_queue.shift();
        output_res(res_req.res,res_req.req,result,{id:id});
    }
}

//开启工作进程
function startChild()
{
    if ( g_bstartingchild ) return;

    g_bstartingchild = true;


    var child_main = child_process.fork( 'main.js',['from_master'],{ silent:true } );
    child_main.starttime = parseInt(new Date().getTime()/1000);

    //初始化心跳时间
    child_main.hearttime = new Date().getTime();
    child_main.stdout.on('data',function(chunk){
        if ( g_worker_log.length>100 ){
            g_worker_log.pop();
        }
        g_worker_log.unshift(chunk.toString());
        console.log(  "child:",chunk.toString() );
    });

    //处理来自worker 消息
    child_main.on('message',function(msg){
       //console.log( "message:",msg );
        if ( msg.cmd )
        {
            switch( msg.cmd )
            {
                case "ready":     //服务准备好了，切换到新版服务上
                {
                    g_bstartingchild = false;
                    g_cur_child_main = child_main;

                    ack_req_startworker( true,this.pid );
                    break;
                }
                case "heart":     //心跳
                {
                    child_main.svrinfo = msg.svrinfo;
                    this.reged_devices = msg.devices;

                    this.hearttime = new Date().getTime();
                    g_mac = this.svrinfo.mac;
                    break;
                }
                case "get_req_bind_users":
                {
                    output_http_req_list_res( "get_req_bind_users",
                        true,{ req_bind_users:msg.req_bind_users } );
                    break;
                }
            }
        }
    });

    child_main.on('error',function( ex ){
        console.log( ex );
    });

    child_main.send( {cmd:"heart"} );

    child_main.on('close',function(code, signal){
        console.log(" child close " );
        //未启动成功
        if ( g_bstartingchild ){
            g_bstartingchild = false;
            ack_req_startworker(false,-1);
        }

        //清空请求列表
        g_http_req_list = {};
        g_cur_child_main = null;
        if ( !child_main.b_m_close ){
            startChild( );
        }
    });
}

setInterval(
    function(){
        //发送心跳
            if ( g_cur_child_main && g_cur_child_main.hearttime &&
                new Date().getTime() - g_cur_child_main.hearttime >= 10000 )
            {
                console.log( 'child heart time out kill it,pid:' +  g_cur_child_main.pid );
                g_cur_child_main.kill(  );  //强制关闭僵死进程
            }
            else if ( g_cur_child_main )
            {
                g_cur_child_main.send( {cmd:"heart"} );
            }

        }, 5000 );

//////////////////////////////////////////
app.use( cookieParser() );
app.use(session({
    secret: 'baozhai.cc',
    name: 'BAOZHAI_SESSION',
    cookie: {maxAge: 3600*24*1000 },
     resave: false,
    saveUninitialized: true,
}));


app.all('*', function(req,res,next){
    if (
        ( req._parsedUrl.pathname=="/" ||
         req._parsedUrl.pathname.indexOf("html")!=-1 ) &&
         req._parsedUrl.pathname.indexOf("login.html")==-1 &&
        req._parsedUrl.pathname.indexOf("/api/verify")==-1 &&
        !req.session.islogin ){
         return res.redirect("/login.html");
    }
    next();
});

app.use('/', express.static('www') );


app.get('/api/verify', function (req, res) {
    if ( req.query.passwd &&
        req.query.passwd==g_config.passwd ){
        req.session.islogin = true;
        output_res(res,req,true,{result:"success"} );
    }else{
        output_res(res,req,false,{err:"password error"});
    }
});

app.get('/api/mdpasswd', function (req, res) {
    if ( req.query.passwd &&
         req.query.passwd!="" ){
        g_config.passwd =  req.query.passwd;
        fs.writeFileSync( "config.json",JSON.stringify( g_config ) );
        output_res( res,req,true,{result:"success"} );
    }else{
        output_res( res,req,false,{err:"password error"} );
    }
});

app.get('/api/status', function (req, res) {
    if ( g_cur_child_main ){
        output_res(res,req,true,{ svrinfo:g_cur_child_main.svrinfo,gw_time:parseInt( new Date().getTime()/1000 ) });
    }else{
        output_res(res,req,false,{err:"worker not run"});
    }
});

app.get('/api/devices', function (req, res) {
    if ( g_cur_child_main ){
        output_res(res,req,true,{devices:g_cur_child_main.reged_devices,gw_time:parseInt( new Date().getTime()/1000 ) });
    }else{
        output_res(res,req,false,{err:"worker not run"});
    }
});
app.get('/api/mac', function (req, res) {
    output_res(res,req,true, {
        result:"mac success",
        mac:g_mac
    });
});
app.get('/api/log', function (req, res) {
    output_res(res,req,true, {
        result:"log success",
        log:g_worker_log
    });
    g_worker_log = [];
});
app.get('/api/start', function (req, res) {
    if( g_cur_child_main )
    {
        output_res(res,req,false, {
            result:"fail",
            err:"startting"
        });
        return;
    }
    //start
    g_start_worker_res_queue.push({res:res,req:req});
    startChild();
});
app.get('/api/kill', function (req, res) {
    if ( g_cur_child_main==null )
    {
        output_res(res,req,false, {
            result:"fail",
            err:"worker is not running"
        });
        return;
    }

    g_cur_child_main.b_m_close = true;
    g_cur_child_main.kill();
    output_res( res,req,true);
});

app.get('/api/pathlist', function (req, res) {
    fs.readdir('./user',function(err,files){
        if ( err )
        {
            output_res(res,req,false, {
                result:"fail",
                err:"not file"
            });
            return;
        }
        var result = [
            {
                "text": "用户目录",
                "children": [
                ],
                "id": "/",
                "icon": "folder",
                "state": {
                    "opened": true,
                    "disabled": true
                }
            }
        ]

        for( var k in files ){
            var file = files[k];
            var type = file.split(".");
            result[0].children.push(
                {
                    "text": file,
                    "children": false,
                    "id": file,
                    "type": "file",
                    "icon": "file file-"+ ( type.length>=2 ? type[1] : "unkown" )
                }
            );
        }

        output_res( res,req,true,{data:result});
    });
});

app.get('/api/delfile', function (req, res) {
        if ( req.query.name ){
            fs.unlink('./user/'+req.query.name, function (err) {
                if (err) output_res(res,req,false);
                output_res(res,req,true, {
                    result:"success"
                });
            });
        }else{
            output_res(res,req,false);
        }
});

app.get('/api/createfile', function (req, res) {
        if ( req.query.name ){
            fs.writeFile('./user/'+req.query.name, '', function (err) {
                if (err) output_res(res,req,false);
                output_res(res,req,true, {
                    result:"success"
                });
            });

        }else{
            output_res(res,req,false);
        }
});

app.get('/api/rename', function (req, res) {
        if ( req.query.oldname && req.query.newname ){
            fs.rename('./user/' + req.query.oldname, './user/' + req.query.newname, function (err) {
                if (err) output_res(res,req,false);
                output_res(res,req,true, {
                    result:"success"
                });
            });

        }else{
            output_res(res,req,false);
        }
});


app.get('/api/read', function (req, res) {
    var file_name = './user/' + req.query.name;

    fs.readFile( file_name, function (err, file) {
        if (err) {
            output_res(res,req,false);
            return;
        }
        output_res(res,req,true,{ file:file.toString("base64") } );
    });
});

app.post('/api/write', function (req, res) {
        var file_name = './user/' + req.query.name;

        fs.truncateSync( file_name,0 );
        req.on("data",function(postdata){
            postdata = new Buffer(postdata.toString(), 'base64');
            fs.appendFileSync(file_name, postdata);
        });
        req.on("end",function(){
            output_res(res,req,true);
        });
});

app.get('/api/update', function (req, res) {
    var file_name = req.query.filename;
    console.log( "update:" + file_name  );
    fs.readFile( file_name, function (err, file) {
        if (err) {
            res.writeHead(404);
            res.end('not found file');
            return;
        }
        console.log( "output file"  );
        res.writeHead(200,
            {"Content-Length":file.length});
        res.end(file);
    });
});

app.get('/api/get_req_bind_users', function (req, res) {
    if ( g_cur_child_main ) {
        if ( !g_http_req_list["get_req_bind_users"] ){
            g_http_req_list["get_req_bind_users"] = [];
        }

        g_http_req_list["get_req_bind_users"].push( { res:res,req:req } );
        g_cur_child_main.send( {cmd:"get_req_bind_users"} );
    }
});

app.get('/api/ack_req_bind_users', function (req, res) {
    if ( g_cur_child_main ) {
        console.log("ack_req_bind_users");
        g_cur_child_main.send( {cmd:"ack_req_bind_users"} );
        output_res(res,req,true, {
            result:"success"
        });
    }
});

function authentication(req, res, next) {
   // if (!req.session.user) {
   //     req.session.error='请先登陆';
        return   res.redirect('/api/status');
  //     // return res.redirect('/login');
  //  }
    //next();
}


var config;
try {
    config = fs.readFileSync("config.json");
    config = JSON.parse( config );
}
catch(e){
    config = {"passwd":"admin"};
}

if ( config ) {
    g_config = config;
}

app.listen(80, function () {
    console.log('listen:80');
});


//启动worker
startChild( );


