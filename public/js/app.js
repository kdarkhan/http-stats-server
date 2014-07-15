'use strict';


requirejs.config({
    paths: {
    	jquery: "//code.jquery.com/jquery-1.11.0.min",
    	main: 'main'
    }
});


require(['main'], function (main) {

    var app = {
        initialize: function () {
            // Your code here
        }
    };

    app.initialize();

});
