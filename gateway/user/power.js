/*
*电力
*/

var util = require("./util.js");

var devicename = "power";

var power_val = "";

function get_val()
{
    bzsdk.getdevice( devicename,"imeter" );
}


bzsdk.on_device( devicename,"reg",function(){
    bzsdk.log( "device reg" );
    get_val();
});

bzsdk.on_device( devicename,"unreg",function(){
    bzsdk.log( "device unreg" );
});

bzsdk.on_phone( devicename,"get",function(sen,val){
    switch( sen )
    {
        case "imeter":{
            //只使用功率数据
            bzsdk.send2phone( devicename,sen,power_val.split(",")[2] + "W" );
            break;
        }
    }
});

bzsdk.on_device( devicename,"val",function( sen,val ){
    power_val = val;
    
    var powerData = val.split(",");
    
   
   var  DY = powerData[0];
   var DL =  powerData[1];
   var GL =  powerData[2];
   var YDL =  powerData[3];
   var GLYS =  powerData[4];
   
    //上报到乐联网
    util.wl_update_data( "04",[ 
        {"Name":"DY","Value":DY},
        {"Name":"DL","Value":DL},
        {"Name":"GL","Value":GL},
        {"Name":"YDL","Value":YDL},
        {"Name":"GLYS","Value":GLYS}
    ] );
   
});

setInterval( function(){
    get_val();
},6000 );