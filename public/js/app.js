'use strict';


require.config({
    paths: {
        jquery: '//code.jquery.com/jquery-1.11.0.min',
        jqueryui: '//code.jquery.com/ui/1.11.0/jquery-ui.min',
    }
});


require(['jquery'], function(jquery) {

    function parseParameters() {
        return {
            _csrf: $('[name="_csrf"]').val(),
            options: {
                name: $('#projectName').val(),
                url: $('#url').val(),
                beginConcurrency: $('#beginConcurrency').val(),
                peakConcurrency: $('#peakConcurrency').val(),
                endConcurrency: $('#endConcurrency').val(),
                concurrencyIncrement: $('#concurrencyInc').val(),
                concurrencyDecrement: $('#concurrencyDec').val(),
                stepRequests: $('#stepRequests').val(),
                delay: $('#stepDelay').val(),
                warmup: $('#warmupEnabled').val()
            }
        };
    }

    function validateInput(parameters) {
        var urlRegex = new RegExp(/^(ht|f)tps?:\/\/[a-z0-9-\.]+/);
        if (urlRegex.test(parameters.options.url)) {
            return true;
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
                        $('#current_projects ul').append('<li><a href="' + userInput.options.name + '/">' +
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
        }
    }
    var app = {
        initialize: function() {
            // Your code here
            $('#create_project').click(createProjectListener);
        }
    };

    app.initialize();

});
