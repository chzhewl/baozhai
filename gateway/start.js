/*
    守护进程启动工具
 */
process.chdir( __dirname );
var spawn = require('child_process').spawn;
function startServer(){
    var server;
    console.log('start server');
    server = spawn('node',['master.js'],{
        detached : true,
        stdio: ['ignore', 'ignore', 'ignore']
    });
    server.unref();
    console.log('baozhai pid is '+server.pid);

    server.on('error',function(code,signal){
        server.kill(signal);
        server = startServer();
    });

    server.on('exit',function(code,signal){
    });
    return server;
};
startServer();