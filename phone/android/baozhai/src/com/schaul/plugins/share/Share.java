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

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Parcelable;
import android.widget.Toast;

public class Share extends CordovaPlugin  {

	@Override
	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {
		try {
			JSONObject jo = args.getJSONObject(0);
			doSendIntent(jo.getString("subject"), jo.getString("text"),jo.getString("shoot")); 
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK));
			return true;
		} catch (JSONException e) {
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
			return true;
		}
		
		//return super.execute(action, args, callbackContext);
	}

	
	private void doSendIntent(String subject, String text, String shoot) {
		Intent intent = new Intent(Intent.ACTION_SEND); // �������?�͵�����

          
        intent.setAction(Intent.ACTION_SEND);  

		intent.putExtra(Intent.EXTRA_SUBJECT, subject);
		intent.putExtra(Intent.EXTRA_TEXT,text);
//		
		intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_GRANT_READ_URI_PERMISSION);
		intent.putExtra("Kdescription", "好玩的即点即玩的游戏，不容错过。 http://wan.jj.cn");
//		
		if ( shoot=="1" )
		{
			ScreenShot.shoot( this.cordova.getActivity(), new File( "/sdcard/loading2.png" ) );
			
		    intent.setType("image/png");  
	        intent.putExtra(Intent.EXTRA_STREAM, Uri.fromFile( new File("/sdcard/loading2.png") ));   
		}
   
        
        List<ResolveInfo> resInfos = this.cordova.getActivity().getPackageManager().queryIntentActivities(intent, 0);
        
        List<Intent> targetedShareIntents = new ArrayList<Intent>();
        
        for (ResolveInfo info : resInfos) {
        	
            Intent targeted = new Intent(Intent.ACTION_SEND);

       	 	ActivityInfo activityInfo = info.activityInfo;
            // judgments : activityInfo.packageName, activityInfo.name, etc.
       	 	String packageName = activityInfo.packageName.toLowerCase();
       	 	String name_ui = activityInfo.name.toLowerCase();
       	 	
       	 	if (  packageName.contains("tencent") ||
       		      packageName.contains("sina") 
       		   ) 
       	 	{
       	 			
       	 				System.out.println( packageName );
		       	 	
		       	 	//ComponentName componentName = new ComponentName(packageName, name_ui); 
       	 		   // targeted.setComponent(componentName);  
			         targeted.setPackage(activityInfo.packageName);
       	 			 targeted.setClassName(activityInfo.packageName, activityInfo.name);
       	 			 //targeted.set

		            
			         targeted.putExtra(Intent.EXTRA_SUBJECT, subject);
			         targeted.putExtra(Intent.EXTRA_TEXT,"测试连接 http://wan.jj.cn");
			         targeted.putExtra(Intent.EXTRA_TITLE, "test");
		//			
			         targeted.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_GRANT_READ_URI_PERMISSION);
			         targeted.putExtra("Kdescription", "好玩的即点即玩的游戏，不容错过。 http://wan.jj.cn");
		//			
			         targeted.setType("image/png");  
			         targeted.putExtra(Intent.EXTRA_STREAM, Uri.fromFile( new File("/sdcard/loading2.png") ));    
			         
			         
		            targetedShareIntents.add(targeted);
            
            
    	 	}
            
        	 //ActivityInfo activityInfo = info.activityInfo;
        	             // judgments : activityInfo.packageName, activityInfo.name, etc.
        	//String packageName = activityInfo.packageName.toLowerCase();
        	
        	//System.out.println( activityInfo.name );
        }
        
        
        
        Intent chooserIntent = Intent.createChooser(targetedShareIntents.remove(0), "分享到:");
        if (chooserIntent == null) {
            return;
        }

        chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, targetedShareIntents.toArray(new Parcelable[] {}));
        try {
        	this.cordova.getActivity().startActivity(chooserIntent);
        } catch (android.content.ActivityNotFoundException ex) {
            Toast.makeText(this.cordova.getActivity(), "Can't find share component to share", Toast.LENGTH_SHORT).show();
        }
        
//        
//        this.cordova.getActivity().startActivity( Intent.createChooser(intent, subject) );
        //this.cordova.getActivity().startActivity( intent );
        //startActivity(intent);  

	}

}
