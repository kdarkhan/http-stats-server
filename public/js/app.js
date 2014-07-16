'use strict';


requirejs.config({
    paths: {
    	jquery: "//code.jquery.com/jquery-1.11.0.min",
        jqueryui: "//code.jquery.com/ui/1.11.0/jquery-ui.min",
        highcharts: '//code.highcharts.com/highcharts',
        graphclient: 'graph-client',
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
