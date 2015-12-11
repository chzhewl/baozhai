/*
 * Pdsm501a 
 *  http://www.sca-shinyei.com/pdf/Pdsm501aNS.pdf
*   Connections:
 
 *  Sensor Pin 1 => Arduino GND
 *  Sensor Pin 3 => Arduino +5VDC
 *  Sensor Pin 4 => Arduino data */

#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <Ticker.h>
#include <BaoZhai.h>
#include "DHT.h"
#include <RCSwitch.h>
#include <cstdio>

const char* ssid = "Jerome_WL";
const char* pass = "www.jj.cn";
const char* devicename = "bedroom-01";

/*pdsm501a********************************/
#define  pdsm501a_pin  12
unsigned long starttime;
volatile unsigned long change_time;
volatile unsigned long pulse_low_time;
float ratio = 0;
float concentration = 0;
/*pdsm501a end****************************/


/* dht ********************************************/
#define DHTPIN 13     // what pin we're connected to
#define DHTTYPE DHT11   // DHT 11
DHT dht(DHTPIN, DHTTYPE);
unsigned long dht_starttime;
float dht_humidity = 0;
float dht_temperature = 0;
/* dht ********************************************/


/* rcswitch ******************************************/
RCSwitch send_Switch = RCSwitch();
#define RC_SEND_PIN   14 
/* rcswitch end *************************************/

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
    String value;
    
    if ( sensorname=="dht" )
    {
         value = dht_humidity;
         value += ",";
         value += dht_temperature;
    }
    else if ( sensorname=="pdsm501a" )
    {
        value = concentration;
    }
    
    BaoZhai.sendVal( sensorname, value );
}

/*
 * 鐠囬攱鐪扮拋鍓х枂娴肩姵鍔呴崳銊︽殶閹癸拷
 */
void on_set( const String& sensorname,
             const String& value )
{
    if ( sensorname=="315send" )
    {
      int s = value.indexOf(',');
      if ( s!=-1 )
      {
          String tmp  = value.substring(0,s);
          unsigned long code_num = (unsigned long)tmp.toInt();
          tmp = value.substring(s+1);
          unsigned long bit_num = (unsigned long)tmp.toInt();
          
          send_Switch.send( code_num,bit_num );
          BaoZhai.sendVal( sensorname, value );
      }      
    }
    else if ( sensorname=="serial" )
    {
        Serial.print( value );
        BaoZhai.sendVal( sensorname, value );
    }
}




void stateChange()
{
  if ( digitalRead(pdsm501a_pin)==LOW )
  {
    change_time = micros();
  }
  else
  {
    if ( change_time>0 && micros() - change_time<= 1000000L )
    { 
         pulse_low_time = micros() - change_time;
    }  

    change_time = 0;
  }
}
void setup() {
  Serial.begin(115200);

  /*** pdsm501a ************************/
  // Get current time to measure sample time
  starttime = millis();
   change_time = 0;
   pulse_low_time = 0;
  /*** pdsm501a end************************/

  /*** dht **************************/
   dht.begin();
   dht_starttime = millis();
  /*** dht *************************/

  /* switch **************************/
    send_Switch.enableTransmit( RC_SEND_PIN );
  /* switch end **********************/  

 // 鐩戣涓柇杈撳叆寮曡剼鐨勫彉鍖�
  attachInterrupt( pdsm501a_pin, stateChange, CHANGE );
  
  BaoZhai.begin( devicename, ssid, pass, on_reg, on_unreg, on_get, on_set );

//  Serial.println( "BaoZhai Ok" );
}


void loop() {
  if ( !BaoZhai.reged() ) return;
  
  /***** pdsm501a ****************************************************************************/
    // Wait for low pulse and return pulse width duration. Time in micro seconds.
    unsigned long elapsedtime=millis()-starttime;
    // If sampling time is reached (30 seconds) then calculate concentration.
    if ( elapsedtime > 30000) {
       pulse_low_time += 30;
      ratio = pulse_low_time/(elapsedtime*10.0);
      // Equation derived from datasheet by Chris Nafis
      concentration = 1.1*pow(ratio,3)-3.8*pow(ratio,2)+520*ratio+0.62;

//      Serial.print(concentration);
      // Reset values for next sampling period.
      pulse_low_time = 0;
      starttime = millis();
    }
   /***** pdsm501a end ****************************************************************************/

  /**** dht *********************************************************************************/

  if ( millis()-dht_starttime >= 20000 ){
         dht_starttime = millis();
         
         // Reading temperature or humidity takes about 250 milliseconds!
          // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
          float h = dht.readHumidity();
          // Read temperature as Celsius (the default)
          float t = dht.readTemperature();
          
          // Check if any reads failed and exit early (to try again).
          if ( isnan(h) || isnan(t)  ) {
//            Serial.println("Failed to read from DHT sensor!");
            return;
          }
//
//          Serial.println( h );
//          Serial.println( t );
          
          dht_humidity = h;
          dht_temperature = t;
  }
  /*** dht ******************************************************************/
}



