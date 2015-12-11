/*
 * PPD42 
 *  http://www.sca-shinyei.com/pdf/PPD42NS.pdf
*   Connections:
 
 *  Sensor Pin 1 => Arduino GND
 *  Sensor Pin 3 => Arduino +5VDC
 *  Sensor Pin 4 => Arduino Digital Pin 3*/

#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <Ticker.h>
#include <BaoZhai.h>
#include "DHT.h"
#include <RCSwitch.h>
#include <cstdio>

const char* ssid = "Jerome_WL";
const char* pass = "www.jj.cn";
const char* devicename = "parlour";

/*ppd42********************************/
#define  ppd42_pin  12
unsigned long starttime;
volatile unsigned long change_time;
volatile unsigned long pulse_low_time;
float ratio = 0;
float concentration = 0;
/*ppd42 end****************************/

/***********HC-SR501******************/
#define HC_PIN  4
volatile unsigned char hc_cur_state = 0;
unsigned long hc_start_time;
/************HC-SR501  end *************/


/* dht22 ********************************************/
#define DHTPIN 13     // what pin we're connected to
#define DHTTYPE DHT22   // DHT 22  (AM2302)
DHT dht(DHTPIN, DHTTYPE);
unsigned long dht_starttime;
float dht_humidity = 0;
float dht_temperature = 0;
/* dht22 ********************************************/


/* rcswitch ******************************************/
RCSwitch send_Switch = RCSwitch();
#define RC_SEND_PIN   14 

RCSwitch recv_Switch = RCSwitch();
#define RC_RECV_PIN   5
/* rcswitch end *************************************/

/*
 * 璁惧涓庣綉鍏宠繛鎺ユ垚鍔�
 */
void on_reg( )
{

}

/*
 * 璁惧涓庣綉鍏虫柇寮�杩炴帴
 */
void on_unreg()
{

}
/*
 * 璇锋眰鑾峰彇浼犳劅鍣ㄦ暟鎹�
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
    else if ( sensorname=="ppd42" )
    {
        value = concentration;
    }
    
    BaoZhai.sendVal( sensorname, value );
}

/*
 * 璇锋眰璁剧疆浼犳劅鍣ㄦ暟鎹�
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
}




void stateChange()
{
  if ( digitalRead(ppd42_pin)==LOW )
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

void hcChange()
{
  if ( digitalRead(HC_PIN)==HIGH )
  {
      hc_cur_state = 1;
  }

//  Serial.println( digitalRead(HC_PIN) );
}

void setup() {
  Serial.begin(115200);

  /*** ppd42 ************************/
  // Get current time to measure sample time
  starttime = millis();
   change_time = 0;
   pulse_low_time = 0;
  /*** ppd42 end************************/

  /*** dht22 **************************/
   dht.begin();
   dht_starttime = millis();
  /*** dht22 *************************/

  /***********HC-SR501******************/
   hc_start_time = millis();
  /************HC-SR501  end *************/

  /* switch **************************/
    send_Switch.enableTransmit( RC_SEND_PIN );
    recv_Switch.enableReceive( RC_RECV_PIN  );
  /* switch end **********************/  

 // 监视中断输入引脚的变化
  attachInterrupt( ppd42_pin, stateChange, CHANGE );
  attachInterrupt( HC_PIN, hcChange, CHANGE );
    
  BaoZhai.begin( devicename, ssid, pass, on_reg, on_unreg, on_get, on_set );

  Serial.println( "BaoZhai Ok" );
}


void loop() {
  if ( !BaoZhai.reged() ) return;
  
  /***** ppd42 ****************************************************************************/
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
   /***** ppd42 end ****************************************************************************/

  /**** dht22 *********************************************************************************/

  if ( millis()-dht_starttime >= 20000 ){
         dht_starttime = millis();
         
         // Reading temperature or humidity takes about 250 milliseconds!
          // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
          float h = dht.readHumidity();
          // Read temperature as Celsius (the default)
          float t = dht.readTemperature();
          
          // Check if any reads failed and exit early (to try again).
          if ( isnan(h) || isnan(t)  ) {
            Serial.println("Failed to read from DHT sensor!");
            return;
          }
//
//          Serial.println( h );
//          Serial.println( t );
          
          dht_humidity = h;
          dht_temperature = t;
  }
  /*** dht22 ******************************************************************/

    if ( recv_Switch.available() ) 
    {
        String value( recv_Switch.getReceivedValue() );
        value += ",";
        value += recv_Switch.getReceivedBitlength();
        
        recv_Switch.resetAvailable();
    
//        Serial.println( value );
          BaoZhai.sendVal( "315recv", value );
    }

    
  /***********HC-SR501******************/
  
   if ( millis()-hc_start_time>1000 )
   {
       hc_start_time = millis();

      if ( hc_cur_state==1  )
      {
          hc_cur_state = 0;
          BaoZhai.sendVal( "hc-sr501", "somepeople" );
      }       
   }
  /************HC-SR501  end *************/
}


