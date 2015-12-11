/*
 * L9110 
 */
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <Ticker.h>
#include <BaoZhai.h>

const char* ssid = "Jerome_WL";
const char* pass = "www.jj.cn";
const char* devicename = "car-01";


#define UP_PIN   5
#define DOWN_PIN 4
#define LEFT_PIN  12
#define RIGHT_PIN  13


/*
 * 鐠佹儳顦稉搴ｇ秹閸忓疇绻涢幒銉﹀灇閸旓拷
 */
void on_reg( )
{
  digitalWrite(UP_PIN, LOW);
  digitalWrite(DOWN_PIN, LOW);
  digitalWrite(LEFT_PIN, LOW);
  digitalWrite(RIGHT_PIN, LOW);
}

/*
 * 鐠佹儳顦稉搴ｇ秹閸忚櫕鏌囧锟芥潻鐐村复
 */
void on_unreg()
{
  digitalWrite(UP_PIN, LOW);
  digitalWrite(DOWN_PIN, LOW);
  digitalWrite(LEFT_PIN, LOW);
  digitalWrite(RIGHT_PIN, LOW);
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
      unsigned char pin = 0;
      unsigned char state =  value=="low" ? LOW : HIGH;
      
      if ( sensorname=="u" )
      { 
          pin = UP_PIN;
      }
      else if ( sensorname=="d" )
      {
          pin = DOWN_PIN;
      }
      else if ( sensorname=="l" )
      {
          pin = LEFT_PIN;
      }
      else if ( sensorname=="r" )
      {
          pin = RIGHT_PIN;
      }

      digitalWrite( pin,state );
}


void setup() {
  Serial.begin(115200);
  pinMode(UP_PIN, OUTPUT);
  pinMode(DOWN_PIN, OUTPUT);
  pinMode(LEFT_PIN, OUTPUT);
  pinMode(RIGHT_PIN, OUTPUT);

  digitalWrite(UP_PIN, LOW);
  digitalWrite(DOWN_PIN, LOW);
  digitalWrite(LEFT_PIN, LOW);
  digitalWrite(RIGHT_PIN, LOW);
  

  BaoZhai.begin( devicename, ssid, pass, on_reg, on_unreg, on_get, on_set );
  Serial.println( "BaoZhai Ok" );
}


void loop() {

}



