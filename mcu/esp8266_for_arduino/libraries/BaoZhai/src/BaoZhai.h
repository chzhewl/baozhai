#ifndef __BAOZHAI__H__
#define __BAOZHAI__H__

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Ticker.h>
extern "C" {
	#include "mqtt/mqtt.h"
}

#define ROM_VER 1

//函数定义
typedef void ( *onget )( const String& sensorname );
typedef void ( *onset )( const String& sensorname,
						 const String& value );
typedef void ( *onreg )();
typedef void ( *onunreg)();

class UdpContext;

class BaoZhaiClass{
public:
	BaoZhaiClass();
	~BaoZhaiClass();

public:
	void begin( const char* devicename,
				const char* ssid, 
				const char *passphrase,
				onreg onregcallback,
				onunreg onunregcallback,
				onget ongetcallback = NULL,
				onset onsetcallback = NULL );
	void begin( const char* devicename,
				const char* ssid, 
				const char *passphrase,
				onreg onregcallback,
				onunreg onunregcallback,
				onset onsetcallback );
	void sendVal( const String& sensorname,
				  const String& value );

	bool reged() { return m_module_reged; }
private:
	void beginGetGateWayIp();
	void initMqtt( );
	void req_reg_module();
	void onMsg( const char* topic,int topic_len,
		 const char* data,int data_len );

	char 		m_devicename[16];
	uint8_t		m_module_reged;
	uint8_t		m_init_connect;

	UdpContext* m_pudpGateWayQuery;
	uint32_t    m_gateWayIp;

	MQTT_Client m_qttClient;

	onget  		m_onget;
	onset 		m_onset;
	onreg       m_onreg;
	onunreg  	m_onunreg;


	Ticker 		m_timer;
	friend void on_wait_GateWayQuery();
	friend void on_re_reg_module();
	friend void bz_udp_rx_callback(void);
	friend void mqttConnectedCb(uint32_t*);
	friend void mqttDisconnectedCb(uint32_t*);
	friend void mqttPublishedCb(uint32_t*);
	friend void mqttDataCb(uint32_t*, const char*, uint32_t, const char*, uint32_t);
};

extern BaoZhaiClass BaoZhai;

#endif