'use strict';


require.config({
    paths: {
        jquery: '//code.jquery.com/jquery-1.11.0.min',
        jqueryui: '//code.jquery.com/ui/1.11.0/jquery-ui.min',
        moment: 'moment',
        hcoptions: 'hc-options',
        graphclient: 'graph-client',
        main: 'main'
    },
    shim: {
        'highcharts': {
            'exports': 'Highcharts',
            'deps': ['jquery']
        },
    }
});


require(['main'], function(main) {

    var app = {
        initialize: function() {
            // Your code here
        }
    };

    app.initialize();

});
