#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <Ticker.h>
#include <BaoZhai.h>

const char* ssid = "Jerome_WL";
const char* pass = "www.jj.cn";
const int LED_PIN =3;

int switch_status = HIGH;


/*
 * 设备与网关连接成功
 */
void on_reg( )
{
  digitalWrite(LED_PIN, HIGH);
  switch_status = HIGH;
}

/*
 * 设备与网关断开连接
 */
void on_unreg()
{
  digitalWrite(LED_PIN, HIGH);
  switch_status = HIGH;
}
/*
 * 请求获取传感器数据
 */
void on_get( const String& sensorname )
{
    BaoZhai.sendVal( sensorname, switch_status == HIGH ? "off" : "on" );
}

/*
 * 请求设置传感器数据
 */
void on_set( const String& sensorname,
             const String& value )
{
    switch_status = (  value=="on" ? LOW : HIGH );
    
    digitalWrite(LED_PIN, switch_status);
    BaoZhai.sendVal( sensorname, value );
}

void setup() {
  Serial.begin(115200);
  Serial.println("BaoZhai Switch Test");
  pinMode( LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  //继电器高电位关
  
  BaoZhai.begin( "switch-01", ssid, pass, on_reg, on_unreg, on_get, on_set );
  Serial.println( "baozhai begin end");
}


void loop() {
}

