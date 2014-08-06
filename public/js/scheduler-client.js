'use strict';


require.config({
    paths: {
        jquery: '//code.jquery.com/jquery-1.11.0.min',
        bootstrap: 'bootstrap.min'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery']
        }
    }
});


require(['jquery', 'bootstrap'], function() {
    function parseTask() {
        return {
            _csrf: $('[name="_csrf"]').val(),
            options: {
                projectName: $('#newProjectName').val(),
                cronString: $('#newCronString').val(),
                enabled: $('#newEnabled').prop('checked')
            }
        };
    }

    function addTaskListener() {
        $('#addTask').prop('disabled', true);
        console.log('clicked addTask');
        var options = parseTask();
        $.ajax({
            url: '/scheduler/create_task',
            type: 'POST',
            data: options
        })
            .done(function(success) {
                var task = options.options;
                console.log('good ', success);
                if (success && success._id) {
                    var newRow = '<tr style="display:none" id="row_' + success._id + '"><td>' + task.projectName +
                        '</td><td>' + task.cronString + '</td><td><input type="checkbox" ' +
                        (task.enabled ? 'checked' : '') + '></td><td><a href="javascript:void(0);" onclick="window.removeTask(\'' +
                        success._id + '\');"><span class="glyphicon glyphicon-remove-circle"></span></a></td></tr>';
                    $('#newProjectRow').before(newRow);
                    $('#newProjectRow input').val('');
                    $('#row_' + success._id).slideDown(10000);
                } else {
                    console.log('response did not contain _id for some reason');
                }
            })
            .fail(function(err) {
                console.log('bad', err && err.responseText);
            })
            .always(function() {
                console.log('always');
                $('#addTask').prop('disabled', false);
            });

    }

    window.removeTask = function removeTask(taskId) {
        if (confirm('Are you sure you want to remove the task?')) {
            $.ajax({
                url: '/scheduler/',
                type: 'DELETE',
                data: {
                    _csrf: $('[name="_csrf"]').val(),
                    taskId: taskId
                }
            })
                .done(function(success) {
                    console.log('delete yes', success);
                    $('#row_' + taskId).remove();
                })
                .fail(function(err) {
                    console.log('delete no', err && err.responseText);
                });
        }
    };

    var app = {
        initialize: function() {
            $('#addTask').click(addTaskListener);
        }
    };

    app.initialize();

});
