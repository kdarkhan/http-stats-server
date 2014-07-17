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
        if (array && array.length) {
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

        // get timestamps
        data.forEach(function(timedata) {
            timestamps.push(new Date(timedata.timestamp).getTime());
        });

        for (var i = 0; i < array.length; i++) {
            var timePoint = data[i];
            // timestamps.push(new Date(timePoint.timestamp).getTime());
            var steps = timePoint.steps;
            for (var j = 0; j < steps.length; j++) {
                var stats = steps[j].stats;
                reqPerSecData[j].data.push([timestamps[i], toFixed(stats.requestsPerSecond.mean, 2)]);
                responseTimeData[j].data.push([timestamps[i], toFixed(stats.responseTime.mean, 2)]);
                if (stats.usage) {
                    var usage = stats.usage[0];
                    if (showCPU) {
                        cpuData[j].data.push([timestamps[i], toFixed(usage.cpu.mean, 2)]);
                    }
                    if (showMemory) {
                        memoryData[j].data.push([timestamps[i], toFixed(usage.memory.mean, 2)]);
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
                        sum += parameter[j].data[i][1];
                    }
                    averageArray.push([parameter[0].data[i][0], toFixed(sum / concurrencyCount, 2)]);
                }
                parameter.push({
                    name: 'average',
                    data: averageArray
                });
            }
        });
    }

    function addReqPerSecGraph(data, timestamps) {
        console.log('data', data);
        console.log('time', timestamps);

        $('#reqPerSecGraph').highcharts({
            chart: {
                type: 'spline',
                zoomType: 'xy'
            },
            title: {
                text: 'Requests per second'
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%b'
                },
                title: {
                    text: 'Date'
                }
            },
            yAxis: {
                title: {
                    text: 'Requests per second'
                },
                min: 0
            },
            /*
                        tooltip: {
                            headerFormat: '<b>{series.name} concurrency</b><br>',
                            pointFormat: '{point.x:%e. %b}: {point.y:.2f} m'
                        },*/
            credits: {
                enabled: false
            },
            series: data,
            useUTC: false
        });
    }



    function addResponseTimeGraph(data, timestamps) {
        console.log('data', data);
        console.log('time', timestamps);

        $('#responseTimeGraph').highcharts({
            chart: {
                type: 'spline',
                zoomType: 'xy'
            },
            title: {
                text: 'Response time'
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%b'
                },
                title: {
                    text: 'Date'
                }
            },
            yAxis: {
                title: {
                    text: 'Response time, ms'
                },
                min: 0
            },
            /*
                        tooltip: {
                            headerFormat: '<b>{series.name} concurrency</b><br>',
                            pointFormat: '{point.x:%e. %b}: {point.y:.2f} m'
                        },*/
            credits: {
                enabled: false
            },
            series: data,
            useUTC: false
        });
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
            //concurrencyClasses.push(addRequestPerSecGraphs(parsedData.reqPerSecData, parsedData.timestamps));
            //concurrencyClasses.push(addResponseTimeGraphs(parsedData.responseTime, parsedData.timestamps));

            if (showCPU) {
                //concurrencyClasses.push(addCPUGraphs(parsedData.cpuData, parsedData.timestamps));
            }
            if (showMemory) {
                //concurrencyClasses.push(addMemoryGraphs(parsedData.memoryData, parsedData.timestamps));
            }
            //addConcurrencyFilter(concurrencyClasses);
            //addGraphTypeFilter();
            //window.multiselect();

            //addFilters(concurrencyClasses);

            addReqPerSecGraph(parsedData.reqPerSecData, parsedData.timestamps);
            addResponseTimeGraph(parsedData.responseTime, parsedData.timestamps);
        });
    }
}

