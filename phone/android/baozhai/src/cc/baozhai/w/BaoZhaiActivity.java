package cc.baozhai.w;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.text.util.Linkify;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.WebView;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import org.apache.cordova.Config;
import org.apache.cordova.CordovaChromeClient;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaWebViewClient;
import org.apache.cordova.api.CordovaInterface;
import org.apache.cordova.api.CordovaPlugin;
import org.apache.cordova.api.LOG;

import com.tencent.android.tpush.XGPushManager;
import com.umeng.analytics.MobclickAgent;
import com.umeng.update.UmengUpdateAgent;

import cc.baozhai.w.R;


public class BaoZhaiActivity extends Activity  implements CordovaInterface{
	
	public CordovaWebView cordovaWebView;
	public ImageView imageView;
	public TextView processView;
	public Long  splashTimestamp;
	public Boolean mLoadPageFail = false;
	public String mCurlUrl = "";
	
	
	
	////////
	
    protected CordovaPlugin activityResultCallback = null;
    protected boolean activityResultKeepRunning;
    private String initCallbackClass;
    
	
	private final ExecutorService threadPool = Executors.newCachedThreadPool();
	 
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
        if(savedInstanceState != null)
        {
            initCallbackClass = savedInstanceState.getString("callbackClass");
        }
		 
		
		//友盟调试模式
		MobclickAgent.setDebugMode( false );
		//任意网络提示能信
		UmengUpdateAgent.setUpdateOnlyWifi(false);
		//友盟更新
		UmengUpdateAgent.update(this);
		
		Context context = getApplicationContext();
		XGPushManager.registerPush(context);	
		
		
		
		setContentView(R.layout.minigame_main);		
		
				
        cordovaWebView = (CordovaWebView) findViewById(R.id.cordovaWebView);
        imageView  = ( ImageView ) findViewById( R.id.load_logo );
        processView = ( TextView ) findViewById( R.id.loadprocess );
        
        Config.init(this);
        
        
        cordovaWebView.setWebChromeClient(new CordovaChromeClient(this){

			@Override
			public void onProgressChanged(WebView view, int newProgress) {
				// TODO Auto-generated method stub
				
				if (!mLoadPageFail){
					processView.setText("拼命加载中："+newProgress+"%");
				}
				
				System.out.println( "process:" + newProgress );
				super.onProgressChanged(view, newProgress);
			}
        	
        });
        
        
        
        cordovaWebView.setWebViewClient( new CordovaWebViewClient(this,cordovaWebView){
			@Override
			public void onPageFinished(WebView view, String url) {
				
				if ( !mLoadPageFail ) 
				{
					Long interval = System.currentTimeMillis() - splashTimestamp;
					//如果页面加载时间小于2秒就就2秒收在显示网页
					if ( interval < 1000 ){
						new Handler().postDelayed(new Runnable(){   
		
						    public void run() {   
								imageView.setVisibility(View.GONE);
								processView.setVisibility(View.GONE);
								cordovaWebView.setVisibility(View.VISIBLE);
						    }   
		
						 }, 1000 - interval); 
					}else{
						imageView.setVisibility(View.GONE);
						processView.setVisibility(View.GONE);
						cordovaWebView.setVisibility(View.VISIBLE);
					}
					
					System.out.println("onPageFinished" );
				}

				super.onPageFinished(view, url);
			}

			@Override
			public void onPageStarted(WebView view, String url, Bitmap favicon) {
				

				mLoadPageFail = false;
				mCurlUrl = url;
			
				//imageView.setVisibility(View.VISIBLE);
				processView.setVisibility(View.VISIBLE);
				cordovaWebView.setVisibility(View.GONE);
				
				splashTimestamp = System.currentTimeMillis();
				
		
				super.onPageStarted(view, url, favicon);
			}

			@Override
			public void onReceivedError(WebView view, int errorCode,
					String description, String failingUrl) {
				
				//Toast.makeText( MiniGameActivity.this, "网络故障！请检查网络重新打开游戏。",Toast.LENGTH_LONG ).show();
				mLoadPageFail = true;
				
				processView.setVisibility(View.VISIBLE);
				processView.setText("网络故障！点击重试");
				
		        processView.setOnClickListener( new View.OnClickListener() {
					@Override
					public void onClick(View arg0) {
						
						processView.setOnClickListener(null);
						if ( mLoadPageFail ){
							
							cordovaWebView.loadUrl(mCurlUrl);
							processView.setText("拼命加载中：0%");
						}				
					}
				} );
				
				System.out.println("recievedError:" + errorCode );
				super.onReceivedError(view, errorCode, description, failingUrl);
			}
			
        		
        });
        
        
        splashTimestamp = System.currentTimeMillis();
//      //  cordovaWebView.loadUrl("file:///android_asset/app.html");
       cordovaWebView.loadUrl("file:///android_asset/phone/index_app.html");
        //cordovaWebView.loadUrl("http://192.168.1.201:8081/index_app.html");
        
        
	}
	
	//////////////////////////
	

    public Context getContext() {
        return this;
    }
	
	@Override
	public void startActivityForResult(CordovaPlugin command, Intent intent,
			int requestCode) {
		this.activityResultCallback = command;
        // Start activity
        super.startActivityForResult(intent, requestCode);
	}

	@Override
	public void setActivityResultCallback(CordovaPlugin plugin) {
		this.activityResultCallback = plugin;
		
	}
	
	@Override
    protected void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        
