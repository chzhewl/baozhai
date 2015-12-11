/*
*电力
*/

var devicename = "power";
bzsdk.on_device( devicename,"reg",function(){
    bzsdk.log( "device reg" );
});

bzsdk.on_device( devicename,"unreg",function(){
    bzsdk.log( "device unreg" );
});

bzsdk.on_device( devicename,"val",function( sen,val ){
    //只使用功率数据
    bzsdk.send2phone( devicename,sen,val.split(",")[2] + "W" );
});