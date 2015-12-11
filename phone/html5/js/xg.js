/**
*Œﬁ”√
 */

var xg = function() {
};
xg.prototype.registerPush = function ( account ) {
   cordova.exec(function(){}, function(){}, 'xg', 'registerPush', [  {"account":account } ]);
};

if(!window.plugins) {
    window.plugins = {};
}
if (!window.plugins.xg) {
    window.plugins.xg = new xg();
}