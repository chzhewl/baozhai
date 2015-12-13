del ..\..\html5\js\app.js


java.exe -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js ..\..\html5\js\work.js --js_output_file work.min.js
java.exe -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js ..\..\html5\js\jquery-1.9.1.min.js --js_output_file jquery-1.9.1.min.js
java.exe -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js ..\..\html5\js\jquery.mobile-1.3.2.min.js --js_output_file jquery.mobile-1.3.2.min.js
java.exe -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js ..\..\html5\js\underscore-min.js  --js_output_file underscore-min.js 
java.exe -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js ..\..\html5\tpls\templates.js  --js_output_file templates.min.js

copy /b jquery-1.9.1.min.js + jquery.mobile-1.3.2.min.js + ..\..\html5\js\socket.io.js +  underscore-min.js  +  templates.min.js + work.min.js   ..\..\html5\js\app.js

del templates.min.js
del work.min.js
del jquery-1.9.1.min.js
del jquery.mobile-1.3.2.min.js
del socket.io.js
del underscore-min.js 
