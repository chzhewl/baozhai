package com.schaul.plugins.share;



import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;


import org.apache.cordova.CordovaWebView;
import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaInterface;
import org.apache.cordova.api.CordovaPlugin;
import org.apache.cordova.api.PluginResult;

import com.tencent.android.tpush.XGPushManager;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Parcelable;
import android.widget.Toast;

public class xg extends CordovaPlugin  {

	@Override
	public boolean execute( String action, JSONArray args, CallbackContext callbackContext ) 
	{
	     if(action.equals("registerPush")) {	
	    	 JSONObject obj = args.optJSONObject(0);
	         if (obj != null) {
				registerPush( obj.optString("account") ); 
				return true;
	         }	     
		}
	     
	    return true;
	}

	
	private void registerPush(String account ) {
		//this.cordova.getActivity().getPackageManager()
		
		XGPushManager.registerPush( this.cordova.getActivity(), account );
	}

}
