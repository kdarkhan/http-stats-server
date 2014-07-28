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
        var spawn;
        if ($('#launchServerEnabled').prop('checked')) {
            spawn = $('#launchServer').val();
            console.log('spawn ', spawn);
            console.log(typeof spawn);
            var parsedSpawn;
            try {
                parsedSpawn = JSON.parse(spawn);
                if (!Array.isArray(parsedSpawn)) {
                    throw new Error('bad spawn args');
                }
            } catch(err) {
                parsedSpawn = spawn.split(' ');
            }
            console.log('spawn is ', parsedSpawn);
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
                requestTimeout: timeout,
                spawn: parsedSpawn
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

    function showAlert(message, alertClass) {
        $('#alertContainer').removeClass();
        $('#alertContainer').addClass('alert ' + alertClass);
        $('#alertContainer').html(message);
        document.getElementById('alertContainer').scrollIntoView();
    }


    function timeoutEnableListener() {
        $('#timeout').prop('disabled', !this.checked);
    }

    function launchServerEnableListener() {
        $('#launchServer').prop('disabled', !this.checked);
    }

    function createProjectListener() {
        var userInput = parseParameters();
        console.log(userInput);

        if (validateInput(userInput)) {
            $('.statOptions input,.statOptions button').prop('disabled', true);

            $.ajax({
                url: 'create_new',
                type: 'POST',
                data: userInput,
                success: function(data) {
                    console.log(data);
                    if (data && data.status === 'Success') {
                        var projectInfo = data.data;
                        var message = 'Successfully created ';
                        if (projectInfo) {
                            message += '<a class="alert-link" href="' + projectInfo.name + '">' + projectInfo.name + '</a>.';
                        } else {
                            message += 'project.';
                        }
                        showAlert(message, 'alert-success');
                        projectInfo = projectInfo || {};
                        $('#currentProjects tbody').append('<tr><td></td><td><a href="' + userInput.options.name + '/">' +
                            userInput.options.name + '</a>' + '</td><td>' + (projectInfo.timestamp || 'Now') + '</td>');
                    } else {
                        showAlert('Failed to create project:\n' + JSON.stringify(data), 'alert-danger');
                    }
                    $('.statOptions input,.statOptions button').prop('disabled', false);
                },
                error: function(jqXHR) {
                    showAlert('Failed to create project:\n' + JSON.stringify(jqXHR.responseText || jqXHR), 'alert-danger');
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
            $('#timeoutEnabled').change(timeoutEnableListener);
            $('#launchServerEnabled').change(launchServerEnableListener);
        }
    };

    app.initialize();

});
