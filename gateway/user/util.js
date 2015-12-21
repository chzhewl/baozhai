var http = require('http');

function wl_update_data( gwflag,postData )
{
    postData = JSON.stringify( postData );
    var options = {
      hostname: 'www.lewei50.com',
      port: 80,
      path: '/api/v1/gateway/updatesensors/' + gwflag,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
        'userkey' : "xxxxxxxxxxxxxxx"
      }
    };
    
    var req = http.request(options, function(res) {
    });
    req.on('error', function(e) {
    });
    req.write(postData);
    req.end();
}

module.exports.wl_update_data = wl_update_data;