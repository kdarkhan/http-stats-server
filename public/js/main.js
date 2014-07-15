'use strict';

function parseParameters() {
    return {
        _csrf: $('[name="_csrf"]').val(),
        startOptions: {
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
    if (urlRegex.test(parameters.startOptions.url)) {
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
                console.log('jqXHR', jqXHR);
                $('.statOptions input,.statOptions button').prop('disabled', false);
            });
    } else {
        console.log('you provided invalid input');
    }


}

define(['jquery'], function(jquery) {
    $('#test_submit').click(onClickListener);
    return {
        test: 'value'
    };
});