define(['jquery', 'highcharts'], function(jquery, highcharts) {

    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });



    /**
     * Dark theme for Highcharts JS
     * @author Torstein Honsi
     */

    // Load the fonts
    Highcharts.createElement('link', {
        href: 'http://fonts.googleapis.com/css?family=Unica+One',
        rel: 'stylesheet',
        type: 'text/css'
    }, null, document.getElementsByTagName('head')[0]);

    Highcharts.theme = {
        colors: ["#2b908f", "#90ee7e", "#f45b5b", "#7798BF", "#aaeeee", "#ff0066", "#eeaaee",
            "#55BF3B", "#DF5353", "#7798BF", "#aaeeee"
        ],
        chart: {
            backgroundColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 1,
                    y2: 1
                },
                stops: [
                    [0, '#2a2a2b'],
                    [1, '#3e3e40']
                ]
            },
            style: {
                fontFamily: "'Unica One', sans-serif"
            },
            plotBorderColor: '#606063'
        },
        title: {
            style: {
                color: '#E0E0E3',
                textTransform: 'uppercase',
                fontSize: '20px'
            }
        },
        subtitle: {
            style: {
                color: '#E0E0E3',
                textTransform: 'uppercase'
            }
        },
        xAxis: {
            gridLineColor: '#707073',
            labels: {
                style: {
                    color: '#E0E0E3'
                }
            },
            lineColor: '#707073',
            minorGridLineColor: '#505053',
            tickColor: '#707073',
            title: {
                style: {
                    color: '#A0A0A3'

                }
            }
        },
        yAxis: {
            gridLineColor: '#707073',
            labels: {
                style: {
                    color: '#E0E0E3'
                }
            },
            lineColor: '#707073',
            minorGridLineColor: '#505053',
            tickColor: '#707073',
            tickWidth: 1,
            title: {
                style: {
                    color: '#A0A0A3'
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            style: {
                color: '#F0F0F0'
            }
        },
        plotOptions: {
            series: {
                dataLabels: {
                    color: '#B0B0B3'
                },
                marker: {
                    lineColor: '#333'
                }
            },
            boxplot: {
                fillColor: '#505053'
            },
            candlestick: {
                lineColor: 'white'
            },
            errorbar: {
                color: 'white'
            }
        },
        legend: {
            itemStyle: {
                color: '#E0E0E3'
            },
            itemHoverStyle: {
                color: '#FFF'
            },
            itemHiddenStyle: {
                color: '#606063'
            }
        },
        credits: {
            style: {
                color: '#666'
            }
        },
        labels: {
            style: {
                color: '#707073'
            }
        },

        drilldown: {
            activeAxisLabelStyle: {
                color: '#F0F0F3'
            },
            activeDataLabelStyle: {
                color: '#F0F0F3'
            }
        },

        navigation: {
            buttonOptions: {
                symbolStroke: '#DDDDDD',
                theme: {
                    fill: '#505053'
                }
            }
        },

        // scroll charts
        rangeSelector: {
            buttonTheme: {
                fill: '#505053',
                stroke: '#000000',
                style: {
                    color: '#CCC'
                },
                states: {
                    hover: {
                        fill: '#707073',
                        stroke: '#000000',
                        style: {
                            color: 'white'
                        }
                    },
                    select: {
                        fill: '#000003',
                        stroke: '#000000',
                        style: {
                            color: 'white'
                        }
                    }
                }
            },
            inputBoxBorderColor: '#505053',
            inputStyle: {
                backgroundColor: '#333',
                color: 'silver'
            },
            labelStyle: {
                color: 'silver'
            }
        },

        navigator: {
            handles: {
                backgroundColor: '#666',
                borderColor: '#AAA'
            },
            outlineColor: '#CCC',
            maskFill: 'rgba(255,255,255,0.1)',
            series: {
                color: '#7798BF',
                lineColor: '#A6C7ED'
            },
            xAxis: {
                gridLineColor: '#505053'
            }
        },

        scrollbar: {
            barBackgroundColor: '#808083',
            barBorderColor: '#808083',
            buttonArrowColor: '#CCC',
            buttonBackgroundColor: '#606063',
            buttonBorderColor: '#606063',
            rifleColor: '#FFF',
            trackBackgroundColor: '#404043',
            trackBorderColor: '#404043'
        },

        // special colors for some of the
        legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
        background2: '#505053',
        dataLabelsColor: '#B0B0B3',
        textColor: '#C0C0C0',
        contrastTextColor: '#F0F0F3',
        maskColor: 'rgba(255,255,255,0.3)'
    };

    // Apply the theme
    Highcharts.setOptions(Highcharts.theme);




    return {
        constructAllGraphs: constructAllGraphs
    };
});
