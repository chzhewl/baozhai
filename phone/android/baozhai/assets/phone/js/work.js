/**
 * Created by chenzhe on 2015/1/13.
 */
$(document).on("mobileinit", function(){
});

!function(){
    var This = this;
    this._islogged = false;
    this._curgwid = 0;
    this._currpage_el = null;
    this._add_gw_interval;
    this._add_gw_time = 60;


    //util
    var array_distinct = function( arr ){
        var newArr=[],obj={};
        for(var i=0,len=arr.length;i<len;i++){
            if(!obj[arr[i]]){ 
                newArr.push(arr[i]);
                obj[arr[i]]=true;
            }
        }
        return newArr;
    };
    ///

    function sendmsg_tip(){
        $("#_send_message_tip").clearQueue();
        $("#_send_message_tip").css("top","80%");
        $("#_send_message_tip").show();
        $("#_send_message_tip").animate({top:"10%"},"slow","swing",function(){
            $("#_send_message_tip").hide();
        });
    }
    function recvmsg_tip(){
		$("#_recv_message_tip").clearQueue();
		$("#_recv_message_tip").css("top","10%");
		$("#_recv_message_tip").show();
		$("#_recv_message_tip").animate({top:"80%"},"slow","swing",function(){
			$("#_recv_message_tip").hide();
		});
    }
    function enablelogin()
    {
        $( "#_login" ).button( "enable" );
        $( "#_register" ).button( "enable" );

        $( "#_account" ).textinput( "enable" );
        $( "#_passwd" ).textinput( "enable" );
    }

    function disablelogin()
    {
        $( "#_login" ).button( "disable" );
        $( "#_register" ).button( "disable" );

        $( "#_account" ).textinput( "disable" );
        $( "#_passwd" ).textinput( "disable" );
    }

    function showTip( msg )
    {
        setTimeout(function(){
            $.mobile.loading( "show", {
                text: msg,
                textVisible: true,
                theme: "c",
                textonly: true,
                html: ""});
        },1);
    }

    function showLoading( msg )
    {
        setTimeout(function(){
            $.mobile.loading( "show", {
                text: msg,
                textVisible: true,
                theme: "c",
                textonly: false,
                html: ""});
        },1);
    }

    function showLoading_html( html )
    {
        setTimeout(function(){
            $.mobile.loading( "show", {
                text: "",
                textVisible: true,
                theme: "c",
                textonly: false,
                html: html});
        },1);
    }
    function hideLoading()
    {
        $.mobile.loading('hide');
    }

    function showloginerror(msg)
    {
        $("#_loginerror").html("<h3>" + msg + "</h3>");
        $("#_loginerror").popup( "open");
    }

    function showaddgwerror(msg)
    {
        $("#_add_gw_error").html("<h3>" + msg + "</h3>");
        $("#_add_gw_error").popup( "open");
    }

    function barcodescanner()
    {
        if ( !window.plugins  ) return;

        window.plugins.barcodeScanner.scan(
            function(success) {
                if (success.format && success.format=="QR_CODE" ){
                    $("#_gw_mac").val( success.text );
                }
            },
            function(fail) {

            }
        );
    }

    function registerPush( account )
    {
        if ( !window.plugins  ) return;
        window.plugins.xg.registerPush( account );
    }

    function showgwlisterror(msg)
    {
        $("#_gwlisterror").html("<h3>" + msg + "</h3>");
        $("#_gwlisterror").popup( "open");
    }

    function showtoptip( msg){
        $(document.body).find(".top_tip").remove();
        $(document.body).append('<div class="top_tip">' + msg + '</div>');
    }

    function hidetoptip(){
        $(document.body).find(".top_tip").remove();
    }

    function clear_add_gw_loading()
    {
        clearInterval( This._add_gw_interval );
        $( "#_add_gw_btn" ).button( "enable" );
        $( "#_gw_mac" ).textinput( "enable" );
       // $( "#_retur_gw_list").button( "enable" );
        hideLoading();
    }

            This._startsocket = function(){
            //开始长连接
            showLoading("正在连接服务器…");
            This.socket = io('http://ctcp.baozhai.cc:20008');;
            This.socket.on('connect', function () {
                hideLoading();

                var account = localStorage.getItem("_account");
                var passwd = localStorage.getItem("_passwd");

                if ( account && passwd ){
                    This.socket.emit( "login",{email:account,passwd:passwd} );
                    showLoading("正在登录…");
                }else{
                    enablelogin();
                }
            });

            This.socket.on('disconnect', function (info) {
                This._islogged = false;
                if ( info!="io server disconnect" ){
                    showLoading("与服务器断开连接");
                }

                disablelogin();
            });

            This.socket.on('reconnect_attempt', function () {
                showLoading("正在重新连接服务器…");
                disablelogin();
            });

            This.socket.on('login', function(data){
                hideLoading();
                console.log( data );

                //登录成功
                if ( data.result && data.result=="logged" ){

                    This._islogged = true;
                    jQuery.mobile.changePage("#_page_gw_list");

                    var account = $("#_account").val();
                    var passwd = $("#_passwd").val();

                    localStorage.setItem("_account", account);
                    localStorage.setItem("_passwd", passwd);

                    registerPush( account );

                    $("#_logged_account").html(account);

                }else{
                    enablelogin();
                    showloginerror("登录失败");
                }

            });

            function change_gw_uit( gw_id,ui )
            {
                if ( This.gw_ui_el ){
                    This.gw_ui_el.remove();
                }

                try{
                    This.gw_ui_el = $(ui);
                    $.mobile.pageContainer.append(This.gw_ui_el);
                    This._curgwid = gw_id;
                    $.mobile.changePage('#bz_page_home' );
                }catch(e){
                    alert("页面数据解析出现错误：\r\n"+ e);
                }
            }

            This.socket.on("get_gw_ui",function(data){
                hideLoading();

                switch( data.error )
                {
                    case "gw id error":{
                        showgwlisterror("无界面");
                        break;
                    }
                    case "no update":{
                        var ui = localStorage.getItem("_" + data.gw_id +"_ui");
                        change_gw_uit( data.gw_id,ui );
                        break;
                    }
                    default:{
                        localStorage.setItem("_" + data.gw_id +"_ui",data.ui);
                        localStorage.setItem("_" + data.gw_id +"_ui_timestamp",data.timestamp);
                        change_gw_uit( data.gw_id,data.ui );
                        break;
                    }
                }
            });

            This.socket.on('gw_list', function(data){
                $( "#_gw_list").html("");
                for( var k in data){
                    var item = data[k];

                    var html = _.template(tpls.gwitem)(item);
                    $( "#_gw_list" ).append( html );
                }
                $( "#_gw_list").listview('refresh');
            });

            This.socket.on('bind_gw',function(data){
                clear_add_gw_loading();
                if ( data.error ){
                    switch( data.error ){
                        case "mac error":
                        {
                            showaddgwerror("网关不存在");
                            break;
                        }
                        case "bind fail":
                        {
                            showaddgwerror("绑定失败");
                            break;
                        }
                        case "gw offline":
                        {
                            showaddgwerror("网关处于离线状态");
                            break;
                        }
                        case "binded":
                        {
                            showaddgwerror("网关已绑定，无须再次绑定");
                            break;
                        }
                    }
                }else{
                    jQuery.mobile.changePage("#_page_gw_list");
                }
                
            });

            This.socket.on("logout",function(data){
                hideLoading();
                This._islogged = false;
               // jQuery.mobile.changePage("#_page_login");
                window.location.reload();
            });
            This.socket.on("kick",function(){
                showTip("账号在其他地方登录");
                registerPush( "*" );
            });


            var update_conrtol = function( data ){
                console.log( data );
                if ( _currpage_el==null ) return;
                var el = _currpage_el.find('[data-device="' + data.device + '"][data-sensor="'
                    + data.sensor + '"]' );
                el.each(function(index){
                    var role = $(this).data("role");
                    var sensor = $(this).data("sensor");
                    //if ( sensor!=data.sensor ) continue;

                    switch( role ){
                        case "lable":{
                            $(this).html( data.value );
                            break;
                        }
                        case "slider":{
                            var e_tmp = $(this).find('option[value="' + data.value + '"]');
                            if ( e_tmp ){
                                $(this)[0].selectedIndex = e_tmp.index();
                                $(this).slider( "refresh" );
                            }
                            break;
                        }
                    }
                });
            };

            var update_conrtol_state = function(device,state){
                    if ( _currpage_el==null ) return;
                    var el = _currpage_el.find('[data-device="' + device + '"]');
                    el.each(function(index){
                        var role = $(this).data("role");
                        switch( role ){
                            case "lable":{
                                //el.html(data.val);
                                //el.val( data.val );
                                //$(this).html( data.value );
                                var device = $(this).data("device");
                                var sensor = $(this).data("sensor");
                                if ( device && sensor ){
                                    sendmsg_tip();
                                    This.socket.emit("get",{ gw_id:This._curgwid,device:device,sensor:sensor, value:'' }  );
                                }
                                break;
                            }
                            case "slider":{
                                if ( state=="online"){
                                    $(this).slider( "enable" );
                                }else{
                                    $(this).slider( "disable" );
                                }
                                break;
                            }
                            case "button":{
                                if ( state=="online"){
                                    $(this).button( "enable" );
                                }else{
                                    $(this).button( "disable" );
                                }
                                break;
                            }
                        }
                    });
            };

            //This.socket.on("set",function(data){
            //    recvmsg_tip();
            //    hideLoading();
            //    console.log("set");
            //    console.log( data );
            //
            //    update_conrtol( data );
            //});


            This.socket.on("val",function(data){
                recvmsg_tip();
                hideLoading();
                console.log("val");
                console.log( data );

                update_conrtol( data );
            });

            This.socket.on("dev_state_query",function(data){
                //recvmsg_tip();
                //hideLoading();
                console.log("dev_state_query");
                console.log( data );

                if ( data.gw_id!=This._curgwid ) return;

                for( var k in data.devices )
                {
                    var itm = data.devices[k];
                    update_conrtol_state( itm.device,itm.state );
                }
            });

            This.socket.on("dev_change",function(data){
                recvmsg_tip();
                //hideLoading();
                console.log("dev_change");
                console.log( data );

                if ( data.gw_id!=This._curgwid ) return;

                update_conrtol_state( data.device,data.state );

                // for( var k in data.devices )
                // {
                //     var itm = data.devices[k];
                //     update_conrtol_state( itm.device,itm.state );
                // }
            });

            This.socket.on("gw_offline",function(data){
                console.log("gw_offline:",data);

                var gw_el = $('#_gw_id_' + data.id);
                gw_el.addClass("gray");
                gw_el.find("#online_state").html("离线");
                gw_el.data("online",0);

                if ( This._curgwid==data.id ){
                    showtoptip("网关处于离线状态")

                    var el = $('[data-device]');
                    var devices = [];
                    el.each(function(index){
                        var role = $(this).data("role");
                        var device = $(this).data("device");
                        devices.push( device );
                        switch( role ){
                            case "slider":
                            {
                                $(this).slider( "disable" );
                                break;
                            }
                            case "button":
                            {
                                $(this).button( "disable" );
                                break;
                            }
                        }
                    });
                }
            });

            This.socket.on("gw_online",function(data){
                console.log("gw_online:",data);
                var gw_el = $('#_gw_id_' + data.id);
                gw_el.removeClass("gray");
                gw_el.find("#online_state").html("在线");
                gw_el.data("online",1);
                if ( This._curgwid==data.id ){
                    hidetoptip();
                }
            });

            This.socket.on("set_gw_name",function(data){
                console.log("set_gw_name:",data);
                This.socket.emit( "gw_list" );
            });

            This.socket.on("unbind_gw",function(data){
                console.log("unbind_gw:",data);
                $( "#_gw_list").html("");
                This.socket.emit( "gw_list" );
            });
        }

    $(document).on("pageinit","#_page_login",function(){
        if ( !This.socket ){
            This._startsocket();
        }
        var account = localStorage.getItem("_account");
        var passwd = localStorage.getItem("_passwd");

        if ( account && passwd ){
            $("#_account").val( account );
            $("#_passwd").val( passwd );
        }else{
            $("#_account").val( "" );
            $("#_passwd").val( "" );
        }
    });

    $(document).on("pageshow",'[id^="bz_page_"]',function(e) {
        var online = $('#_gw_id_' + This._curgwid).data("online");
        if ( online==0 ){
            showtoptip("网关处于离线状态");
        }
        _currpage_el = $(e.target);
        var el = _currpage_el.find("[data-device]");
        //$($("#bz_page_home"),'[data-device]');
        var devices = [];
        el.each(function(index){
            var role = $(this).data("role");
            var device = $(this).data("device");
            devices.push( device );
            switch( role ){
                case "lable":
                case "slider":
                {
                    var sensor = $(this).data("sensor");
                    if ( device && sensor ){
                        sendmsg_tip();
                        This.socket.emit("get",{ gw_id:This._curgwid,device:device,sensor:sensor, value:'' }  );
                    }
                    break;
                }
            }
        });
        devices = array_distinct( devices );
        This.socket.emit("dev_state_query",
            {   gw_id:This._curgwid,
                devices:devices }  );
    });
    //
    //$(document).on("pageinit","#home",function(){
    //    var online = $('#_gw_id_' + This._curgwid).data("online");
    //    if ( online==0 ){
    //        showtoptip($("#home"),"网关处于离线状态")
    //    }
    //    var el = $('[data-device]');
    //    var devices = [];
    //    el.each(function(index){
    //        var role = $(this).data("role");
    //        var device = $(this).data("device");
    //        devices.push( device );
    //        switch( role ){
    //            case "lable":
    //            case "slider":
    //            {
    //                var sensor = $(this).data("sensor");
    //                if ( device && sensor ){
    //                    sendmsg_tip();
    //                    This.socket.emit("get",{ gw_id:This._curgwid,device:device,sensor:sensor, value:'' }  );
    //                }
    //                break;
    //            }
    //        }
    //    });
    //    devices = array_distinct( devices );
    //    This.socket.emit("dev_state_query",
    //        {   gw_id:This._curgwid,
    //            devices:devices }  );
    //});

    $(document).on("pagebeforeshow",function(e){
        if ( e && e.target ){
            var id = e.target.getAttribute("id");
            if ( !This._islogged ){
                if ( id !="_page_login" ){
                    jQuery.mobile.changePage("#_page_login",{transition:"none"});
                }
            }else{
                switch( id )
                {
                    case "_page_gw_list":
                    {
                        hidetoptip();
                        _currpage_el = null;
                        This.socket.emit( "gw_list" );
                        break;
                    }
                }
            }
        }
    });

    $(document).ready(function() {
        $("body").delegate('[id^="bz_page_"]',"change",function(e){
            if ( e.target ){
                var el  = $(e.target);
                switch( el.data("role") ){
                    case "slider":{
                        var device = el.data("device");
                        var sensor = el.data("sensor");
                        var val  = el.val();
                        if ( device && sensor && val!="undefined" ){
                            sendmsg_tip();
                            This.socket.emit("set",{ gw_id:This._curgwid,device:device,sensor:sensor, value:val }  );
                        }
                        break;
                    }
                }
            }
        });

        $("body").delegate('[id^="bz_page_"]',"tap",function(e){
            if ( e.target ){
                var el  = $(e.target);
                switch( el.data("role") ){
                    case "button":{
                        console.log( "button click");

                        var device = el.data("device");
                        var sensor = el.data("sensor");
                        var val = el.data("tapval");
                        if ( device && sensor && val!="undefined" ){
                            sendmsg_tip();
                            This.socket.emit("set",
                                { gw_id:This._curgwid,
                                  device:device,sensor:sensor, 
                                  value:val }  );
                        }

                        break;
                    }
                    case "lable":{
                        var device = el.data("device");
                        var sensor = el.data("sensor");
                        if ( device && sensor ){
                            sendmsg_tip();
                            This.socket.emit("get",{ gw_id:This._curgwid,device:device,sensor:sensor, value:'' }  );
                        }
                        break;
                    }
                }
            }
        });

        $("body").delegate('[id^="bz_page_"]',"vmousedown",function(e){
            if ( e.target ){
                var el  = $(e.target);
                switch( el.data("role") ){
                    case "button":{
                        var device = el.data("device");
                        var sensor = el.data("sensor");
                        var val = el.data("downval");
                        if ( device && sensor && val!="undefined" ){
                            sendmsg_tip();
                            This.socket.emit("set",
                                { gw_id:This._curgwid,
                                  device:device,sensor:sensor, 
                                  value:val }  );
                        }
                        e.preventDefault();
                        break;
                    }
                }
            }
        });

        $("body").delegate('[id^="bz_page_"]',"vmouseup",function(e){
            if ( e.target ){
                var el  = $(e.target);
                switch( el.data("role") ){
                    case "button":{
                        var device = el.data("device");
                        var sensor = el.data("sensor");
                        var val = el.data("upval");
                        if ( device && sensor && val!="undefined" ){
                            sendmsg_tip();
                            This.socket.emit("set",{ gw_id:This._curgwid,device:device,sensor:sensor, value:val }  );
                        }
                        break;
                    }
                }
            }
        });


        $("#_page_gw_list").delegate("#_enter_gw","tap",function(){
            if ( $(this).data("gwid") ){
                var gw_id = $(this).data("gwid");
                showLoading("正在加载主控页面…");

                var ui_timestamp = localStorage.getItem( "_" + gw_id +"_ui_timestamp");
                ui_timestamp = ui_timestamp ? ui_timestamp : 0;
                This.socket.emit( "get_gw_ui",{gw_id:gw_id,timestamp:ui_timestamp} );
            }
        });

        $("#_page_gw_list").delegate("#_action_gw","click",function(e){
            //jQuery.mobile.changePage("#popupgwAction",{transition:"pop",role:"popup"});

            $("#popupgwAction").data("gwid", $(this).data("gwid") );
            $("#popupgwAction").popup( "open" );

        });


        //按钮事件处理
        $("#_login").on("click",function(){
            var account = $("#_account").val();
            var passwd = $("#_passwd").val();

            if ( account=="" ||
                  passwd==""  ){
                showloginerror("用户和密码不能为空！");
                return;
            }

            This.socket.emit( "login",{email:account,passwd:passwd} );
            disablelogin();
            showLoading("正在登录…");
        });



        $("#_logout_ok").on("click",function(){
            localStorage.removeItem("_account");
            localStorage.removeItem("_passwd");

            showLoading("正在注销账号…");
            This.socket.emit("logout",{} );
            registerPush( "*" );
        });

        $("#_gw_name").change(function(){
            var gwid = $(this).parents("div#popupgwAction").data("gwid");
            var name = $("#_gw_name").val();
            if ( gwid&&name!=""&&name.length<32 ){
                This.socket.emit( "set_gw_name",{gw_id:gwid,desc:name} );
                $("#popupgwAction").popup("close");
            }
        });

        $("#_set_default_gw").on("tap",function(){
            $("#popupgwAction").popup("close");
        });

        $("#_unbound_gw").on("tap",function(){
            var gwid = $(this).parents("div#popupgwAction").data("gwid");
            if ( gwid ){
                This.socket.emit( "unbind_gw",{gw_id:gwid} );
                $("#popupgwAction").popup("close");
            }
        });

        $("#_add_gw_btn").on("tap",function(){
            var mac = $("#_gw_mac").val().toUpperCase();
            var reg_name= /[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}/;
            if( reg_name.test(mac) ){ 
                This.socket.emit( "bind_gw",{mac:mac} );
                $( "#_add_gw_btn" ).button( "disable" );
                $( "#_gw_mac" ).textinput( "disable" );
                showLoading_html('<p>绑定请求已发出，请在网关管理界面确认请求。\
                    </p><p id="_add_gw_timer" style="text-align:center;">60秒后重试</p>');
                
                This._add_gw_time = 60;
                clearInterval(This._add_gw_interval);
                This._add_gw_interval = setInterval( function(){
                    This._add_gw_time--;
                    $("#_add_gw_timer").html(This._add_gw_time+"秒后重试");
                    if ( This._add_gw_time==0 ){
                        clear_add_gw_loading();
                    }
                },1000);
            }else{
                showaddgwerror("MAC地址格式错误");
            }            
        });

        if ( window.plugins  )
        {
            $("#_barcodescanner_btn").on("tap",function(){
                barcodescanner();
            });
        }
        $("#_register").on("tap",function(){
            alert("请加入QQ群：88853045 联系群主注册！");
        });
    });
}();