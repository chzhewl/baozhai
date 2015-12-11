/*
	宝宅核心程序
 */
process.chdir( __dirname );
uncaughtException();
var fs = require('fs');
	util = require('util'),
	os = require('os'),
	cluster = require('cluster');

global.mainver= "1.0.1";
global.starttime = parseInt( new Date().getTime()/1000 );
global.bzsdk = require("./bz/bzsdk.js");
var usermain = require("./user/main.js");


function initWorker()
{
	if ( process.argv[2] && process.argv[2]=="from_master" )    //worker
	{

		var req_bind_users  = {};
		bzsdk.syslog( "run master worker mode!");
		process.on('message',function(msg){
			if ( msg.cmd )
			{
				switch( msg.cmd )
				{
					case 'shutdown':
					{
						bzsdk.syslog("worker shutdown");
						process.nextTick( function(){
							process.exit(0);
						});
						break;
					}
					case 'heart':
					{
						process.send(
							{
								cmd:'heart',
								svrinfo:{
									mem_total:os.totalmem(),
									mem_free:os.freemem(),
									mem_usage:process.memoryUsage(),
									device_cnts:bzsdk._reged_device_cnts,
									server_login_time:bzsdk._server_login_time,
									system_ver:mainver,
									start_time:starttime,
									mac:bzsdk._mac
								},
								devices : ( function(){
									var devices = {};
									for( var k in bzsdk._reged_devices ){
										var itm = bzsdk._reged_devices[k];
										devices[k] = { name:k,mac:itm.mac,ver:itm.ver,
											mode_run:itm.mode_run,
											ip:itm.client.stream.remoteAddress,
											reg_time:Math.floor(itm.client.reg_time/1000) };
									}
									return devices;
								})()
							});
						break;
					}
					case 'get_devices':
					{
						process.send({cmd:'get_devices',
							reged_devices:bzsdk._reged_devices  } );
						break;
					}
					case 'update_rom':
					{
						bzsdk._req_updaterom("kaiguan",msg.ver,0);
						break;
					}
					case 'get_req_bind_users':
					{
						for( var k in req_bind_users){
							var itm = req_bind_users[k];
							if ( parseInt( new Date().getTime()/1000 )-itm.time>=60 ){
								delete req_bind_users[k];
							}
						}
						process.send({cmd:'get_req_bind_users',
							req_bind_users:req_bind_users  } );
						break;
					}
					case "ack_req_bind_users":
					{
						for( var k in req_bind_users){
							bzsdk._ack_req_bind( k );
							delete req_bind_users[k];
						}
						break;
					}

					case "bind_gw":
					{
						//process.send({cmd:'bind_gw',
						//	body:  } );

						//bind_gw
						//result
						//user_id

						break;
					}
				} //switch end
			}
		} );

		bzsdk.on("update_rom",function(result){
			process.send( { cmd:'update_rom',result:result } );
		});
		bzsdk.on("update_rom_finish",function(result){
			process.send( { cmd:'update_rom_finish',result:result } );
		});
		bzsdk.on("bind_gw",function(result){
			req_bind_users[result.user_id] = { email:result.email,
							time: parseInt( new Date().getTime()/1000 ) };
			process.send( { cmd:'bind_gw',result:result } );
		});


		process.send({cmd:"ready"});
	}else bzsdk.syslog( "run worker mode!");
}


 function uncaughtException() {
 	process.on('uncaughtException',
 		function (err) {
 			bzsdk.log("uncaughtException stack：" , err.stack );
 			process.nextTick( function() {
 				//退出进程
 				process.exit(1);
 			});
 		});
 }

initWorker();
