'use strict';


require.config({
    paths: {
        jquery: '//code.jquery.com/jquery-1.11.0.min',
        jqueryui: '//code.jquery.com/ui/1.11.0/jquery-ui.min',
        bootstrap: 'bootstrap.min'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery']
        }
    }
});


require(['jquery', 'bootstrap'], function() {

    function parseParameters() {
        var requestOptions = $.trim($('#requestOptions').val()) || '{}';
        try {
            requestOptions = JSON.parse(requestOptions);
        } catch (err) {
            requestOptions = {};
        }
        var timeout;
        if ($('#timeoutEnabled').prop('checked')) {
            timeout = Number($('#timeout').val());
        }
        return {
            _csrf: $('[name="_csrf"]').val(),
            options: {
                name: $('#projectName').val(),
                url: $('#url').val(),
                beginConcurrency: $('#beginConcurrency').val(),
                peakConcurrency: $('#peakConcurrency').val(),
                endConcurrency: $('#endConcurrency').val(),
                concurrencyIncrement: $('#concurrencyIncrement').val(),
                concurrencyDecrement: $('#concurrencyDecrement').val(),
                stepRequests: $('#stepRequests').val(),
                delay: $('#stepDelay').val(),
                warmup: $('#warmupEnabled').val(),
                requestOptions: $.trim($('#requestOptions').val() || '{}'),
                requestTimeout: timeout
            }
        };
    }

    function validateInput(parameters) {
        var urlRegex = new RegExp(/^(ht|f)tps?:\/\/[a-z0-9-\.]+/);
        if (urlRegex.test(parameters.options.url)) {
            try {
                var parsed = JSON.parse(parameters.options.requestOptions);
                if (parsed && typeof parsed === 'object' && parsed !== null) {
                    return true;
                } else {
                    return false;
                }
            } catch (err) {
                return false;
            }
        }
        return false;
    }


    function createProjectListener() {
        console.log('create project clicked');
        var userInput = parseParameters();
        console.log(userInput);

        if (validateInput(userInput)) {
            $('.statOptions input,.statOptions button').prop('disabled', true);

            $.ajax({
                url: 'create_new',
                type: 'POST',
                data: userInput,
                success: function(data) {
                    if (data && data.status === 'Success') {
                        $('#currentProjects ul').append('<li><a href="' + userInput.options.name + '/">' +
                            userInput.options.name + '</a>');
                    } else {
                        window.alert('Could not create project:\n' + JSON.stringify(data));
                    }
                    $('.statOptions input,.statOptions button').prop('disabled', false);
                },
                error: function(jqXHR) {
                    window.alert('Could not create project:\n' + jqXHR.responseText);
                    $('.statOptions input,.statOptions button').prop('disabled', false);
                }
            });
        } else {
            window.alert('Error. Verify input parameters');
        }
    }
    var app = {
        initialize: function() {
            // Your code here
            $('#createProject').click(createProjectListener);
        }
    };

    app.initialize();

});
