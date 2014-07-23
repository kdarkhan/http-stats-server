'use strict';



define([
        'moment',
        'jquery',
        'highcharts',
        'hcoptions'
    ],
    function(moment) {
        var dateFormat = 'MMM Do YYYY, h:mm:ss a';
        var graphWidth = $('#reqPerSecGraphTime').parent().innerWidth();

        function toFixed(num, decimal) {
            if (!num) {
                return 0;
            }
            return parseFloat(num.toFixed(decimal));
        }

        function validateData(array) {
            if (array && array.length) {
                var stepCount = array[0].steps.length;
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
            var cpuData = {}; //[];
            var memoryData = {}; //[];
            var reqPerSecData = {}; //[];
            var responseTimeData = {}; // [];
            var timestamps = [];
            var showCPU = array[0].cpuAvailable;
            var showMemory = array[0].memoryAvailable;

            // get timestamps
            array.forEach(function(timedata) {
                timestamps.push(moment(timedata.timestamp).format(dateFormat));
            });

            var i;

            for (i = 0; i < array.length; i++) {
                var timePoint = array[i];
                var steps = timePoint.steps;

                var sampleCpuData = {};
                var sampleMemoryData = {};
                var sampleReqPerSecData = {};
                var sampleResponseTimeData = {};

                for (var j = 0; j < steps.length; j++) {
                    var stats = steps[j].stats;
                    var usage = stats.usage;
                    var concurrency = steps[j].concurrency;
                    if (!(concurrency in sampleReqPerSecData)) {
                        sampleReqPerSecData[concurrency] = toFixed(stats.requestsPerSecond.mean, 2);
                        sampleResponseTimeData[concurrency] = toFixed(stats.responseTime.mean, 2);
                        if (showCPU) {
                            sampleCpuData[concurrency] = toFixed(usage.cpu.mean, 2);
                        }
                        if (showMemory) {
                            sampleMemoryData[concurrency] = toFixed(usage.memory.mean, 2);
                        }
                    } else {
                        sampleReqPerSecData[concurrency] = (sampleReqPerSecData[concurrency] +
                            toFixed(stats.requestsPerSecond.mean, 2)) / 2;

                        sampleResponseTimeData[concurrency] = (sampleResponseTimeData[concurrency] +
                            toFixed(stats.responseTime.mean, 2)) / 2;
                        if (showCPU) {
                            sampleCpuData[concurrency] = (sampleCpuData[concurrency] +
                                toFixed(usage.cpu.mean, 2)) / 2;
                        }
                        if (showMemory) {
                            sampleMemoryData[concurrency] = (sampleMemoryData[concurrency] +
                                toFixed(usage.memory.mean, 2)) / 2;
                        }
                    }
                }

                Object.keys(sampleReqPerSecData).forEach(function(concurrency) {
                    reqPerSecData[concurrency] = reqPerSecData[concurrency] || [];
                    responseTimeData[concurrency] = responseTimeData[concurrency] || [];
                    cpuData[concurrency] = cpuData[concurrency] || [];
                    memoryData[concurrency] = memoryData[concurrency] || [];
                    reqPerSecData[concurrency].push(sampleReqPerSecData[concurrency]);
                    responseTimeData[concurrency].push(sampleResponseTimeData[concurrency]);
                    if (showCPU) {
                        cpuData[concurrency].push(sampleCpuData[concurrency]);
                    }
                    if (showMemory) {
                        memoryData[concurrency].push(sampleMemoryData[concurrency]);
                    }
                });
            }
            reqPerSecData = Object.keys(reqPerSecData).map(function(concurrency) {
                return {
                    name: concurrency,
                    data: reqPerSecData[concurrency]
                };
            });
            responseTimeData = Object.keys(responseTimeData).map(function(concurrency) {
                return {
                    name: concurrency,
                    data: responseTimeData[concurrency]
                };
            });

            // disable all series except first and last
            var concurrencyCount = reqPerSecData.length;
            for (i = 0; i < concurrencyCount; i++) {
                if (i !== 0 && i !== concurrencyCount - 1) {
                    reqPerSecData[i].visible = false;
                    responseTimeData[i].visible = false;
                    if (showCPU) {
                        cpuData[i].visible = false;
                    }
                    if (showMemory) {
                        memoryData[i].visible = false;
                    }
                }
            }
            var result = {
                reqPerSecData: reqPerSecData,
                responseTimeData: responseTimeData,
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


            array.forEach(function(sample) {
                var reqPerSecData = [];
                var responseTimeData = [];
                // TODO: add logic to parse cpuData and memoryData
                var cpuData = [];
                var memoryData = [];

                sample.steps.forEach(function(stepInfo) {
                    var concurrency = stepInfo.concurrency;
                    if (concurrency in reqPerSecData) {
                        reqPerSecData[concurrency] = (reqPerSecData[concurrency] +
                            stepInfo.stats.requestsPerSecond.mean) / 2;
                        responseTimeData[concurrency] = (responseTimeData[concurrency] +
                            stepInfo.stats.responseTime.mean) / 2;
                    } else {
                        reqPerSecData[concurrency] = stepInfo.stats.requestsPerSecond.mean;
                        responseTimeData[concurrency] = stepInfo.stats.responseTime.mean;
                    }
                    // reqPerSecData.push([stepInfo.concurrency, stepInfo.stats.requestsPerSecond.mean]);
                    // responseTimeData.push([stepInfo.concurrency, stepInfo.stats.responseTime.mean]);
                });


                reqPerSecSeries.push({
                    name: moment(sample.timestamp).format(dateFormat),
                    // data: reqPerSecData
                    data: Object.keys(reqPerSecData).map(function(key) {
                        return [Number(key), reqPerSecData[key]];
                    })
                });
                responseTimeSeries.push({
                    name: moment(sample.timestamp).format(dateFormat),
                    // data: responseTimeData
                    data: Object.keys(responseTimeData).map(function(key) {
                        return [Number(key), responseTimeData[key]];
                    })
                });

                cpuSeries.push({
                    name: sample.timestamp,
                    // TODO
                    data: cpuData
                });
                memorySeries.push({
                    name: sample.timestamp,
                    // TODO
                    data: memoryData
                });
            });


            // hide older series
            var hideBefore = reqPerSecSeries.length - 5;
            for (var i = 0; i < hideBefore; i++) {
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
                    if (concurrencyCount > 1) {
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
                }
            });
        }

        function addReqPerSecGraphTime(data, timestamps) {

            $('#reqPerSecGraphTime').highcharts({
                chart: {
                    type: 'spline',
                    zoomType: 'xy',
                    width: graphWidth
                },
                title: {
                    text: 'Requests per second over time'
                },
                xAxis: {
                    dateTimeLabelFormats: { // don't display the dummy year
                        month: '%e. %b',
                        year: '%b'
                    },
                    title: {
                        text: 'timestamp'
                    },
                    categories: timestamps
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

            $('#responseTimeGraphTime').highcharts({
                chart: {
                    type: 'spline',
                    zoomType: 'xy',
                    width: graphWidth
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
                        text: 'timestamp'
                    },
                    categories: timestamps
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
            $('#reqPerSecGraphConcurrency').highcharts({
                chart: {
                    type: 'spline',
                    zoomType: 'xy',
                    width: graphWidth
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
                series: data
            });
        }


        function addResponseTimeGraphConcurrency(data) {
            $('#responseTimeGraphConcurrency').highcharts({
                chart: {
                    type: 'spline',
                    zoomType: 'xy',
                    width: graphWidth
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
                series: data
            });
        }

        function constructAllGraphs(data) {


            console.log('original data', data);
            var showCPU, showMemory;


            if (validateData(data)) {
                var timeData = buildTimeSeries(data);
                console.log('major timedata', timeData);
                addAveragesToTimeData(timeData);
                var concurrencyData = buildConcurrencySeries(data);
                $(function() {
                    // var concurrencyClasses = [];

                    if (showCPU) {
                        //concurrencyClasses.push(addCPUGraphs(timeData.cpuData, timeData.timestamps));
                    }
                    if (showMemory) {
                        //concurrencyClasses.push(addMemoryGraphs(timeData.memoryData, timeData.timestamps));
                    }

                    addReqPerSecGraphTime(timeData.reqPerSecData, timeData.timestamps);
                    addResponseTimeGraphTime(timeData.responseTimeData, timeData.timestamps);
                    addReqPerSecGraphConcurrency(concurrencyData.reqPerSecSeries);
                    addResponseTimeGraphConcurrency(concurrencyData.responseTimeSeries);
                });
            } else {
                console.log('bad data');
            }
        }

        function addSinglePoint(data, callback) {
            data = [data];

            if ($('#reqPerSecGraphTime').highcharts()) {

                if (validateData(data)) {
                    var timeData = buildTimeSeries(data);
                    var i;
                    addAveragesToTimeData(timeData);

                    // add reqPerSec points
                    var chart = $('#reqPerSecGraphTime').highcharts();
                    for (i = 0; i < timeData.reqPerSecData.length; i++) {
                        chart.series[i].addPoint([timeData.timestamps[0], timeData.reqPerSecData[i].data[0]]);
                    }

                    // add responseTime points
                    chart = $('#responseTimeGraphTime').highcharts();
                    for (i = 0; i < timeData.responseTimeData.length; i++) {
                        chart.series[i].addPoint([timeData.timestamps[0], timeData.responseTimeData[i].data[0]]);
                    }

                    var concurrencyData = buildConcurrencySeries(data);
                    // add reqPerSec points
                    chart = $('#reqPerSecGraphConcurrency').highcharts();
                    chart.addSeries(concurrencyData.reqPerSecSeries[0]);

                    // add responseTime points
                    chart = $('#responseTimeGraphConcurrency').highcharts();
                    chart.addSeries(concurrencyData.responseTimeSeries[0]);

                } else {
                    console.log('validation failed');
                    return callback(new Error('bad data'));
                }
            } else {
                constructAllGraphs(data);
            }
        }

        return {
            constructAllGraphs: constructAllGraphs,
            addSinglePoint: addSinglePoint
        };
    });