//	        if (appView != null && requestCode == CordovaChromeClient.FILECHOOSER_RESULTCODE) {
//	        	ValueCallback<Uri> mUploadMessage = this.appView.getWebChromeClient().getValueCallback();
//	            Log.d(TAG, "did we get here?");
//	            if (null == mUploadMessage)
//	                return;
//	            Uri result = intent == null || resultCode != Activity.RESULT_OK ? null : intent.getData();
//	            Log.d(TAG, "result = " + result);
////	            Uri filepath = Uri.parse("file://" + FileUtils.getRealPathFromURI(result, this));
////	            Log.d(TAG, "result = " + filepath);
//	            mUploadMessage.onReceiveValue(result);
//	            mUploadMessage = null;
//	        }
        CordovaPlugin callback = this.activityResultCallback;
        if(callback == null && initCallbackClass != null) {
            // The application was restarted, but had defined an initial callback
            // before being shut down.
            this.activityResultCallback = cordovaWebView.pluginManager.getPlugin(initCallbackClass);
            callback = this.activityResultCallback;
        }
        if(callback != null) {
            callback.onActivityResult(requestCode, resultCode, intent);
        }
	}

	@Override
	public Activity getActivity() {
		// TODO Auto-generated method stub
		return this;
	}

	@Override
	public Object onMessage(String id, Object data) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public ExecutorService getThreadPool() {
		// TODO Auto-generated method stub
		return threadPool;
	}
	

	///////////////////

	
	
	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}


	@Override
	protected void onPause() {
		// TODO Auto-generated method stub
		super.onPause();
		
		MobclickAgent.onResume(this);
	}

	@Override
	protected void onResume() {
		// TODO Auto-generated method stub
		super.onResume();
		
		MobclickAgent.onPause(this);
	}


	private long mExitTime;
	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
//		if (keyCode == KeyEvent.KEYCODE_BACK) {
//			if ((System.currentTimeMillis() - mExitTime) > 2000) {
//				Toast.makeText(this, "在按一次退出",
//						Toast.LENGTH_SHORT).show();
//				mExitTime = System.currentTimeMillis();
//			} else {
//				finish();
//			}
//			return true;
//		}

		return super.onKeyDown(keyCode, event);
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle action bar item clicks here. The action bar will
		// automatically handle clicks on the Home/Up button, so long
		// as you specify a parent activity in AndroidManifest.xml.
//		int id = item.getItemId();
//		if (id == R.id.action_settings) {
//			return true;
//		}
		return super.onOptionsItemSelected(item);
	}
	
	
	
}
