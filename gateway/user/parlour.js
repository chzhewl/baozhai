/*
*客厅
*/

var devicename = "parlour";

//温度和湿度
var dht_val = { "tempe":"0.0℃","humi":"20%" };
//空气质量
var ppd42_val = 0;

function get_val()
{
    bzsdk.getdevice( devicename,"dht" );
    bzsdk.getdevice( devicename,"ppd42" );
}

bzsdk.on_device( devicename,"reg",function(){
    bzsdk.log( devicename + " device reg" );
    get_val();
});

bzsdk.on_device( devicename,"unreg",function(){
    bzsdk.log( devicename + " device unreg" );
    
                //只使用功率数据
            // bzsdk.send2phone( devicename,sen,val );
});

bzsdk.on_device( devicename,"val",function( sen,val ){
    switch( sen )
    {
        case "dht":{
            val = val.split(",");
            dht_val.tempe = val[1] + "℃"
            dht_val.humi = val[0] + "%";
            break;
        }
        case "ppd42":{
            ppd42_val = val; 
            break;
        }
        case "315recv":{
            bzsdk.push2phone("门磁预警","有人开门啦");
            break;
        }
    }
});

bzsdk.on_phone( devicename,"get",function(sen,val){
    switch( sen )
    {
        case "dht_tempe":{
            bzsdk.send2phone( devicename,sen, dht_val.tempe );
            break;
        }
        case "dht_humi":{
            bzsdk.send2phone( devicename,sen, dht_val.humi );
            break;
        }
        case "ppd42":{
            bzsdk.send2phone( devicename,sen, ppd42_val );
            break;
        }
    }
});

setInterval( function(){
    get_val();
},6000 );