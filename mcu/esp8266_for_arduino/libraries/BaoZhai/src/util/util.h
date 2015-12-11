#ifndef __UNTIL__H__
#define __UNTIL__H__

// #define LOG_DEBUG

#ifdef LOG_DEBUG
	#define LOG_DBG Serial.printf
#else
	#define LOG_DBG
#endif

#endif