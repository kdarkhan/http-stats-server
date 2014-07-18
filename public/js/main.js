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

        $.post('create_new', userInput, function(data, status, jqXHR) {
            console.log('data', data);
            console.log('status', status);

            $('.statOptions input,.statOptions button').prop('disabled', false);
        });
    }
}

function startTest() {
    var csrfToken = $('[name="_csrf"]').val();
    $.post('start_test', {
        _csrf: csrfToken
    }, function(data, status, jqXHR) {
        console.log(data);
        console.log(status);
    });
}

function initializeDatepickers() {
    $('#fromDatepicker').datepicker({
        defaultDate: '-1w',
        changeMonth: true,
        maxDate: 'today',
        onClose: function(selectedDate) {
            $('#toDatepicker').datepicker('option', 'minDate', selectedDate);
        }
    });
    $('#toDatepicker').datepicker({
        defaultDate: 'today',
        changeMonth: true,
        maxDate: 'today',
        onClose: function(selectedDate) {
            $('#fromDatepicker').datepicker('option', 'maxDate', selectedDate);
        }
    });
}

define(['graphclient', 'jquery', 'jqueryui', 'highcharts'],
    function(graphClient, jquery) {
        //$('#test_submit').click(onClickListener);
        $('#create_project').click(createProjectListener);
        initializeDatepickers();
        // $('#updateGraphs').click(updateGraphs);
        $('#startTest').click(startTest);

        graphClient.constructAllGraphs(window.resultData);
    });
