'use strict';



define([
        'moment',
        'jquery',
        'highcharts',
        'hcoptions'
    ],
    function(moment) {

        console.log('moment is ', moment().format());

        function constructAllGraphs(data) {


            console.log('original data', data);
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


            function buildTimeSeries(array) {
                var cpuData = [];
                var memoryData = [];
                var reqPerSecData = [];
                var responseTimeData = [];
                var timestamps = [];
                showCPU = array[0].cpuAvailable;
                showMemory = array[0].memoryAvailable;
                array[0].steps.forEach(function(item) {
                    [cpuData, memoryData, reqPerSecData, responseTimeData].forEach(function(arr) {
                        arr.push({
                            name: item.concurrency,
                            data: []
                        });
                    });
                });

                // get timestamps
                array.forEach(function(timedata) {
                    timestamps.push(new Date(timedata.timestamp).getTime());
                });

                // disable all series except first and last
                var concurrencyCount = array[0].steps.length;
                var i;
                for (i = 0; i < concurrencyCount; i++) {
                    if (i !== 0 && i !== concurrencyCount - 1) {
                        reqPerSecData[i].visible = false;
                        responseTimeData[i].visible = false;
                        cpuData[i].visible = false;
                        memoryData[i].visible = false;
                    }
                }

                for (i = 0; i < array.length; i++) {
                    var timePoint = data[i];
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

            function buildConcurrencySeries(array) {
                var reqPerSecSeries = [];
                var responseTimeSeries = [];
                var cpuSeries = [];
                var memorySeries = [];
                var dateFormat = 'MMM Do YYYY, h:mm:ss a';

                array.forEach(function(sample) {
                    var reqPerSecData = [];
                    var responseTimeData = [];
                    // TODO: add logic to parse cpuData and memoryData
                    var cpuData = [];
                    var memoryData = [];

                    sample.steps.forEach(function(stepInfo) {
                        reqPerSecData.push([stepInfo.concurrency, stepInfo.stats.requestsPerSecond.mean]);
                        responseTimeData.push([stepInfo.concurrency, stepInfo.stats.responseTime.mean]);
                    });

                    reqPerSecSeries.push({
                        name: moment(sample.timestamp).format(dateFormat),
                        data: reqPerSecData
                    });
                    responseTimeSeries.push({
                        name: moment(sample.timestamp).format(dateFormat),
                        data: responseTimeData
                    });

                    cpuSeries.push({
                        name: sample.timestamp,
                        data: cpuData
                    });
                    memorySeries.push({
                        name: sample.timestamp,
                        data: memoryData
                    });
                });


                // hide older series
                var hideBefore = reqPerSecSeries.length - 5;
                for(var i = 0; i < hideBefore; i++) {
                    reqPerSecSeries[i].visible = false;
                    responseTimeSeries[i].visible = false;
                    cpuSeries[i].visible = false;
                }

                return {
                    reqPerSecSeries: reqPerSecSeries,
                    responseTimeSeries: responseTimeSeries,
                    cpuSeries: cpuSeries,
                    memorySeries: memorySeries
                };
            }

            function addAveragesToTimeData(data) {
                Object.keys(data).forEach(function(key) {
                    if (key !== 'timestamps') {
                        var parameter = data[key];
                        var averageArray = [];
                        var concurrencyCount = parameter.length;
                        var timeCount = parameter[0].data.length;
                        if (timeCount > 1) {
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
                    }
                });
            }

            function addReqPerSecGraphTime(data, timestamps) {
                console.log('data', data);
                console.log('time', timestamps);

                $('#reqPerSecGraphTime').highcharts({
                    chart: {
                        type: 'spline',
                        zoomType: 'xy'
                    },
                    title: {
                        text: 'Requests per second over time'
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
                    credits: {
                        enabled: false
                    },
                    series: data
                });
            }



            function addResponseTimeGraphTime(data, timestamps) {
                console.log('data', data);
                console.log('time', timestamps);

                $('#responseTimeGraphTime').highcharts({
                    chart: {
                        type: 'spline',
                        zoomType: 'xy'
                    },
                    title: {
                        text: 'Response time over time'
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
                    credits: {
                        enabled: false
                    },
                    series: data
                });
            }

            function addReqPerSecGraphConcurrency(data) {
                console.log('to graph', data);
                $('#reqPerSecGraphConcurrency').highcharts({
                    chart: {
                        type: 'spline',
                        zoomType: 'xy'
                    },
                    title: {
                        text: 'Requests per second over concurrency'
                    },
                    xAxis: {
                        allowDecimals: false,
                        title: {
                            text: 'Concurrency'
                        }
                    },
                    yAxis: {
                        title: {
                            text: 'Requests per second'
                        },
                        min: 0
                    },
                    credits: {
                        enabled: false
                    },
                    series: data,
                });
            }


            function addResponseTimeGraphConcurrency(data) {
                console.log('resTime to graph', data);
                $('#responseTimeGraphConcurrency').highcharts({
                    chart: {
                        type: 'spline',
                        zoomType: 'xy'
                    },
                    title: {
                        text: 'Requests per second over concurrency'
                    },
                    xAxis: {
                        allowDecimals: false,
                        title: {
                            text: 'Concurrency'
                        }
                    },
                    yAxis: {
                        title: {
                            text: 'Requests per second'
                        },
                        min: 0
                    },
                    credits: {
                        enabled: false
                    },
                    series: data,
                });
            }

            if (!validateData(data)) {
                console.log('bad data');
            } else {
                var timeData = buildTimeSeries(data);
                addAveragesToTimeData(timeData);
                var concurrencyData = buildConcurrencySeries(data);
                console.log('concurrencyData', concurrencyData);
                $(function() {
                    // var concurrencyClasses = [];

                    if (showCPU) {
                        //concurrencyClasses.push(addCPUGraphs(timeData.cpuData, timeData.timestamps));
                    }
                    if (showMemory) {
                        //concurrencyClasses.push(addMemoryGraphs(timeData.memoryData, timeData.timestamps));
                    }

                    addReqPerSecGraphTime(timeData.reqPerSecData, timeData.timestamps);
                    addResponseTimeGraphTime(timeData.responseTime, timeData.timestamps);
                    addReqPerSecGraphConcurrency(concurrencyData.reqPerSecSeries);
                    addResponseTimeGraphConcurrency(concurrencyData.responseTimeSeries);
                });
            }
        }

        return {
            constructAllGraphs: constructAllGraphs
        };
    });
