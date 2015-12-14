/*
 *  
 */
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <Ticker.h>
#include <BaoZhai.h>

const char* ssid = "Jerome_WL";
const char* pass = "www.jj.cn";
const char* devicename = "iremote-01";


/*
 * 鐠佹儳顦稉搴ｇ秹閸忓疇绻涢幒銉﹀灇閸旓拷
 */
void on_reg( )
{

}

/*
 * 鐠佹儳顦稉搴ｇ秹閸忚櫕鏌囧锟芥潻鐐村复
 */
void on_unreg()
{

}
/*
 * 鐠囬攱鐪伴懢宄板絿娴肩姵鍔呴崳銊︽殶閹癸拷
 */
void on_get( const String& sensorname )
{ 

}

/*
 * 鐠囬攱鐪扮拋鍓х枂娴肩姵鍔呴崳銊︽殶閹癸拷
 */
void on_set( const String& sensorname,
             const String& value )
{
    if ( sensorname=="send" )
    {
        unsigned char buf[4];
        buf[0] = 0xff;
        buf[1] = 0x02;
        buf[3] = 0xfe;
        
        buf[2] = (unsigned char)value.toInt();
        Serial.write( buf,sizeof(buf) );
    }
    else if ( sensorname=="study")
    {
        unsigned char buf[4];
        buf[0] = 0xff;
        buf[1] = 0x01;
        buf[3] = 0xfe;
        
        buf[2] = (unsigned char)value.toInt();
        Serial.write( buf,sizeof(buf) );
    }
}


void setup() {
  Serial.begin(9600);

  BaoZhai.begin( devicename, ssid, pass, on_reg, on_unreg, on_get, on_set );
//  Serial.println( "BaoZhai Ok" );
}


void loop() {

}



