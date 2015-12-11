#define LWIP_OPEN_SRC

extern "C" {
	#include <stdlib.h>
	#include <stdio.h>
	#include <string.h>
	#include "ets_sys.h"
	#include "os_type.h"
	#include "osapi.h"
	#include "mem.h"
	#include "user_interface.h"
	#include "espconn.h"

	#include "json/jsonparse.h"
}

#include "BaoZhai.h"
#include "util/util.h"


#include <ESP8266WiFi.h>
#include "WiFiUdp.h"
#include "lwip/opt.h"
#include "lwip/udp.h"
#include "lwip/inet.h"
#include "lwip/igmp.h"
#include "lwip/mem.h"
#include "include/UdpContext.h"


BaoZhaiClass* g_pBaoZhai;

void bz_udp_rx_callback(void)
{
	g_pBaoZhai->m_gateWayIp = 
		g_pBaoZhai->m_pudpGateWayQuery->getRemoteAddress();
	g_pBaoZhai->m_pudpGateWayQuery->flush();

	g_pBaoZhai->m_pudpGateWayQuery->disconnect();
	g_pBaoZhai->m_pudpGateWayQuery->unref();
	g_pBaoZhai->m_pudpGateWayQuery = NULL;

	LOG_DBG( "[debug] ip:%u\r\n",g_pBaoZhai->m_gateWayIp );	
}

//重新注册
void on_re_reg_module( )
{
	LOG_DBG("[debug] re reg module\r\n");
	g_pBaoZhai->req_reg_module();
}

void on_wait_GateWayQuery()
{
	//continue query ip
	LOG_DBG("[debug] on wait GateWayQuery\r\n");
	if ( g_pBaoZhai->m_gateWayIp==0 )
	{
		g_pBaoZhai->beginGetGateWayIp();
	}
	else
	{
		g_pBaoZhai->m_qttClient.host = \
					g_pBaoZhai->m_gateWayIp;
		if ( !g_pBaoZhai->m_init_connect )
		{
			LOG_DBG("[debug] mqtt connect...,%u\r\n",
				g_pBaoZhai->m_gateWayIp );
		    MQTT_Connect( &g_pBaoZhai->m_qttClient );
		    g_pBaoZhai->m_init_connect = true;
		}  
	}
}


void mqttConnectedCb(uint32_t *args)
{
    MQTT_Client* client = (MQTT_Client*)args;
    LOG_DBG("[debug] mqtt connected\r\n");

    g_pBaoZhai->req_reg_module();
}


void mqttDisconnectedCb(uint32_t *args)
{
    MQTT_Client* client = (MQTT_Client*)args;
    LOG_DBG("[debug] MQTT: Disconnected\r\n");

    //查询IP
	g_pBaoZhai->beginGetGateWayIp();

	if ( g_pBaoZhai->m_module_reged )
	{
		g_pBaoZhai->m_module_reged = false;
		if ( g_pBaoZhai->m_onunreg )
		{
			g_pBaoZhai->m_onunreg();
		}
	}
}

void mqttPublishedCb(uint32_t *args)
{
    MQTT_Client* client = (MQTT_Client*)args;
    LOG_DBG("[debug] MQTT: Published\r\n");
}


void getSet( const char* data,int data_len,
			char** out_sen,char** out_val )
{
	// LOG_DBG("[debug] getSet,data: %s,data_len:%d\r\n",
	// 	data,data_len );
	jsonparse_state  jstate;
    jsonparse_setup( &jstate,data,data_len );

    int type;
    while ( (type = jsonparse_next(&jstate)) != 0 ) {
        if (type == JSON_TYPE_PAIR_NAME) {
            if (jsonparse_strcmp_value(&jstate, "sen") == 0) {

            	jsonparse_next(&jstate);
                jsonparse_next(&jstate);

               	int len = jsonparse_get_len( &jstate );
               	if ( len>0 )
               	{
               		*out_sen = (char*)os_zalloc(len+1);
			     	(*out_sen)[len] = 0;
			     	jsonparse_copy_value( &jstate,*out_sen,len+1 );
               	}
            }
            else if (jsonparse_strcmp_value(&jstate, "val") == 0) {
            	jsonparse_next(&jstate);
                jsonparse_next(&jstate);

               	int len = jsonparse_get_len( &jstate );
               	if ( len>0 )
               	{
               		*out_val = (char*)os_zalloc(len+1);
			     	(*out_val)[len] = 0;
			     	jsonparse_copy_value( &jstate,*out_val,len+1 );
               	}
            }  
        }
    }
}

void mqttDataCb(uint32_t *args, const char* topic, 
	uint32_t topic_len, const char *data, uint32_t data_len)
{
    char *topicBuf = (char*)os_zalloc(topic_len+1),
            *dataBuf = (char*)os_zalloc(data_len+1);

    MQTT_Client* client = (MQTT_Client*)args;

    os_memcpy(topicBuf, topic, topic_len);
    topicBuf[topic_len] = 0;
    os_memcpy(dataBuf, data, data_len);
    dataBuf[data_len] = 0;

    LOG_DBG("Receive topic: %s, data: %s  freesize:%u\r\n", 
    	topicBuf, dataBuf,system_get_free_heap_size() );

    g_pBaoZhai->onMsg( topicBuf,topic_len,
    	dataBuf,data_len );

    os_free(topicBuf);
    os_free(dataBuf);
}

