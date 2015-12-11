/*
 *宝宅开关示例
 */

 //必须包含的头文件
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <Ticker.h>
#include <BaoZhai.h>

const char* ssid = "xxxxxxxxx";   //WIFI账号
const char* pass = "xxxxxxxxx";   //WIFI密码
const char* devicename = "switch"; //设备名
const int SWITCH_PIN = 3; //开关使用的IO口

int switch_status = HIGH; //当前开关状态

/*
 * 设备与网关连接成功
 */
void on_reg( )
{
  //初始化开关状态（高电位关）
  digitalWrite(SWITCH_PIN, HIGH);
  switch_status = HIGH;
}

/*
 * 设备与网关断开连接
 */
void on_unreg()
{
  //初始化开关状态（高电位关）
  digitalWrite(SWITCH_PIN, HIGH);
  switch_status = HIGH;
}
/*
 * 网关请求获取开关状态
 */
void on_get( const String& sensorname )
{
    //发送开关状态
    BaoZhai.sendVal( sensorname, switch_status == HIGH ? "off" : "on" );
}

/*
 * 网关请求设置开关状态
 */
void on_set( const String& sensorname,
             const String& value )
{
    switch_status = (  value=="on" ? LOW : HIGH );
    
    //改变开关状态
    digitalWrite(SWITCH_PIN, switch_status);
    //通知改变成功
    BaoZhai.sendVal( sensorname, value );
}

void setup() {
  //初始化串口
  Serial.begin(115200);
  Serial.println("BaoZhai Switch demo");

  //设置IO口为输出模式
  pinMode( SWITCH_PIN, OUTPUT);
  //初始化开关状态（高电位关）
  digitalWrite(SWITCH_PIN, HIGH);  
  
  //初始化宝宅
  BaoZhai.begin( devicename, ssid, pass, 
      on_reg, on_unreg, on_get, on_set );
  Serial.println( "baozhai begin...");
}

void loop() {
}