'use strict';

function constructAllGraphs(data) {
    console.log(data);
    var showCPU, showMemory;
    var stepCount;

    function toFixed(num, decimal) {
        if (!num) {
            return 0;
        }
        return parseFloat(num.toFixed(decimal));
    }

    function validateData(array) {
        if (array.length) {
            stepCount = array[0].steps.length;
            array.forEach(function(item) {
                if (stepCount !== item.steps.length) {
                    return false;
                }
            });
            return true;
        } else {
            return false;
        }
    }

    function buildTimeData(array) {
        var cpuData = [];
        var memoryData = [];
        var reqPerSecData = [];
        var responseTimeData = [];
        var timestamps = [];
        showCPU = array[0].cpuAvailable;
        showMemory = array[0].memoryAvailable;
        array[0].steps.forEach(function(item) {
            cpuData.push({
                name: item.concurrency,
                data: []
            });
            memoryData.push({
                name: item.concurrency,
                data: []
            });
            reqPerSecData.push({
                name: item.concurrency,
                data: []
            });
            responseTimeData.push({
                name: item.concurrency,
                data: []
            });
        });
        for (var i = 0; i < array.length; i++) {
            var timePoint = data[i];
            timestamps.push(new Date(timePoint.timestamp));
            var steps = timePoint.steps;
            for (var j = 0; j < steps.length; j++) {
                var stats = steps[j].stats;
                reqPerSecData[j].data.push(toFixed(stats.requestsPerSecond.mean, 2));
                responseTimeData[j].data.push(toFixed(stats.responseTime.mean, 2));
                if (stats.usage) {
                    var usage = stats.usage[0];
                    if (showCPU) {
                        cpuData[j].data.push(toFixed(usage.cpu.mean, 2));
                    }
                    if (showMemory) {
                        memoryData[j].data.push(toFixed(usage.memory.mean, 2));
                    }
                }
            }
        }
        var result = {
            reqPerSecData: reqPerSecData,
            responseTime: responseTimeData,
            timestamps: timestamps
        };
        if (showCPU) {
            result.cpuData = cpuData;
        }
        if (showMemory) {
            result.memoryData = memoryData;
        }
        return result;
    }

    function addAveragesToData(data) {
        Object.keys(data).forEach(function(key) {
            if (key !== 'timestamps') {
                var parameter = data[key];
                var averageArray = [];
                var concurrencyCount = parameter.length;
                var timeCount = parameter[0].data.length;
                for (var i = 0; i < timeCount; i++) {
                    var sum = 0;
                    for (var j = 0; j < concurrencyCount; j++) {
                        sum += parameter[j].data[i];
                    }
                    averageArray.push(toFixed(sum / concurrencyCount, 2));
                }
                parameter.push({
                    name: 'average',
                    data: averageArray
                });
            }
        });
    }

    function addRequestPerSecGraphs(reqPerSecData, timestamps, container) {
        return addGraphsToContainer({
            data: reqPerSecData,
            container: container,
            idPrefix: 'reqPerSec_',
            className: 'reqPerSec',
            timestamps: timestamps,
            xTitle: 'Time',
            tTitle: 'Requests per second',
            title: 'Requests per second with concurrency ',
            averageTitle: 'Average requests per second'
        });
    }

    function addResponseTimeGraphs(responseTimeData, timestamps, container) {
        return addGraphsToContainer({
            data: responseTimeData,
            container: container,
            idPrefix: 'resopnseTime_',
            className: 'responseTime',
            timestamps: timestamps,
            xTitle: 'Time',
            tTitle: 'Response time, ms',
            title: 'Response time with concurrency ',
            averageTitle: 'Average response time'
        });
    }

    function addCPUGraphs(cpuUsage, timestamps, container) {
        return addGraphsToContainer({
            data: cpuUsage,
            container: container,
            idPrefix: 'cpuUsage_',
            className: 'cpuUsage',
            timestamps: timestamps,
            xTitle: 'Time',
            tTitle: 'CPU usage',
            title: 'CPU usage with concurrency ',
            averageTitle: 'Average CPU usage'
        });
    }

    function addMemoryGraphs(memoryUsageData, timestamps, container) {
        return addGraphsToContainer({
            data: memoryUsageData,
            container: container,
            idPrefix: 'memoryUsage_',
            className: 'memoryUsage',
            timestamps: timestamps,
            xTitle: 'Time',
            tTitle: 'Memory usage',
            title: 'Memory usage with concurrency ',
            averageTitle: 'Average memory usage'
        });
    }

    function addGraphsToContainer(options) {
        var data = options.data;
        var container = options.container || 'body';
        var idPrefix = options.idPrefix;
        var className = options.className;
        var timestamps = options.timestamps;
        var classList = [];
        var steps = data.length;
        for (var i = 0; i < steps; i++) {
            var info = data[i];
            var divId = idPrefix + i;
            var classes = 'concurrency_' + info.name;
            classList.push(classes);
            classes += ' ' + className;
            var newDiv = '<div id="' + divId + '" class="' + classes + '"></div>';
            $(container).append(newDiv);
            $('#' + divId).highcharts(getGenericGraph({
                title: info.name === 'average' ? options.averageTitle : (options.title + info.name),
                xTitle: options.xTitle,
                yTitle: options.yTitle,
                series: [info],
                xCategories: timestamps
            }));
        }
        return classList;

    }

    function getGenericGraph(options) {
        var title = options.title || 'Graph';
        var type = options.type || 'line';
        var xTitle = options.xTitle;
        var xCategories = options.xCategories;
        var yTitle = options.yTitle;
        var series = options.series || [];
        return {
            chart: {
                type: type
            },
            title: {
                text: title
            },
            xAxis: {
                categories: xCategories,
                title: {
                    text: xTitle
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: yTitle
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: false
                    },
                    enableMouseTracking: true
                }
            },
            credits: {
                enabled: false
            },
            series: series
        };
    }

    function addFilters(concurrencyClasses) {
        var hiddenClasses = [];

        function addConcurrencyFilter(classListOfLists) {
            var set = [];
            classListOfLists.forEach(function(classList) {
                classList.forEach(function(className) {
                    if (set.indexOf(className) === -1) {
                        set.push(className);
                    }
                });
            });

            //var newElem = '<dl class="dropdown"><dt><a href="#"><span class="hida">Concurrencies</span><p class="multiSel"></p></a></dt><dd><div class="mutliSelect"><ul> ';
            var newElem = '<h4>Concurrencies</h4>';
            set.forEach(function(id) {
                newElem += '<label><input type="checkbox" checked="true" value=".' + id + '"/>' + id + '</label>';
            });

            $('#concurrency_filter').append(newElem);
            $('#concurrency_filter input[type=checkbox]').on('click', function() {
                var classElems = $(this.value);
                var className = this.value.substring(1);
                if (this.checked) {
                    var index = hiddenClasses.indexOf(className);
                    if (index >= 0) {
                        hiddenClasses.splice(index, 1);
                    }
                    // classElems.show();
                    classElems.each(function() {
                        var element = $(this);
                        var isHidden = false;
                        hiddenClasses.forEach(function(className) {
                            if (element.hasClass(className)) {
                                isHidden = true;
                            }
                        });
                        if (!isHidden) {
                            element.show();
                        }
                    });
                } else {
                    classElems.hide();
                    if (hiddenClasses.indexOf(className) < 0) {
                        hiddenClasses.push(className);
                    }
                }
            });
        }

        function addGraphTypeFilter() {
            var newElem = '<h4>Graph types</h4>';
            newElem += '<label><input type="checkbox" checked="true" value=".reqPerSec"/>requests per second</label>';
            newElem += '<label><input type="checkbox" checked="true" value=".responseTime"/>response time</label>';
            $('#graph_type_filter').append(newElem);
            $('#graph_type_filter input[type=checkbox]').on('click', function() {
                var classElems = $(this.value);
                var className = this.value.substring(1);
                if (this.checked) {
                    var index = hiddenClasses.indexOf(className);
                    if (index >= 0) {
                        hiddenClasses.splice(index, 1);
                    }
                    // classElems.show();
                    classElems.each(function() {
                        var element = $(this);
                        var isHidden = false;
                        hiddenClasses.forEach(function(className) {
                            if (element.hasClass(className)) {
                                isHidden = true;
                            }
                        });
                        if (!isHidden) {
                            element.show();
                        }
                    });
                    // classElems.show();
                } else {
                    classElems.hide();
                    if (hiddenClasses.indexOf(className) < 0) {
                        hiddenClasses.push(className);
                    }
                }
            });
        }

        addConcurrencyFilter(concurrencyClasses);
        addGraphTypeFilter();
    }



    if (!validateData(data)) {
        console.log('bad data');
    } else {
        var parsedData = buildTimeData(data);
        addAveragesToData(parsedData);
        $(function() {
            var concurrencyClasses = [];
            concurrencyClasses.push(addRequestPerSecGraphs(parsedData.reqPerSecData, parsedData.timestamps));
            concurrencyClasses.push(addResponseTimeGraphs(parsedData.responseTime, parsedData.timestamps));

            if (showCPU) {
                concurrencyClasses.push(addCPUGraphs(parsedData.cpuData, parsedData.timestamps));
            }
            if (showMemory) {
                concurrencyClasses.push(addMemoryGraphs(parsedData.memoryData, parsedData.timestamps));
            }
            //addConcurrencyFilter(concurrencyClasses);
            //addGraphTypeFilter();
            //window.multiselect();
            addFilters(concurrencyClasses);
        });
    }
}

define(['jquery'], function(jquery) {
    return {
        constructAllGraphs: constructAllGraphs
    };
});
