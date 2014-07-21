'use strict';

define(['graphclient', 'jquery', 'jqueryui', 'highcharts'],
    function(graphClient /*, jquery */ ) {

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
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.log('jqxhr', jqXHR);
                        console.log('textStats', textStatus);
                        console.log('errorThrown', errorThrown);
                        window.alert('Could not create project:\n' + jqXHR.responseText);
                        $('.statOptions input,.statOptions button').prop('disabled', false);
                    }
                });
            }
        }

        function startTest() {
            var csrfToken = $('[name="_csrf"]').val();
            function pollingStatus() {
                $.ajax({
                    url: '/get_status',
                    success: function(data) {
                        if (data && data.testRunning === true) {
                            setTimeout(pollingStatus, 1000);
                        } else {
                            // test is complete, enable the button
                            $('#startTest').attr('disabled', false);
                        }
                    },
                    error: function(jqXHR) {
                        $('#startTest').attr('disabled', false);
                        window.alert(jqXHR.responseText); 
                    }
                });
            }

            $('#startTest').attr('disabled', true);
            $.ajax({
                url: 'start_test',
                type: 'POST',
                data: {
                    _csrf: csrfToken
                },
                success: function(data) {
                    if (data && data.status === 'Success') {
                        console.log('test started');
                        setTimeout(pollingStatus, 1000);
                    } else {
                        $('#startTest').attr('disabled', false);
                        console.log('test is complete');
                    }
                    window.alert(data);
                },
                error: function(jqXHR) {
                    $('#startTest').attr('disable', false);
                    window.alert('error occurred', jqXHR.responseText);
                }
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

        $('#create_project').click(createProjectListener);
        initializeDatepickers();
        $('#startTest').click(startTest);

        graphClient.constructAllGraphs(window.resultData);
    });