void BaoZhaiClass::onMsg( const char* topic,int topic_len,
		 const char* data,int data_len )
{
	// LOG_DBG("[debug] onMsg,topic: %s,topic_len:%d,val: %s,data_len:%d\r\n",
	// 	topic,topic_len,data,data_len );

	if ( os_strcmp( topic,"reg")==0 )
	{
		if ( os_strcmp(data,"ok")==0 ) //注册成功
		{
			LOG_DBG("[debug] reg  module success\r\n");
			m_module_reged = true;
			//通知上层
			if ( m_onreg )
			{
				m_onreg();
			}
		}
		else
		{
			LOG_DBG("[debug] reg module fail,tye rereg\r\n");
			m_timer.once( 5,on_re_reg_module );
		}
	}
	else if ( os_strcmp( topic,"set")==0 )
	{
		char *sen = NULL,*val = NULL;
		getSet( data,data_len,&sen,&val );
		if ( sen&&val )
		{
		 	LOG_DBG("[debug] gw req set,sensorname:%s,value:%s\r\n",
		 			sen,val );
		 	if ( m_onset )
			{
			  m_onset( sen,val );
			}
		}

		if ( sen ){ os_free( sen ); }
		if ( val ){ os_free( val ); }
	 }
	else if ( os_strcmp( topic,"get")==0 )
	{
		LOG_DBG("[debug] gw req get,sensorname:%s \r\n",data );
		if ( m_onget )
		{
			m_onget( data );
		}
	}
}

BaoZhaiClass::BaoZhaiClass():
	m_module_reged(false),
	m_init_connect(false),
	m_onget(NULL),
	m_onset(NULL),
	m_onreg(NULL),
	m_onunreg(NULL),
	m_pudpGateWayQuery(NULL),
	m_gateWayIp(0)

{
	m_devicename[0] = 0;
	g_pBaoZhai = this;
}

BaoZhaiClass::~BaoZhaiClass()
{

}

void BaoZhaiClass::initMqtt(  )
{
    MQTT_InitConnection(&m_qttClient, 0, 8124, 0);
    MQTT_InitClient(&m_qttClient, m_devicename, "", "", 30, 0);

    // MQTT_InitLWT(&m_qttClient, "/lwt", "offline", 0, 0);
    MQTT_OnConnected(&m_qttClient, mqttConnectedCb);
    MQTT_OnDisconnected(&m_qttClient, mqttDisconnectedCb);
    MQTT_OnPublished(&m_qttClient, mqttPublishedCb);
    MQTT_OnData(&m_qttClient, mqttDataCb);

    beginGetGateWayIp();
}

void BaoZhaiClass::begin( 
				const char* devicename,
				const char* ssid, 
				const char *passphrase,
				onreg onregcallback,
				onunreg onunregcallback,
				onset onsetcallback ){
	begin(  devicename,ssid,passphrase,
			onregcallback,onunregcallback,
			NULL,onsetcallback );
}

void BaoZhaiClass::begin( 
			const char* devicename,
			const char* ssid, 
			const char *passphrase,
			onreg onregcallback,
			onunreg onunregcallback,
			onget ongetcallback ,
			onset onsetcallback ){

	LOG_DBG("[debug] BaoZhai begin devicename:%s,\
		ssid:%s,pass:%s\r\n",devicename,
		ssid,passphrase );

	//记录下设备名
	os_strcpy( m_devicename,devicename );
	m_onget = ongetcallback;
	m_onset = onsetcallback;
	m_onreg = onregcallback;
	m_onunreg = onunregcallback;

	WiFi.begin(ssid, passphrase);
	uint8_t result = WiFi.waitForConnectResult();
	LOG_DBG("[debug] wifi connect result:%d\r\n",result );

	initMqtt();
}

void BaoZhaiClass::sendVal( const String& sensorname,
	const String& value ){
	LOG_DBG("[debug] send value\r\n");

    String json = "{\"sen\":\"";
    json += sensorname;
    json += "\",\"val\":\"";
    json += value;
    json += "\"}";
    LOG_DBG("[debug] send value begfore\r\n");

    MQTT_Publish( &m_qttClient, 
     	"val", json.c_str(), json.length(), 0, 0);
}


//注册模块
void BaoZhaiClass::req_reg_module()
{
	LOG_DBG("[debug] send reg module\r\n");


    String json = "{\"dev\":\"";
    json += m_devicename;
    json += "\",\"ver\":";
    json += ROM_VER;
    json += ",\"mac\":\"";
    json += WiFi.macAddress();
    json += "\"}";

    MQTT_Publish( &m_qttClient, "reg", json.c_str(), json.length(), 0, 0);
}

void BaoZhaiClass::beginGetGateWayIp()
{
	LOG_DBG("[debug] beginGetGateWayIp\r\n");
	if ( !m_pudpGateWayQuery ){
		m_pudpGateWayQuery = new UdpContext;
		m_pudpGateWayQuery->ref();    
		m_pudpGateWayQuery->onRx( bz_udp_rx_callback );

		ip_addr_t addr;
    	addr.addr = INADDR_ANY;
    	m_pudpGateWayQuery->listen(addr, 1234);
    	addr.addr = IPAddress(255,255,255,255);
		m_pudpGateWayQuery->connect( addr,8421 );
	}

	g_pBaoZhai->m_gateWayIp = 0;
	m_pudpGateWayQuery->append("1", 1);
	m_pudpGateWayQuery->send();
	m_timer.once( 3,on_wait_GateWayQuery );
}

BaoZhaiClass BaoZhai;