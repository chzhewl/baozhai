/*
    工具类
 */
var util = require('util');
var os = require('os');


function merge_args( args )
{
	var logstr = '';
	for(var i=0; i<args.length;i++){
		if ( logstr!='' ){
			logstr += ' ';
		}
		logstr += args[i];
	}
	return logstr;
}

//日志
exports.log = function(){
	var logstr = merge_args( arguments );
	logstr = '[' + this.curtimestamp() + '][user] ' + logstr;

    console.log( logstr );
};

//系统日志
exports.syslog = function(){
	var logstr = merge_args( arguments );
	logstr = '[' + this.curtimestamp() + '][sys] ' + logstr;

    console.log( logstr );
};

//当前时间戳
exports.curtimestamp = function(){
	var t = new Date();

    var localTime = t.getTime();
    var localOffset=t.getTimezoneOffset()*60000;
    var utc = localTime + localOffset;
    var offset =8;
    var hawaii = utc + (3600000*offset);
    t = new Date(hawaii);

    return util.format( "%d-%d-%d %d:%d:%d.%d",
		   t.getFullYear(),t.getMonth(),t.getDate(),
		   t.getHours(),t.getMinutes(),t.getSeconds(),
		   t.getMilliseconds()
		);
};

exports.padding_num = function(str) {
    var pad = "00"
    return pad.substring(0, pad.length - str.length) + str
}


module.exports.getmac = function(interface){
    if(process.platform.indexOf('linux') == 0) {
        var interfaces = os.networkInterfaces();
        if ( !interfaces[interface] ){
            return null;
        }else{
            return interfaces["wlan0"][0]["mac"].toUpperCase();
        }
    }else{
        return "E8:4E:06:0E:22:5E";
    }
};

module.exports.getip = function(interface){
    if(process.platform.indexOf('linux') == 0) {
        var interfaces = os.networkInterfaces();
        if ( !interfaces[interface] ){
            return null;
        }else{
            return interfaces["wlan0"][0]["ipv4"].toUpperCase();
        }
    }else{
        return "192.168.1.201";
    }
};
