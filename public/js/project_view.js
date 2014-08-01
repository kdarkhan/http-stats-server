'use strict';


require.config({
    paths: {
        jquery: '//code.jquery.com/jquery-1.11.0.min',
        jqueryui: '//code.jquery.com/ui/1.11.0/jquery-ui.min',
        moment: 'moment',
        hcoptions: 'hc-options',
        graphclient: 'graph-client',
        bootstrap: 'bootstrap.min'
    },
    shim: {
        'highcharts': {
            'exports': 'Highcharts',
            'deps': ['jquery']
        },
        'bootstrap': {
            deps: ['jquery']
        }
    }
});


require(['graphclient', 'jquery', 'jqueryui', 'bootstrap'], function(graphClient) {

    function addLatestResult() {
        var errorMessage = 'Could not fetch the latest result. Refresh the page manually to update the graph';
        $.ajax({
            url: 'get_latest_result',
            success: function(data) {
                graphClient.addSinglePoint(data, function(err) {
                    if (err) {
                        window.alert(errorMessage);
                    }
                });
            },
            error: function(jqXHR) {
                window.alert(errorMessage);
            }
        });
    }

    function viewRaw() {
        window.open('raw');
    }

    function addAlert(alertType, message) {
        var afterID = '#buttons';
        var alertID = 'alertMessage';
        var content = '<div id="' + alertID + '" class="alert ' +  alertType + ' alert-dismissible" role="alert"> <button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' + message + ' </div>';
        // remove old success and warning alerts
        // keeping error alerts in html

        $('#' + alertID + '.alert-warning, #' + alertID + '.alert-success').remove();
        $(afterID).after(content);
    }

    function clearResults() {
        if (confirm('Are you sure you want to clear the results for the project?')) {
            var csrfToken = $('[name="_csrf"]').val();
            console.log('token is ', csrfToken);
            $.ajax({
                url: 'clear_results',
                type: 'POST',
                data: {
                    _csrf: csrfToken
                },
                success: function() {
                    ['#reqPerSecGraphTime', '#responseTimeGraphTime', '#reqPerSecGraphConcurrency', '#responseTimeGraphConcurrency']
                        .forEach(function(containerID) {
                            var graph = $(containerID).highcharts();
                            if (graph) {
                                graph.destroy();
                            }
                        });
                },
                error: function(jqXHR) {
                    window.alert('An error occurred:\n' + jqXHR.responseText);
                }
            });
        }
    }

    function removeProject() {
        if (confirm('Are you sure you want to remove the project?')) {
            var csrfToken = $('[name="_csrf"]').val();
            $.ajax({
                url: document.URL,
                type: 'DELETE',
                data: {
                    _csrf: csrfToken
                },
                success: function() {
                    window.location.replace(window.location.protocol + '//' +
                        window.location.host);
                },
                error: function(jqXHR) {
                    window.alert('An error occurred:\n' + jqXHR.responseText);
                }
            });
        }
    }

    function startTest() {
        var csrfToken = $('[name="_csrf"]').val();
        var tryCount = 0;

        function pollingStatus() {
            $.ajax({
                url: 'get_status',
                success: function(data) {
                    if (data && data.status === 'running') {
                        tryCount++;
                        addAlert('alert-warning', 'test is running');
                        // poll every 1 sec 10 times, then poll every 10 sec
                        setTimeout(pollingStatus, tryCount < 10 ? 1000 : 10000);
                    } else {
                        if (data && data.status === 'success') {
                            // test is successful, add the result
                            addLatestResult();
                            addAlert('alert-success', 'Test successfully completed');
                        } else {
                            addAlert('alert-danger', 'Test failed');
                        }
                        // test is complete, enable the button
                        $('#startTest').attr('disabled', false);
                    }
                },
                error: function(jqXHR) {
                    $('#startTest').attr('disabled', false);
                    $('#currentStatus').text(jqXHR.responseText);
                    console.log('jqxhr is ', jqXHR);
                    // window.alert('error occurred:\n', jqXHR.responseText);
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
                    console.log('could not start test');
                }
            },
            error: function(jqXHR) {
                $('#startTest').attr('disable', false);
                $('#currentStatus').text(jqXHR.responseText);
                window.alert('error occurred', jqXHR.responseText);
            }
        });
    }



    var app = {
        initialize: function() {
            // initializeDatepickers();
            $('#startTest').click(startTest);
            $('#viewRaw').click(viewRaw);
            $('#clearResults').click(clearResults);
            $('#removeProject').click(removeProject);
            $('#tabs').tabs();
            graphClient.constructAllGraphs(window.resultData);
        }
    };


    app.initialize();

});
