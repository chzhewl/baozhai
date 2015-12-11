/*
	宝宅SDK
 */
var util = require("util");
var events = require("events");
var net = require('net');
var bzuntil = require('./bzuntil.js');;
var JsonSocket = require('./json-socket.js');
var dgram =  require('dgram');
var mqtt = require('mqtt');

/*
	bzsdk.on_device
	bzsdk.on_phone
	bzsdk.send2phone
	bzsdk.getdevice
	bzsdk.setdevice
 */


var bzsdk = function(mac){
	events.EventEmitter.call(this);
	var This = this;
	this._reged_devices = {};  //已注册的设备列表
	this._server_login_time  = -1; //登录服务器时间
	this._reged_device_cnts = 0; //已注册设备数量

	var  device_unsetup = function( client ){
		This.syslog('device_unsetup name:' + client.dev );
		if ( client.dev &&
			client.dev!="" ){
			var dev;
			if (  ( dev = This._reged_devices[client.dev] ) &&
				dev.client &&
				dev.client.reg_time==client.reg_time ){

				//通知应用层
				This.emit( "device_" + client.dev + "_unreg");
				delete This._reged_devices[client.dev];
				This._reged_device_cnts --;

				This.syslog( 'device_unsetup handle' );
				This._device_change( client.dev,"offline" );
			}else{
				This.syslog('device unsetup fail no same reg_time,name:',client.dev );
			}
		}
	};
	var  device_setup = function( client,name,mac,ver ){
		var dev;
		if ( dev = This._reged_devices[name]  ){
			device_unsetup( dev.client );
		}
		This._reged_devices[name] =
		{
			ver:ver,
			mac : mac,
			client : client
		};
		This._reged_device_cnts ++;

		//记录设备名称
		client.dev = name;
		client.reg_time = new Date().getTime();

		//通知应用层
		This.emit( "device_" + name+"_reg");
		This._device_change(name,"online");
		This.syslog('device setup success');
	};

	this.init = function(mac){
		This.syslog("wifi mac:"+mac);
		This._mac = mac; 				// wlan0 mac

		//创建服务器对象
		This._server = mqtt.createServer(function(client) {
			client.on('connect', function(packet) {
				//console.log( packet );
				client.connack( {returnCode: 0} );
				This.syslog('device connected');
			});

			//客户端发布主题时触发
			client.on('publish', function(packet) {
				var topic = packet.topic;
				var payload = packet.payload.toString();
				var body = JSON.parse( payload );

				switch( topic ){
					case "reg":{ //模块注册
						This.syslog('module reg,devicename:',
							body.dev,'mac:',body.mac );
						if ( body.mac!="" && body.dev!="" ){

							device_setup( client,body.dev,
								body.mac,body.ver );
							client.publish({
								topic: "reg",
								payload: "ok"
							});
						}else{
							client.publish({
								topic: "reg",
								payload: "fail"
							});
						}
						break;
					}
					case "val":{
						//console.log( body );
						if ( client.dev &&
							client.dev!="" ){
							var eventname = 'device_' + client.dev + "_val";
							if (  events.EventEmitter.listenerCount( This,eventname )==0 ){
								This.send2phone( client.dev,body.sen,body.val );
							}else{
								//通知应用层
								This.emit( "device_" + client.dev + "_val",
									body.sen,body.val);
							}
						}
						break;
					}
				}

			});

			//当客户端订阅时触发
			client.on('subscribe', function(packet) {
				var topic=packet.subscriptions[0].topic;
				//This.syslog( topic );
			});

			client.on('pingreq', function(packet) {
				client.pingresp();
			});

			client.on('disconnect', function(packet) {
				This.syslog( "disconnect" );
			});
			client.on('error',function(e){
				This.syslog( "client error:",e );
			});
			client.on('close',function( c ){
				This.syslog( "client close" );
				device_unsetup( client );
			})
		});

		//监听端口
		This._server.listen(8124);
		This.syslog("gateway server started, listen 8124 port");

		/////////////////////////////////////////连接服务器///////////////////////////////////
		var port = 20006;
		var host = 'gtcp.baozhai.cc';
		//host = '192.168.1.201';
		This._server_socket = new JsonSocket( new net.Socket() );
		This._server_socket.connect(port, host);
		This._server_socket.on('connect', function() {
			This.syslog("server host:"+host+",port:"+port+" connected, request login...");

			//heart
			var socket = This._server_socket;
			socket._recvcnt = 0;
			socket._heart_time_tick = 0;
			socket._hearttime = setInterval( function(){
				socket._heart_time_tick++;
				if ( socket._recvcnt==0 && socket._heart_time_tick%2==0  ){
					This.syslog( "server socket heart timeout end connect"  );
					clearInterval(socket._hearttime);
					socket._hearttime = null;
					socket.end();
					socket.destroy();
					return;
				}
				socket.sendMessage( { cmd:"heart",body:{} } );
				socket._recvcnt = 0;
			},10000);

			//login
			This._server_socket.sendMessage( {cmd:"login",body:{mac:mac} } );
		});

		This._server_socket.on('message', function(message) {
			This._server_socket._recvcnt ++;
			var body = message.body;
			switch( message.cmd ){
				case "heart":break;
				case "login":
				{
					if ( body.result &&
						body.result=="logged" ){
						This._server_login_time = parseInt( new Date().getTime()/1000 );
						This.syslog("gw login server success" );
					}else{
						This.syslog("gw login server fail");
					}
					break;
				}
				case "get":{
					var eventname = 'ph_' + body.device + "_get";
					if (  events.EventEmitter.listenerCount(This,eventname )==0 ){
						This.getdevice(  body.device,body.sensor );
					}else{
						This.emit(eventname,body.sensor );
					}
					break;
				}
				case "set":{
					var eventname = 'ph_' + body.device + "_set";
					if (  events.EventEmitter.listenerCount(This,eventname )==0 ){
						This.setdevice(  body.device,body.sensor,body.value );
					}else{
						This.emit( eventname,body.sensor,body.value );
					}
					break;
				}
				case "user_login":{
					var eventname = 'ph_' + body.device + "_user_login";
					This.emit( eventname,body.email );
					break;
				}
				case "user_logout":{
					var eventname = 'ph_' + body.device + "_user_logout";
					This.emit( eventname,body.email );
					break;
				}
				case "bind_gw":{
					This.emit( "bind_gw",body );
					break;
				}
				case "dev_state_query":{
					var devices = [];
					for( var k in body.devices )
					{
						var device = body.devices[k];
						if ( This._reged_devices[ device ] ){
							devices.push( {device:device,state:"online"} );
						}else{
							devices.push( {device:device,state:"offline"} );
						}
					}
					This._server_socket.sendMessage(
						{ cmd:"dev_state_query",
							body:{ user_id:body.user_id,
								devices:devices } } );

					break;
				}
			}
		});

		This._server_socket.on('error', function(e) {

		});

		This._server_socket.on('end', function(e) {
			This.syslog("server end  host:"+host+",port:"+
				port+" net break, try reconnect...");
		});

		This._server_socket.on('close',function(){
			This.syslog("server host:"+host+",port:"+port+
				" net break, try reconnect...");
			This._server_login_time = -1;

			if ( This._server_socket._hearttime ){
				clearInterval(This._server_socket._hearttime);
				This._server_socket._hearttime = null;
			}

			//1秒尝试重连一次
			setTimeout( function(){
				This._server_socket.connect(port, host);
			},1000);
		});
		/////////////////////////////////////////连接服务器end///////////////////////////////////

		//IP查询服务////////////////////////
		var udp = dgram.createSocket('udp4');
		udp.on('message', function(msg, rinfo) {
			This.syslog('gateway ip query  ' +  ' from ' +
				rinfo.address + ' : '+  rinfo.port);
			udp.send( new Buffer(1), 0, 1, rinfo.port, rinfo.address);
		});
		udp.bind(8421);

	};
};

