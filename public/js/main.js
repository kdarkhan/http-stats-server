'use strict';

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
            warmup: $('warmupEnabled').val()
        }
    };
}

function validateInput(parameters) {
    var urlRegex = new RegExp(/^(ht|f)tps?:\/\/[a-z0-9-\.]+/)
    if (urlRegex.test(parameters.options.url)) {
        return true;
    }
    return false;
}

function onClickListener() {
    console.log('clicked');


    var userInput = parseParameters();

    if (validateInput(userInput)) {
        $('.statOptions input,.statOptions button').prop('disabled', true);
        $.post('/start_test',
            parseParameters(),
            function(data, status, jqXHR) {
                console.log('data', data);
                console.log('status', status);
                $('.statOptions input,.statOptions button').prop('disabled', false);
            });
    } else {
        console.log('you provided invalid input');
    }
}

function createProjectListener() {
    console.log('create project clicked');
    var userInput = parseParameters();

    if (validateInput(userInput)) {
        $('.statOptions input,.statOptions button').prop('disabled', true);

        $.post('create_new', userInput, function(data, status, jqXHR) {
            console.log('data', data);
            console.log('status', status);

            $('.statOptions input,.statOptions button').prop('disabled', false);
        });
    }
}

define(['jquery'], function(jquery) {
    //$('#test_submit').click(onClickListener);
    $('#create_project').click(createProjectListener);
    return {
        test: 'value'
    };
});