//继承事件类
util.inherits(bzsdk, events.EventEmitter);

/*
	来自device的数据
 */
bzsdk.prototype.on_device = function(){
	if ( arguments.length==2 ){
		this.addListener( arguments[0],arguments[1]  );
	}else{
		this.addListener( "device_" + arguments[0] + "_" + arguments[1],arguments[2]  );
	}
};
/*
	来自手机的数据
 */
bzsdk.prototype.on_phone = function(){
	if ( arguments.length==2 ){
		this.addListener( arguments[0],arguments[1]  );
	}else{
		this.addListener( "ph_" + arguments[0] + "_" + arguments[1] ,arguments[2]  );
	}
};

/*
发送数据到手机
 */
bzsdk.prototype.send2phone = function(device,sensor,value){
	this._server_socket.sendMessage(
		{ cmd:"val",body:{ device:device,sensor:sensor, value:value } } );
};

/*
推送消息到手机
 */
bzsdk.prototype.push2phone = function( tile,message ){
	if( this._push_time &&
		( new Date().getTime() - this._push_time) <=10*1000 ){
		return;
	}
	this._push_time = new Date().getTime();
	this._server_socket.sendMessage(
		{ cmd:"pushdata",body:{ tile:tile,content:message } } );
};

/*
向m设备请求数据
 */
bzsdk.prototype.getdevice = function(device,sensor){
	var dev;
	if ( dev = this._reged_devices[device] ){
		dev.client.publish({
			topic: "get",
			payload: sensor
		});
	}
}

/*
向设备设置数据
 */
bzsdk.prototype.setdevice = function(device,sensor,value){
	var dev;
	if ( dev = this._reged_devices[device] ){
		dev.client.publish({
			topic: "set",
			payload: JSON.stringify( { sen:sensor,val:value} )
		});
	}
};

//请求更新rom
bzsdk.prototype._req_updaterom = function(device_name,ver,ip){
	var dev;
	if ( dev = this._reged_devices[device_name] ){
			//dev.socket.sendbzmsg(
			//	protocol.common.BZ_G2M_UPDATE_ROM,
			//	{ ver:ver,ip:ip } );
	}
}

//设备change
bzsdk.prototype._device_change = function(device,state){
	this._server_socket.sendMessage(
		{ cmd:"dev_change",body:{ device:device,state:state } } );
}

//处理绑定请求
bzsdk.prototype._ack_req_bind = function(user_id){
	this._server_socket.sendMessage(
		{ cmd:"bind_gw",body:{ result:true,user_id:user_id } } );
}

//当前时间戳
bzsdk.prototype.curtimestamp = bzuntil.curtimestamp;
/*
打印日志
 */
bzsdk.prototype.log = bzuntil.log;
//系统日志
bzsdk.prototype.syslog = bzuntil.syslog;
module.exports = new bzsdk();

var mac = bzuntil.getmac("wlan0");
if ( mac ){
	module.exports.init( mac );
}else{
	module.exports.syslog("get gw wlan0 mac error!");
	process.exit(0);
}


