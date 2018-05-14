$(document).ready(function () {

    // Get user (if there is a user)
    var user = getUserFromToken();

    user === null ? $("#userNav").text("Guest") : $("#userNav").text(user[0].Username);
    user === null ? $("#userTop").text("Guest") : $("#userTop").text(user[0].Username);

    // Variables
    var updateInterval = 30000; // Data update interval
    var numTempValues = 100;
    var jsonObject;
    var sensorsCharts = [];
    var sensorsData;

    var locArray = [];
    var infoArray = [];

    var maxData = 125;

    // Websitecolors
    var colorDarkBlue = "rgba(42, 63, 84, 0.9)";
    var colorLightGreen = "rgba(38, 185, 154, 1)";
    var colorWhiteWithAlpha = "rgba(255, 255, 255, 0.5)";
    var colorWhite = "rgba(255, 255, 255, 1)";

    function getSensorsData() {
        $.ajax({
            type: "GET",
            url: "/api/get_sensor_data",

            success: function (result) {
                // Retrieve the data from the database
                jsonObject = JSON.parse(result.result[0].data);
                updateCanvas();

                // Store the new data into a local storage
                localStorage.setItem('JSON_OBJECT', JSON.stringify(jsonObject));
            },
            error: function () {
                jsonObject = null;
            }
        });
    }

    function getDataWithTime(begin, end, sensorName, chart) {
        console.log("Time: " + begin + " to " + end);

        var location = null;
        for(var i = 0; i < sensorsCharts.length; ++i){
            if(sensorsCharts[i].id === chart){
                location = sensorsCharts[i].location;
                break;
            }
        }
        $.ajax({
            data: {
                'begin': begin,
                'end': end,
                'sensor': sensorName,
                'location': location
            },
            type: "GET",
            url: "/api/get_sensor_data_time",

            success: function (result) {
                if (result.success === true) {
                    updateCanvasWithTime(JSON.parse(result.result[0].data), chart, sensorName)
                }
            }
        });
    }

    // ----------------------------------------------------------------------------------------------
    // Main Screen
    function setGraphs() {

        if (jsonObject === undefined || jsonObject === null) {
            setTimeout(setGraphs, 1000);
        }
        else {
            totalArrays = []

            $("#pageTop").append("<h4>Sensors</h4>");
            for (var z = 0; z < jsonObject.length; z++) {
                var sensorName = Object.keys(jsonObject[z])[0];
                if(jsonObject[z][sensorName].length > 0){
                    var arrays = processDataBaseData(sensorName, z);

                    var arrVal = arrays[0];
                    var arrTime = arrays[1];
                    var arrTag = arrays[2];
                    var demoArrayVal = arrays[3];
                    var demoArrayTime = arrays[4];

                    totalArrays[sensorName] = {'arrVal': arrVal, 'arrTime': arrTime, 'arrTag': arrTag, 'demoArrayVal': demoArrayVal, 'demoArrayTime': demoArrayTime, 'jsonObject': jsonObject[z][sensorName]};

                    // ----------------------------------------------------------------------------------------------
                    // TOP BUTTONS - TO ADD SENSORS
                    $("#pageTop").append("<button type='button' class='btn' style='margin: 0px 7px 25px 0px; float: left;'' id='buttonAdd" + sensorName + "'>" + sensorName + "</button>");
                    var newDiv = document.getElementById('buttonAdd' + sensorName);
                    newDiv.addEventListener("click", addNewDiv, false);
                    newDiv.dataObject = jsonObject[z][sensorName];
                    newDiv.arrVal = arrVal;
                    newDiv.arrTime = arrTime;
                    newDiv.arrTag = arrTag;
                    newDiv.demoArrayVal = demoArrayVal;
                    newDiv.demoArrayTime = demoArrayTime;
                    newDiv.senName = sensorName;
                }
            }  

            if(user !== null){
                console.log("Cards: " + user[0].Frontpage.length);
                for(var i = 0; i < user[0].Frontpage.length; i++){
                    sensorName = user[0].Frontpage[i]['Sensor'];
                    if(arrVal[user[0].Frontpage[i]['Location']] !== undefined){
                        populateFrontEnd(sensorName, totalArrays[sensorName]['arrVal'], totalArrays[sensorName]['arrTime'], user[0].Frontpage[i]['Order'], 
                            user[0].Frontpage[i]['Location'], totalArrays[sensorName]['jsonObject'], totalArrays[sensorName]['arrTag'], 
                            totalArrays[sensorName]['demoArrayVal'], totalArrays[sensorName]['demoArrayTime']);
                    }
                }
            }

            // Order according to user's preferences
            var main = document.getElementById('pageContent');

            [].map.call( main.children, Object ).sort( function ( a, b ) {
                return +a.id.match( /\d+/ ) - +b.id.match( /\d+/ );
            }).forEach( function ( elem ) {
                main.appendChild( elem );
            });

            sortFrontPage();

            $(".loader").remove();
        }
    }

    // ----------------------------------------------------------------------------------------------
    // Add New Div
    function addNewDiv(argument) {
        populateFrontEnd(argument.target.senName, argument.target.arrVal, argument.target.arrTime, null, null, argument.target.dataObject, argument.target.arrTag, argument.target.demoArrayVal, argument.target.demoArrayTime);
    }

    function populateFrontEnd(...argument){
        var sensorName = argument[0];
        var charId = generateToken();

        if(argument[4] !== null && argument[4].length > 0){ 
            locArray[sensorName] = argument[4];
        }

        var order = null;

        if(argument[3] == null){
            order = generateRandomOrder();
        }
        else{
            order = argument[3];
        }

        var max = null;
        var min = null;

        if(argument[1][locArray[sensorName]] !== undefined){
            var max = Math.max(...argument[1][locArray[sensorName]]);
            var min = Math.min(...argument[1][locArray[sensorName]]);
        }
        else{
            locArray[sensorName] = Object.keys(argument[1])[0];
            var max = Math.max(...argument[1][locArray[sensorName]]);
            var min = Math.min(...argument[1][locArray[sensorName]]);
        }

        dropdownMenuOptions = ""

        for (key in argument[1]){
            if(key !== locArray[sensorName]){
                dropdownMenuOptions += "<option>" + key + "</option>";
            }
            else {
                dropdownMenuOptions += "<option selected='selected'>" + key + "</option>";
            }
        }
        
        if (argument[2][locArray[sensorName]] !== undefined && argument[2][locArray[sensorName]].length > 0) {
            $("#pageContent").append(
                "<div class='col-xs-6 .col-md-6' style='padding-top: 10px; color: white;' id='" + order + "'> \
                    <div class='col-xs-12 .col-md-12' style='background-color: " + colorDarkBlue + "; '> \
                        <div class='row x_title'> \
                            <div class='col-xs-4 .col-md-4' id='title'> \
                                <h3>" + sensorName + "</h3> \
                            </div> \
                            <div class='col-xs-8 .col-md-8' style='text-align: center;'> \
                                <button type='button' class='btn btn-primary dropdown-toggle' style='margin: 7px 7px 0px 0px; float: right;' id='close" + charId + "'>X</button> \
                                <button type='button' class='btn btn-primary dropdown-toggle' style='margin: 7px 7px 0px 0px; float: right;' id='more" + charId + "'>More</button> \
                                <select class='btn btn-primary dropdown-toggle' style='margin: 7px 7px 0px 0px;float: right;padding-bottom: 7px;padding-top: 7px;' id='drop" + charId + "'> \
                                    " + dropdownMenuOptions + "\
                                </select>\
                            </div> \
                        </div> \
                    </div> \
                    \
                    <div class='col-xs-12 .col-md-12' style='background-color: " + colorDarkBlue + "; text-align: center; '> \
                        <div class='col-xs-12 .col-md-12' text-align: center; style='margin-bottom: 5px' '> \
                            <h4 id='updateTime" + charId + "'> <b>" + argument[2][locArray[sensorName]][0].split(" ")[0] + "</b> to <b>" + argument[2][locArray[sensorName]][argument[2][locArray[sensorName]].length - 1].split(" ")[0] + "</b></h4> \
                        </div> \
                        \
                        <div class='row x_title'> \
                            <div class='col-xs-6 .col-md-6'> \
                                <p> Maximum Value <br> <h3 id='maxMain" + charId + "'>" + Math.round(max * 100) / 100 + " " + infoArray[sensorName][locArray[sensorName]]['Unit'] + "</h3></p> \
                            </div> \
                            <div class='col-xs-6 .col-md-6'> \
                                <p> Minimum Value <br> <h3 id='minMain" + charId + "'>" + Math.round(min * 100) / 100 + " " + infoArray[sensorName][locArray[sensorName]]['Unit'] + "</h3></p> \
                            </div> \
                        </div> \
                    </div> \
                    \
                    <div class='col-xs-12 .col-md-12' style='background-color: " + colorDarkBlue + "; text-align: center; '> \
                        <div class='col-xs-6 .col-md-6'> \
                            <p> Time <br> <h4 id='time" + charId + "'>" + argument[2][locArray[sensorName]][argument[2][locArray[sensorName]].length - 1] + "</h4></p> \
                        </div> \
                        <div class='col-xs-6 .col-md-6'> \
                            <p> Last Recorded Value <br> <h4 id='value" + charId + "'>" + Math.round(argument[1][locArray[sensorName]][argument[1][locArray[sensorName]].length - 1] * 100) / 100 + " " + infoArray[sensorName][locArray[sensorName]]['Unit'] + "</h4></p> \
                        </div> \
                    </div> \
                    <div class='col-xs-12 .col-md-12' style='background-color: " + colorDarkBlue + "; '> \
                        <canvas id='" + charId + "' width='auto' height='200px' style='display: none'></canvas> \
                    </div> \
                </div> "
            );

            // ----------------------------------------------------------------------------------------------
            // Set Graphic ID
            sensorsCharts.push({'id': charId, 'update': true, 'sensor': sensorName, 'location': locArray[sensorName]});

            // ----------------------------------------------------------------------------------------------
            // Graph
            var ctx = document.getElementById(charId).getContext('2d');
            var myChart = {
                type: 'bar',
                data: {
                    labels: argument[2][locArray[sensorName]],
                    datasets: [{
                        label: sensorName,
                        data: argument[1][locArray[sensorName]],
                        backgroundColor: colorLightGreen
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    title: {
                        display: true,
                        text: argument[2][locArray[sensorName]][0].split(" ")[0] + " to " + argument[2][locArray[sensorName]][argument[2][locArray[sensorName]].length - 1].split(" ")[0],
                        fontColor: '#FFFFFF',
                        fontSize: 14
                    },
                    legend: {
                        display: false
                    },
                    options: {
                        layout: {
                            padding: {
                                left: 100
                            }
                        }
                    },
                    scales: {
                        xAxes: [{
                            gridLines: {
                                color: colorWhiteWithAlpha,
                                zeroLineColor: colorWhiteWithAlpha
                            },
                            ticks: {
                                fontColor: colorWhite,
                                maxRotation: 20,
                                minRotation: 20,
                                scaleBeginAtZero: true
                            }
                        }],
                        yAxes: [{
                            gridLines: {
                                color: colorWhiteWithAlpha,
                                zeroLineColor: colorWhiteWithAlpha
                            },
                            ticks: {
                                fontColor: colorWhite
                            },
                            scaleLabel: {
                                display: true,
                                fontColor: colorWhite,
                                labelString: infoArray[sensorName][locArray[sensorName]]['Unit']
                            }
                        }]
                    }
                }
            };

            ctx.canvas.originalWidth = ctx.canvas.width;
            ctx.canvas.originalHeight = ctx.canvas.height;

            window[charId] = new Chart(ctx, myChart);

            // MoreInfo Listener
            var temp = document.getElementById("more" + charId);
            temp.addEventListener("click", moreInfo, false);

            temp.chartInfo = myChart;
            temp.dataObject = argument[5];
            temp.tag = argument[6];
            temp.arrVal = argument[1];
            temp.arrTime = argument[2];
            temp.senName = sensorName;
            temp.charId = charId;
            temp.demoVal = argument[7];
            temp.demoTime = argument[8];

            // LocationChange Listener
            var list = document.getElementById("drop" + charId);
            list.addEventListener("change", dropDownMenu, false);

            list.senName = sensorName;
            list.arrVal = argument[1];
            list.arrTime = argument[2];
            list.charId = charId;

            // CloseDiv Listener
            var close = document.getElementById("close" + charId);
            close.addEventListener("click", closeDiv, false);

            close.order = order;

            sortFrontPage();
        }        
    }

    // ----------------------------------------------------------------------------------------------
    // dropdownMenu change
    function dropDownMenu(argument){
        var sensorName = argument.target.senName;
        var charId = argument.target.charId;

        var list = document.getElementById("drop" + charId);

        locArray[sensorName] = list.value;

        for (i = 0; i < sensorsCharts.length; i++) { 
            if(sensorsCharts[i].id === charId){
                sortFrontPage()

                $('#maxMain' + charId).html(Math.round(Math.max(...argument.target.arrVal[locArray[sensorName]]) * 100) / 100 + " " + infoArray[sensorName][locArray[sensorName]]['Unit']);
                $('#minMain' + charId).html(Math.round(Math.min(...argument.target.arrVal[locArray[sensorName]]) * 100) / 100 + " " + infoArray[sensorName][locArray[sensorName]]['Unit']);
                $('#time' + charId).html(argument.target.arrTime[locArray[sensorName]][argument.target.arrTime[locArray[sensorName]].length - 1]);
                $('#value' + charId).html(argument.target.arrVal[locArray[sensorName]][argument.target.arrVal[locArray[sensorName]].length - 1]);
                $('#updateTime' + charId).html("<b>" + argument.target.arrTime[locArray[sensorName]][0].split(" ")[0] + "</b> to <b>" + argument.target.arrTime[locArray[sensorName]][argument.target.arrTime[locArray[sensorName]].length - 1].split(" ")[0] + "</b>");
            }
        }
    }

    function closeDiv(argument){
        var div = document.getElementById(argument.target.order);
        $(div).remove();

        sortFrontPage();
    }

    // ----------------------------------------------------------------------------------------------
    // Detailed info (when asked)
    function moreInfo(argument) {
        document.getElementById("pageContent").innerHTML = "";
        document.getElementById("pageTop").innerHTML = "";

        // force to not update other graphs
        for (var i = 0; i < sensorsCharts.length; i++) {
            if (sensorsCharts[i].id !== argument.target.charId) {
                sensorsCharts[i].update = false;
            }
            else{
                locArray[argument.target.senName] = sensorsCharts[i].location;
            }
        }

        var max = Math.max(...argument.target.arrVal[locArray[argument.target.senName]]);
        var min = Math.min(...argument.target.arrVal[locArray[argument.target.senName]]);
        var maxI = indexOfMax(argument.target.arrVal[locArray[argument.target.senName]]);
        var minI = indexOfMin(argument.target.arrVal[locArray[argument.target.senName]]);

        var location = locArray[argument.target.senName];

        tag = undefined;
        var tagValues = argument.target.tag[locArray[argument.target.senName]];

        if (tagValues.length > 0) {
            tag = "<div class='col-xs-12 .col-md-12' style='background-color: " + colorDarkBlue + ";  text-align: center;'> \
                        <div class='col-xs-4 .col-md-4'> \
                            <h5><b>Lday</b></h5>\
                            <canvas id='" + argument.target.charId + "Ld' width='auto' height='auto'></canvas> \
                        </div> \
                        <div class='col-xs-4 .col-md-4'> \
                            <h5><b>Levening</b></h5>\
                            <canvas id='" + argument.target.charId + "Le' width='auto' height='auto'></canvas> \
                        </div> \
                        <div class='col-xs-4 .col-md-4'> \
                            <h5><b>Lnight</b></h5>\
                            <canvas id='" + argument.target.charId + "Ln' width='auto' height='auto'></canvas> \
                        </div> \
                    </div> "
        }


        dropdownMenuOptions = ""
        for (key in argument.target.arrVal){
            if(location !== key){
                dropdownMenuOptions += "<option style='background-color: " + colorDarkBlue + "'>" + key + "</option>";
            }
            else{
                dropdownMenuOptions += "<option selected='selected' style='background-color: " + colorDarkBlue + "'>" + key + "</option>";
            }
        }

        $("#pageContent").append(
            "<div class='col-xs-12 .col-md-12' style='padding-top: 10px; color: white;'> \
                <div class='col-xs-12 .col-md-12' style='background-color: " + colorDarkBlue + ";'> \
                    <div class='row x_title'> \
                        <div class='col-xs-6 .col-md-6'> \
                            <h3>" + argument.target.senName + "</h3> \
                        </div> \
                        \
                        <div class='col-xs-6 .col-md-6'> \
                            <div id='reportrange' class='btn btn-primary dropdown-toggle' style='float: right;text-align: center;cursor: pointer;color: " + colorWhite + ";margin-top: 6px;border-top-width: 0px;border-bottom-width: 0px;margin-bottom: 4px;height: 35px;'> \
                                <h3 style='height: 18px;margin-top: 0px;margin-bottom: 5px;'><span style='display: initial; line-height: 0; background-color: Transparent; border-radius: none; border-color: Transparent'><span style='display: table-row; line-height: 0; background-color: Transparent; border-radius: none; border-color: Transparent'> </span> </span></h3> \
                            </div> \
                            <select class='btn btn-primary dropdown-toggle' style='margin: 7px 7px 0px 0px;float: right;padding-bottom: 7px;padding-top: 7px;' id='chartChange'> \
                                <option>Bar Chart</option>\
                                <option>Line Chart</option>\
                            </select>\
                        </div> \
                    </div> \
                </div> \
                <div class='col-xs-12 .col-md-12' style='background-color: " + colorDarkBlue + ";  text-align: center;'> \
                    <div class='row x_title'> \
                        <div class='col-xs-3 .col-md-3'> \
                            <h6>Location</h6> \
                            <select class='btn btn-primary dropdown-toggle' id='changeLoc' style='background-color: Transparent; border-color: Transparent; font-size: 24px; font-weight: bold; padding-top: 0px; border-top: 0px'> \
                                " + dropdownMenuOptions + " \
                            </select>\
                        </div> \
                        <div class='col-xs-3 .col-md-3'> \
                            <h6>Device</h6> \
                            <h3><p id='dev'><b>" + infoArray[argument.target.senName][locArray[argument.target.senName]]['Device'] + "</b></p></h3> \
                        </div> \
                        <div class='col-xs-3 .col-md-3'> \
                            <h6>Distribution</h6> \
                            <h3><p id='dis'><b>" + infoArray[argument.target.senName][locArray[argument.target.senName]]['Distro'] + "</b></p></h3> \
                        </div> \
                        <div class='col-xs-3 .col-md-3'> \
                            <h6>Unit</h6> \
                            <h3><p id='unit'><b>" + infoArray[argument.target.senName][locArray[argument.target.senName]]['Unit'] + "</b></p></h3> \
                        </div> \
                    </div> \
                </div> \
                <div class='col-xs-12 .col-md-12' style='background-color: " + colorDarkBlue + ";  text-align: center;'> \
                    <div class='row x_title'> \
                        <div class='col-xs-12 .col-md-12 '> \
                            <div class='col-xs-6 .col-md-6'> \
                                <p id='max" + argument.target.charId + "'> Maximum Value (graph): <b>" + max + " " + infoArray[argument.target.senName][locArray[argument.target.senName]]['Unit'] + " </b><small>(" + argument.target.arrTime[locArray[argument.target.senName]][maxI] + ")</small></p> \
                            </div> \
                            <div class='col-xs-6 .col-md-6'> \
                                <p id='min" + argument.target.charId + "'> Minimum Value (graph): <b>" + min + " " + infoArray[argument.target.senName][locArray[argument.target.senName]]['Unit'] + " </b><small>(" + argument.target.arrTime[locArray[argument.target.senName]][minI] + ")</small></p> \
                            </div> \
                        </div> \
                        <div class='col-xs-12 .col-md-12 '> \
                            <div class='col-xs-6 .col-md-6'> \
                                <p id='maxTotal" + argument.target.charId + "'> Maximum Value (total): <b>" + infoArray[argument.target.senName][locArray[argument.target.senName]]['Max'] + " " + infoArray[argument.target.senName][locArray[argument.target.senName]]['Unit'] + " </b><small>(" + infoArray[argument.target.senName][locArray[argument.target.senName]]['MaxTime'] + ")</small></p> \
                            </div> \
                            <div class='col-xs-6 .col-md-6'> \
                                <p id='minTotal" + argument.target.charId + "'> Minimum Value (total): <b>" + infoArray[argument.target.senName][locArray[argument.target.senName]]['Min'] + " " + infoArray[argument.target.senName][locArray[argument.target.senName]]['Unit'] + " </b><small>(" + infoArray[argument.target.senName][locArray[argument.target.senName]]['MinTime'] + ")</small></p> \
                            </div> \
                        </div> \
                    </div> \
                </div> \
                <div class='col-xs-12 .col-md-12' style='background-color: " + colorDarkBlue + "; '> \
                    <div class='row x_title'> \
                        <canvas id='" + argument.target.charId + "' width='auto' height='250px'></canvas> \
                    </div> \
                </div> \
                <div class='col-xs-12 .col-md-12' style='background-color: " + colorDarkBlue + "; '> \
                    <div class='row x_title'> \
                        <div class='col-xs-12 .col-md-12 '> \
                            <h3 id='warnDemo" + argument.target.charId + "''></h3> \
                            <canvas id='demo" + argument.target.charId + "' width='auto' height='200px'></canvas> \
                        </div> \
                        \
                    </div> \
                </div> \
                " + tag + "\
            </div> \
            \
            <br>"
        );

        // ----------------------------------------------------------------------------------------------
        // Set charts with correct data

        // Main chart
        var ctx = document.getElementById(argument.target.charId).getContext('2d');
        ctx.canvas.originalWidth = ctx.canvas.width;
        ctx.canvas.originalHeight = ctx.canvas.height;

        window[argument.target.charId] = new Chart(ctx, argument.target.chartInfo);

        // ----------------------------------------------------------------------------------------------
        // Demo Charts
        if(Object.keys(argument.target.demoTime).length > 0){
            var demoChart = {
                type: 'bar',
                data: {
                    labels: null,
                    datasets: [{
                        label: null,
                        data: null,
                        fill: false,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        backgroundColor: colorLightGreen,
                        borderColor: colorLightGreen
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    title: {
                        display: true,
                        text: argument.target.demoTime[locArray[argument.target.senName]][0] + " to " + argument.target.demoTime[locArray[argument.target.senName]][argument.target.demoTime[locArray[argument.target.senName]].length - 1],
                        fontColor: '#FFFFFF',
                        fontSize: 14
                    },
                    legend: {
                        display: false
                    },
                    scales: {
                        xAxes: [{
                            gridLines: {
                                color: colorWhiteWithAlpha,
                                zeroLineColor: colorWhiteWithAlpha
                            },
                            ticks: {
                                fontColor: colorWhite,
                                maxRotation: 20,
                                minRotation: 20,
                                scaleBeginAtZero: true
                            }
                        }],
                        yAxes: [{
                            gridLines: {
                                color: colorWhiteWithAlpha,
                                zeroLineColor: colorWhiteWithAlpha
                            },
                            ticks: {
                                min: argument.target.min,
                                fontColor: colorWhite
                            },
                            scaleLabel: {
                                display: true,
                                labelString: infoArray[argument.target.senName][locArray[argument.target.senName]]['Unit'],
                                fontColor: colorWhite
                            }
                        }]
                    }
                }
            };
        }

        var demo = document.getElementById("demo" + argument.target.charId).getContext('2d');
        if(argument.target.demoVal[locArray[argument.target.senName]] !== undefined && argument.target.demoVal[locArray[argument.target.senName]].length > 0){
            demoChart.data.labels = argument.target.demoTime[locArray[argument.target.senName]];
            demoChart.data.datasets[0].label = 'Workshop Demo';
            demoChart.data.datasets[0].data = argument.target.demoVal[locArray[argument.target.senName]];
            window["demo" + argument.target.charId] = new Chart(demo, demoChart);
        }
        else{
            $("#warnDemo" + argument.target.charId).html("<h3>Data not available.</h3>");
            window["demo" + argument.target.charId] = null;
        }


        // ----------------------------------------------------------------------------------------------
        // Tag charts
        if (tagValues.length > 0) {
            ldArray = [];
            leArray = [];
            lnArray = [];
            timeArray = [];

            jsonWithData = argument.target.dataObject;
            for (var i = 0; i < jsonWithData.length; i++) {
                if(jsonWithData[i]['Location'] === locArray[argument.target.senName]){
                    ldVal = 0;
                    leVal = 0;
                    lnVal = 0;
                    ldCount = 0;
                    leCount = 0;
                    lnCount = 0;

                    for (var j = 0; j < jsonWithData[i]['Data_Collected'].length; j++) {
                        if (jsonWithData[i]['Data_Collected'][j]['Tag'] === 'Ld') {
                            ldVal += Math.pow(10, 0.1 * jsonWithData[i]['Data_Collected'][j]['LAeq']);
                            ldCount++;
                        }
                        else if (jsonWithData[i]['Data_Collected'][j]['Tag'] === 'Le') {
                            leVal += Math.pow(10, 0.1 * jsonWithData[i]['Data_Collected'][j]['LAeq']);
                            leCount++;
                        }
                        else if (jsonWithData[i]['Data_Collected'][j]['Tag'] === 'Ln' && Number(jsonWithData[i]['Data_Collected'][j]['Time'].split(" ")[1].slice(0, 1)) >= 23) {
                            // It needs to be after 7 am - we are going to the time of the value, split the date + time and get the hour
                            lnVal += Math.pow(10, 0.1 * jsonWithData[i]['Data_Collected'][j]['LAeq']);
                            lnCount++;
                        }
                    }

                    // Get the Ln from the next day
                    if ((i + 1) < jsonWithData.length) {
                        for (var j = 0; j < jsonWithData[i + 1]['Data_Collected'].length; j++) {
                            if (jsonWithData[i + 1]['Data_Collected'][j]['Tag'] === 'Ln' && Number(jsonWithData[i + 1]['Data_Collected'][j]['Time'].split(" ")[1].slice(0, 1)) >= 0 && Number(jsonWithData[i + 1]['Data_Collected'][j]['Time'].split(" ")[1].slice(0, 1)) < 7) {
                                // It needs to be after 7 am - we are going to the time of the value, split the date + time and get the hour
                                lnVal += Math.pow(10, 0.1 * jsonWithData[i + 1]['Data_Collected'][j]['LAeq']);
                                lnCount++;
                            }
                        }
                    }

                    if (ldCount === 0)
                        ldArray.push(NaN);
                    else
                        ldArray.push(Math.round(10 * Math.log10(ldVal / ldCount) * 100) / 100);

                    if (leCount === 0)
                        leArray.push(NaN);
                    else
                        leArray.push(Math.round(10 * Math.log10(leVal / leCount) * 100) / 100);

                    if (lnCount === 0)
                        lnArray.push(NaN);
                    else
                        lnArray.push(Math.round(10 * Math.log10(lnVal / lnCount) * 100) / 100);

                    timeArray.push(jsonWithData[i]['Time']);
                }
            }

            var temp = 0;

            // Ld
            var tagLd = {
                type: 'line',
                data: {
                    labels: null,
                    datasets: [{
                        label: null,
                        data: null,
                        fill: false,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        backgroundColor: colorLightGreen,
                        borderColor: colorLightGreen
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    },
                    scales: {
                        xAxes: [{
                            gridLines: {
                                color: colorWhiteWithAlpha,
                                zeroLineColor: colorWhiteWithAlpha
                            },
                            ticks: {
                                fontColor: colorWhite,
                                maxRotation: 20,
                                minRotation: 20,
                                scaleBeginAtZero: true
                            }
                        }],
                        yAxes: [{
                            gridLines: {
                                color: colorWhiteWithAlpha,
                                zeroLineColor: colorWhiteWithAlpha
                            },
                            ticks: {
                                min: 30,
                                max: 70,
                                fontColor: colorWhite
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'dBA',
                                fontColor: colorWhite
                            }
                        }]
                    }
                }
            };

            var ld = document.getElementById(argument.target.charId + "Ld").getContext('2d');
            tagLd.data.labels = timeArray;
            tagLd.data.datasets[0].label = 'Ld';
            tagLd.data.datasets[0].data = ldArray;
            window[argument.target.charId + "Ld"] = new Chart(ld, tagLd);

            // Le
            var tagLe = {
                type: 'line',
                data: {
                    labels: null,
                    datasets: [{
                        label: null,
                        data: null,
                        fill: false,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        backgroundColor: colorLightGreen,
                        borderColor: colorLightGreen
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    },
                    scales: {
                        xAxes: [{
                            gridLines: {
                                color: colorWhiteWithAlpha,
                                zeroLineColor: colorWhiteWithAlpha
                            },
                            ticks: {
                                fontColor: colorWhite,
                                maxRotation: 20,
                                minRotation: 20,
                                scaleBeginAtZero: true
                            }
                        }],
                        yAxes: [{
                            gridLines: {
                                color: colorWhiteWithAlpha,
                                zeroLineColor: colorWhiteWithAlpha
                            },
                            ticks: {
                                min: 30,
                                max: 70,
                                fontColor: colorWhite
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'dBA',
                                fontColor: colorWhite
                            }
                        }]
                    }
                }
            };
            var le = document.getElementById(argument.target.charId + "Le").getContext('2d');
            tagLe.data.labels = timeArray;
            tagLe.data.datasets[0].label = 'Le';
            tagLe.data.datasets[0].data = leArray;
            window[argument.target.charId + "Le"] = new Chart(le, tagLe);

            // Ln
            var tagLn = {
                type: 'line',
                data: {
                    labels: null,
                    datasets: [{
                        label: null,
                        data: null,
                        fill: false,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        backgroundColor: colorLightGreen,
                        borderColor: colorLightGreen
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    },
                    scales: {
                        xAxes: [{
                            gridLines: {
                                color: colorWhiteWithAlpha,
                                zeroLineColor: colorWhiteWithAlpha
                            },
                            ticks: {
                                fontColor: colorWhite,
                                maxRotation: 20,
                                minRotation: 20,
                                scaleBeginAtZero: true
                            }
                        }],
                        yAxes: [{
                            gridLines: {
                                color: colorWhiteWithAlpha,
                                zeroLineColor: colorWhiteWithAlpha
                            },
                            ticks: {
                                min: 30,
                                max: 70,
                                fontColor: colorWhite
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'dBA',
                                fontColor: colorWhite
                            }
                        }]
                    }
                }
            };
            var ln = document.getElementById(argument.target.charId + "Ln").getContext('2d');
            tagLn.data.labels = timeArray;
            tagLn.data.datasets[0].label = 'Ln';
            tagLn.data.datasets[0].data = lnArray;
            window[argument.target.charId + "Ln"] = new Chart(ln, tagLn);
        }

        document.getElementById("chartChange").onchange = function (){
            var sensorName = argument.target.senName;

            var list = document.getElementById("chartChange");

            var graph = "";

            if(list.selectedIndex === 0){
                type = 'bar';
            }
            else if(list.selectedIndex === 1){
                type = 'line';
            }

            window[argument.target.charId].config.type = type;
            var aux = window[argument.target.charId].config;

            window[argument.target.charId].destroy();

            ctx.canvas.height = ctx.canvas.originalHeight;
            ctx.canvas.width = ctx.canvas.originalWidth;
            window[argument.target.charId] = new Chart(ctx, aux);
        }

        document.getElementById("changeLoc").onchange = function(){
            var val = document.getElementById("changeLoc");
            locArray[argument.target.senName] = val.value;

            for(j = 0; j < sensorsCharts.length; j++){
                if(sensorsCharts[j].id === argument.target.charId){
                    sensorsCharts[j].location = val.value;
                    sensorsCharts[j].update = true;
                    break;
                }
            }

            updateCanvas();
        }


        datePicker(argument.target.senName, argument.target.charId);
    }

// ----------------------------------------------------------------------------------------------
// Update Graphics having Time
    function updateCanvasWithTime(jsonObjectWithTime, chart, sensorName) {
        if (jsonObjectWithTime.length === 0) {
            new PNotify({
                    title: 'No data available',
                    text: 'There is no information for the select interval.',
                    type: 'error',
                    styling: 'bootstrap3'
                });
            return;
        }

        var arrVal = [];
        var arrTime = [];
        var arrTag = [];

        var max = null;
        var min = null;

        for (var i = 0; i < jsonObjectWithTime.length; i++) {
            var dataArray = jsonObjectWithTime[i].Data_Collected;

            if (dataArray.length < maxData) {
                var aux = 0;
                for (var j = 0; j < dataArray.length; j++) {
                    for (var key in dataArray[j]) {
                        if (key !== "Time") {
                            aux = aux + Number(dataArray[j][key]);
                        }
                    }
                }

                aux = aux / dataArray.length;
                arrVal.push(Math.round(aux * 100) / 100);
                arrTime.push(jsonObjectWithTime[i].Time);

                if (aux > max || max === null) {
                    max = aux;
                }

                if (aux < min || min === null) {
                    min = aux;
                }
            }
            else {
                var aux = 0;
                var diff = Math.floor(dataArray.length / maxData);

                for (var j = 0; j < dataArray.length; j = j + diff) {
                    for (var key in dataArray[j]) {
                        if (key !== "Time" && key !== "Tag") {
                            aux = Number(dataArray[j][key]);
                            arrVal.push(Math.round(aux * 100) / 100);

                            if (aux > max || max === null) {
                                max = aux;
                            }

                            if (aux < min || min === null) {
                                min = aux;
                            }

                            arrTime.push(dataArray[j].Time);
                        }
                        if (key === "Tag") {
                            arrTag.push(dataArray[j].Tag);
                        }
                    }
                }
            }
        }

        if (arrVal.length > maxData) {
            var newArrVal = [];
            var newArrTime = [];
            var newArrTag = [];
        }

        // ----------------------------------------------------------------------------------------------
        // Graphics
        var ctx = document.getElementById(chart).getContext('2d');
        var myChart = {
            type: window[chart].config.type,
            data: {
                labels: arrTime,
                datasets: [{
                    label: sensorName,
                    data: arrVal,
                    backgroundColor: colorLightGreen
                }]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                title: {
                    display: true,
                    text: arrTime[0].split(" ")[0] + " to " +arrTime[arrTime.length - 1].split(" ")[0],
                    fontColor: '#FFFFFF',
                    fontSize: 14
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            color: colorWhiteWithAlpha,
                            zeroLineColor: colorWhiteWithAlpha
                        },
                        ticks: {
                            fontColor: colorWhite,
                            maxRotation: 20,
                            minRotation: 20,
                            scaleBeginAtZero: true
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            color: colorWhiteWithAlpha,
                            zeroLineColor: colorWhiteWithAlpha
                        },
                        ticks: {
                            fontColor: colorWhite
                        },
                        scaleLabel: {
                            display: true,
                            fontColor: colorWhite
                        }
                    }]
                }
            }
        };

        window[chart].destroy();

        ctx.canvas.height = ctx.canvas.originalHeight;
        ctx.canvas.width = ctx.canvas.originalWidth;

        window[chart] = new Chart(ctx, myChart);

        for (var i = 0; i < sensorsCharts.length; i++) {
            if (sensorsCharts[i].id === chart) {
                sensorsCharts[i].update = false;
            }
        }

        new PNotify({
            title: 'Chart Update',
            text: 'By selecting a specific date, the graphs will not longer be updated.',
            type: 'warning',
            styling: 'bootstrap3'
        });
    }

// ----------------------------------------------------------------------------------------------
// Update graphs
    function updateCanvas() {
        if (typeof sensorsCharts !== "undefined") {
            for (var x = 0; x < sensorsCharts.length; x++) {
                if (sensorsCharts[x].update) {
                    if (typeof window[sensorsCharts[x].id] !== "undefined") {
                        var sensorName = sensorsCharts[x].sensor;

                        for (var z = 0; z < jsonObject.length; z++) {
                            if (typeof jsonObject[z][sensorName] !== "undefined") {
                                var charId = sensorsCharts[x].id;
                                var loc = sensorsCharts[x].location;
                                
                                var arrays = processDataBaseData(sensorName, z);

                                var arrVal = arrays[0];
                                var arrTime = arrays[1];
                                var arrTag = arrays[2];
                                var demoArrayVal = arrays[3];
                                var demoArrayTime = arrays[4];

                                if(arrVal[loc] === undefined){
                                    console.log(loc + " not found. Changing to " + Object.keys(arrVal)[0]);
                                    sensorsCharts[x].location = Object.keys(arrVal)[0];
                                    loc = sensorsCharts[x].location;
                                }

                                replaceData(window[sensorsCharts[x].id], arrTime[loc], arrVal[loc]);

                                var max = Math.max(...arrVal[loc]);
                                var min = Math.min(...arrVal[loc]);
                                var maxI = indexOfMax(arrVal[loc]);
                                var minI = indexOfMin(arrVal[loc]);

                                $('#time' + charId).html(arrTime[loc][arrTime[loc].length - 1]);
                                $('#value' + charId).html(arrVal[loc][arrVal[loc].length - 1] + " " + infoArray[sensorName][loc]['Unit']);

                                $('#max' + charId).html("Maximum Value (graph): <b>" + max + " " + infoArray[sensorName][loc]['Unit'] + " </b><small>(" + arrTime[loc][maxI] + ")</small>");
                                $('#min' + charId).html("Minimum Value (graph): <b>" + min + " " + infoArray[sensorName][loc]['Unit'] + " </b><small>(" + arrTime[loc][minI] + ")</small>");

                                $('#maxTotal' + charId).html("Maximum Value (total): <b>" + infoArray[sensorName][loc]['Max'] + " " + infoArray[sensorName][loc]['Unit'] + " </b><small>(" + infoArray[sensorName][loc]['MaxTime'] + ")</small>");
                                $('#minTotal' + charId).html("Minimum Value (total): <b>" + infoArray[sensorName][loc]['Min'] + " " + infoArray[sensorName][loc]['Unit'] + " </b><small>(" + infoArray[sensorName][loc]['MinTime'] + ")</small>");

                                $('#maxMain' + charId).html(Math.round(max * 100) / 100 + " " + infoArray[sensorName][loc]['Unit']);
                                $('#minMain' + charId).html(Math.round(min * 100) / 100 + " " + infoArray[sensorName][loc]['Unit']);

                                $('#updateTime' + charId).html("<b>" + arrTime[loc][0].split(" ")[0] + "</b> to <b>" + arrTime[loc][arrTime[loc].length - 1].split(" ")[0] + "</b>");

                                // ----------------------------------------------------------------------------------------------
                                // Demo Charts

                                var demoChart = {
                                    type: 'bar',
                                    data: {
                                        labels: null,
                                        datasets: [{
                                            label: null,
                                            data: null,
                                            fill: false,
                                            pointRadius: 6,
                                            pointHoverRadius: 8,
                                            backgroundColor: colorLightGreen,
                                            borderColor: colorLightGreen
                                        }]
                                    },
                                    options: {
                                        maintainAspectRatio: false,
                                        responsive: true,
                                        title: {
                                            display: false
                                        },
                                        legend: {
                                            display: false
                                        },
                                        scales: {
                                            xAxes: [{
                                                gridLines: {
                                                    color: colorWhiteWithAlpha,
                                                    zeroLineColor: colorWhiteWithAlpha
                                                },
                                                ticks: {
                                                    fontColor: colorWhite,
                                                    maxRotation: 20,
                                                    minRotation: 20,
                                                    scaleBeginAtZero: true
                                                }
                                            }],
                                            yAxes: [{
                                                gridLines: {
                                                    color: colorWhiteWithAlpha,
                                                    zeroLineColor: colorWhiteWithAlpha
                                                },
                                                ticks: {
                                                    fontColor: colorWhite
                                                },
                                                scaleLabel: {
                                                    display: true,
                                                    labelString: infoArray[sensorName][loc]['Unit'],
                                                    fontColor: colorWhite
                                                }
                                            }]
                                        }
                                    }
                                };

                                if (window["demo" + charId] !== undefined) {
                                    replaceData(window["demo" + charId], demoArrayTime[loc], demoArrayVal[loc]);
                                }

                                // ----------------------------------------------------------------------------------------------
                                // Tag charts
                                if (window[charId + "Ld"] !== undefined && arrTag[loc].length > 0) {
                                    ldArray = [];
                                    leArray = [];
                                    lnArray = [];
                                    timeArray = [];

                                    jsonWithData = jsonObject[z][sensorName];
                                    for (var i = 0; i < jsonWithData.length; i++) {
                                        if(jsonWithData[i]['Location'] === loc){
                                            ldVal = 0;
                                            leVal = 0;
                                            lnVal = 0;
                                            ldCount = 0;
                                            leCount = 0;
                                            lnCount = 0;

                                            for (var j = 0; j < jsonWithData[i]['Data_Collected'].length; j++) {
                                                if (jsonWithData[i]['Data_Collected'][j]['Tag'] === 'Ld') {
                                                    ldVal += Math.pow(10, 0.1 * jsonWithData[i]['Data_Collected'][j]['LAeq']);
                                                    ldCount++;
                                                }
                                                else if (jsonWithData[i]['Data_Collected'][j]['Tag'] === 'Le') {
                                                    leVal += Math.pow(10, 0.1 * jsonWithData[i]['Data_Collected'][j]['LAeq']);
                                                    leCount++;
                                                }
                                                else if (jsonWithData[i]['Data_Collected'][j]['Tag'] === 'Ln' && Number(jsonWithData[i]['Data_Collected'][j]['Time'].split(" ")[1].slice(0, 1)) >= 23) {
                                                    // It needs to be after 7 am - we are going to the time of the value, split the date + time and get the hour
                                                    lnVal += Math.pow(10, 0.1 * jsonWithData[i]['Data_Collected'][j]['LAeq']);
                                                    lnCount++;
                                                }
                                            }

                                            // Get the Ln from the next day
                                            if ((i + 1) < jsonWithData.length) {
                                                for (var j = 0; j < jsonWithData[i + 1]['Data_Collected'].length; j++) {
                                                    if (jsonWithData[i + 1]['Data_Collected'][j]['Tag'] === 'Ln' && Number(jsonWithData[i + 1]['Data_Collected'][j]['Time'].split(" ")[1].slice(0, 1)) >= 0 && Number(jsonWithData[i + 1]['Data_Collected'][j]['Time'].split(" ")[1].slice(0, 1)) < 7) {
                                                        // It needs to be after 7 am - we are going to the time of the value, split the date + time and get the hour
                                                        lnVal += Math.pow(10, 0.1 * jsonWithData[i + 1]['Data_Collected'][j]['LAeq']);
                                                        lnCount++;
                                                    }
                                                }
                                            }

                                            if (ldCount === 0)
                                                ldArray.push(NaN);
                                            else
                                                ldArray.push(Math.round(10 * Math.log10(ldVal / ldCount) * 100) / 100);

                                            if (leCount === 0)
                                                leArray.push(NaN);
                                            else
                                                leArray.push(Math.round(10 * Math.log10(leVal / leCount) * 100) / 100);

                                            if (lnCount === 0)
                                                lnArray.push(NaN);
                                            else
                                                lnArray.push(Math.round(10 * Math.log10(lnVal / lnCount) * 100) / 100);

                                            timeArray.push(jsonWithData[i]['Time']);
                                        }
                                    }

                                    var temp = 0;

                                    // Ld
                                    var tagLd = {
                                        type: 'line',
                                        data: {
                                            labels: null,
                                            datasets: [{
                                                label: null,
                                                data: null,
                                                fill: false,
                                                pointRadius: 6,
                                                pointHoverRadius: 8,
                                                backgroundColor: colorLightGreen,
                                                borderColor: colorLightGreen
                                            }]
                                        },
                                        options: {
                                            maintainAspectRatio: false,
                                            responsive: true,
                                            title: {
                                                display: false
                                            },
                                            legend: {
                                                display: false
                                            },
                                            scales: {
                                                xAxes: [{
                                                    gridLines: {
                                                        color: colorWhiteWithAlpha,
                                                        zeroLineColor: colorWhiteWithAlpha
                                                    },
                                                    ticks: {
                                                        fontColor: colorWhite,
                                                        maxRotation: 20,
                                                        minRotation: 20,
                                                        scaleBeginAtZero: true
                                                    }
                                                }],
                                                yAxes: [{
                                                    gridLines: {
                                                        color: colorWhiteWithAlpha,
                                                        zeroLineColor: colorWhiteWithAlpha
                                                    },
                                                    ticks: {
                                                        min: 30,
                                                        max: 70,
                                                        fontColor: colorWhite
                                                    },
                                                    scaleLabel: {
                                                        display: true,
                                                        labelString: 'dBA',
                                                        fontColor: colorWhite
                                                    }
                                                }]
                                            }
                                        }
                                    };

                                    var ld = document.getElementById(charId + "Ld").getContext('2d');
                                    replaceData(window[charId + "Ld"], timeArray, ldArray)

                                    // Le
                                    var tagLe = {
                                        type: 'line',
                                        data: {
                                            labels: null,
                                            datasets: [{
                                                label: null,
                                                data: null,
                                                fill: false,
                                                pointRadius: 6,
                                                pointHoverRadius: 8,
                                                backgroundColor: colorLightGreen,
                                                borderColor: colorLightGreen
                                            }]
                                        },
                                        options: {
                                            maintainAspectRatio: false,
                                            responsive: true,
                                            title: {
                                                display: false
                                            },
                                            legend: {
                                                display: false
                                            },
                                            scales: {
                                                xAxes: [{
                                                    gridLines: {
                                                        color: colorWhiteWithAlpha,
                                                        zeroLineColor: colorWhiteWithAlpha
                                                    },
                                                    ticks: {
                                                        fontColor: colorWhite,
                                                        maxRotation: 20,
                                                        minRotation: 20,
                                                        scaleBeginAtZero: true
                                                    }
                                                }],
                                                yAxes: [{
                                                    gridLines: {
                                                        color: colorWhiteWithAlpha,
                                                        zeroLineColor: colorWhiteWithAlpha
                                                    },
                                                    ticks: {
                                                        min: 30,
                                                        max: 70,
                                                        fontColor: colorWhite
                                                    },
                                                    scaleLabel: {
                                                        display: true,
                                                        labelString: 'dBA',
                                                        fontColor: colorWhite
                                                    }
                                                }]
                                            }
                                        }
                                    };
                                    var le = document.getElementById(charId + "Le").getContext('2d');
                                    replaceData(window[charId + "Le"], timeArray, leArray)

                                    // Ln
                                    var tagLn = {
                                        type: 'line',
                                        data: {
                                            labels: null,
                                            datasets: [{
                                                label: null,
                                                data: null,
                                                fill: false,
                                                pointRadius: 6,
                                                pointHoverRadius: 8,
                                                backgroundColor: colorLightGreen,
                                                borderColor: colorLightGreen
                                            }]
                                        },
                                        options: {
                                            maintainAspectRatio: false,
                                            responsive: true,
                                            title: {
                                                display: false
                                            },
                                            legend: {
                                                display: false
                                            },
                                            scales: {
                                                xAxes: [{
                                                    gridLines: {
                                                        color: colorWhiteWithAlpha,
                                                        zeroLineColor: colorWhiteWithAlpha
                                                    },
                                                    ticks: {
                                                        fontColor: colorWhite,
                                                        maxRotation: 20,
                                                        minRotation: 20,
                                                        scaleBeginAtZero: true
                                                    }
                                                }],
                                                yAxes: [{
                                                    gridLines: {
                                                        color: colorWhiteWithAlpha,
                                                        zeroLineColor: colorWhiteWithAlpha
                                                    },
                                                    ticks: {
                                                        min: 30,
                                                        max: 70,
                                                        fontColor: colorWhite
                                                    },
                                                    scaleLabel: {
                                                        display: true,
                                                        labelString: 'dBA',
                                                        fontColor: colorWhite
                                                    }
                                                }]
                                            }
                                        }
                                    };
                                    var ln = document.getElementById(charId + "Ln").getContext('2d');
                                    replaceData(window[charId + "Ln"], timeArray, lnArray)
                                }

                                var temp = document.getElementById("more" + charId);

                                if (temp !== null) {
                                    temp.addEventListener("click", moreInfo, false);

                                    temp.dataObject = jsonObject[z][sensorName];
                                    temp.tag = arrTag;
                                    temp.senName = sensorName;
                                    temp.charId = charId;
                                    temp.demoVal = demoArrayVal;
                                    temp.demoTime = demoArrayTime;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ----------------------------------------------------------------------------------------------
    // Recalculate Max and Min values
    function recalculateValues(dataArray, sensorName) {
        var temp = document.getElementById("count" + sensorName);

        if (temp != null) {
            // COUNT
            temp.innerHTML = "Value: <b>" + dataArray.length + "</b>";

            // MAX AND MIN
            var max = null;
            var min = null;

            for (var i = 0; i < dataArray.length; i++) {
                if (dataArray[i] > max || max == null) {
                    max = dataArray[i];
                }

                if (dataArray[i] < min || min == null) {
                    min = dataArray[i];
                }
            }

            document.getElementById("max" + charId).innerHTML = "Maximum Value: <b>" + max + "</b>";
            document.getElementById("min" + charId).innerHTML = "Minimum Value: <b>" + min + "</b>";
        }
    }

// ----------------------------------------------------------------------------------------------
// Date Picker
    function datePicker(sensorName, chart) {
        var start = moment().subtract(29, 'days');
        var end = moment();

        function cb(start, end) {
            $('#reportrange span span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        }

        $('#reportrange').daterangepicker({
            startDate: start,
            endDate: end,
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        }, cb);

        cb(start, end);

        $('#reportrange').on('apply.daterangepicker', function (ev, picker) {
            getDataWithTime(picker.startDate.format('MMMM/D/YYYY'), picker.endDate.format('MMMM/D/YYYY'), sensorName, chart);
        });
    }

    function convertMonth(month) {
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        for (var index = 0; index < monthNames.length; index++) {
            if (monthNames[index] === month || monthNamesShort[index] === month) {
                return index;
            }
        }

        return -1;
    }

    function processDataBaseData(sensorName, z){
        var loc = null;
        var device = null;
        var distro = null;
        var unit = null;

        var arrVal = {};
        var arrTime = {};
        var arrTag = {};

        var demoArrayVal = {};
        var demoArrayTime = {};

        for (var i = 0; i < jsonObject[z][sensorName].length; i++) {
            var dataArray = jsonObject[z][sensorName][i].Data_Collected;

            loc = jsonObject[z][sensorName][i].Location;

            if(locArray[sensorName] === undefined){
                locArray[sensorName] = loc;
            }

            if(infoArray[sensorName] === undefined){
                locInfo = [];
                locInfo[loc] = {'Device': jsonObject[z][sensorName][i].Device, 'Distro': jsonObject[z][sensorName][i].Distro, 'Unit': jsonObject[z][sensorName][i].Unit, 'Max': null, 'Min': null, 'MaxTime': null, 'MinTime': null};
                infoArray[sensorName] = locInfo;
            }
            else{
                if(infoArray[sensorName][loc] === undefined){
                    infoArray[sensorName][loc] = {'Device': jsonObject[z][sensorName][i].Device, 'Distro': jsonObject[z][sensorName][i].Distro, 'Unit': jsonObject[z][sensorName][i].Unit, 'Max': null, 'Min': null, 'MaxTime': null, 'MinTime': null};
                }
            }
            

            if(dataArray !== undefined){
                var value = 0;
                var tempArrVal = [];
                var tempArrTime = [];
                var tempArrTag = [];

                for (var j = 0; j < dataArray.length; j++) {
                    for (var key in dataArray[j]) {
                        if (key !== "Time" && key !== "Tag") {
                            value = Number(dataArray[j][key]);
                            tempArrVal.push(Math.round(value * 100) / 100);
                            tempArrTime.push(dataArray[j].Time);
                        }
                        if (key === "Tag") {
                            tempArrTag.push(dataArray[j].Tag);
                        }
                    }
                }

                if(arrVal[loc] === undefined){
                    arrVal[loc] = tempArrVal;
                    arrTime[loc] = tempArrTime;
                    arrTag[loc] = tempArrTag;
                }
                else{
                    arrVal[loc] = arrVal[loc].concat(tempArrVal);
                    arrTime[loc] = arrTime[loc].concat(tempArrTime);
                    arrTag[loc] = arrTag[loc].concat(tempArrTag);
                }
            }

            if(arrVal[loc] != undefined){
                var max = Math.max(...arrVal[loc]);
                var min = Math.min(...arrVal[loc]);

                infoArray[sensorName][loc]['Max'] = max;
                infoArray[sensorName][loc]['Min'] = min;
                infoArray[sensorName][loc]['MaxTime'] = arrTime[loc][indexOfMax(arrVal[loc])];
                infoArray[sensorName][loc]['MinTime'] = arrTime[loc][indexOfMin(arrVal[loc])];
            }
        }


        for (var key in arrVal){
            var tempValJson = arrVal[key];
            var tempTimeJson = arrTime[key];
            var tempTagJson = arrTag[key];

            if (tempValJson.length > maxData) {
                var newArrVal = [];
                var newArrTime = [];
                var newArrTag = [];
                var demoNewArrVal = [];
                var demoNewArrTime = [];


                var lastVal = tempTimeJson[tempTimeJson.length - 1];
                var splitVal = lastVal.split(" ");

                var getDateFromVal = splitVal[0].split("/");
                var getHourFromVal = splitVal[1].split(":");

                var defaultDate = new Date(Number(getDateFromVal[2]), convertMonth(getDateFromVal[0]), Number(getDateFromVal[1]), Number(getHourFromVal[0]), Number(getHourFromVal[1]), Number(getHourFromVal[2]));
                var previousDate = new Date(Number(getDateFromVal[2]), convertMonth(getDateFromVal[0]), defaultDate.getDate() - 2, Number(getHourFromVal[0]), Number(getHourFromVal[1]), Number(getHourFromVal[2]));

                for (var i = 0; i < tempTimeJson.length; i++) {
                    var currentValue = tempTimeJson[i].split(" ");
                    var currentValueDate = currentValue[0].split("/");
                    var currentValueHour = currentValue[1].split(":");

                    var temp = new Date(Number(currentValueDate[2]), convertMonth(currentValueDate[0]), Number(currentValueDate[1]), Number(currentValueHour[0]), Number(currentValueHour[1]), Number(currentValueHour[2]));

                    if (Date.parse(temp) > Date.parse(previousDate) && Date.parse(temp) <= Date.parse(defaultDate)) {
                        newArrVal.push(tempValJson[i]);
                        newArrTime.push(tempTimeJson[i]);

                        if (tempTagJson.length > 0) {
                            newArrTag.push(tempTagJson[i]);
                        }
                    }
                }

                if (sensorName === "Sound") {
                    var newSoundVal = [];
                    var newSoundTime = [];

                    for (var i = 0; i < newArrVal.length; i++) {
                        var temp = i + 14;
                        var countVar = 0;
                        var sumVar = 0;

                        for (var j = i; j < temp; j++) {
                            if (newArrVal[j] !== undefined) {
                                sumVar += sumVar + Math.pow(10, 0.1 * newArrVal[j]);
                                countVar++;
                            }
                        }

                        newSoundVal.push(Math.round(10 * Math.log10(sumVar / countVar) * 100) / 100);
                        newSoundTime.push(newArrTime[i + countVar - 1]);

                        i = temp;
                    }

                    demoNewArrVal = newArrVal.slice(newArrVal.length - 60, newArrVal.length);
                    demoNewArrTime = newArrTime.slice(newArrTime.length - 60, newArrTime.length);

                    newArrVal = newSoundVal;
                    newArrTime = newSoundTime;
                }
                else {
                    var temp = 15;
                    var tempVal = [];
                    var tempTime = [];

                    for (var i = 0; i < newArrVal.length; i += temp) {
                        var val = 0;
                        var auxNaN = 0;
                        for (var j = i; j < (i + temp); j++) {
                            if (newArrVal[j] !== undefined) {
                                val = val + newArrVal[j];
                            }
                            else {
                                auxNaN = auxNaN + 1;
                            }
                        }

                        tempVal.push(Math.round((val / (temp - auxNaN)) * 100) / 100);
                        tempTime.push(newArrTime[i]);
                    }

                    demoNewArrVal = newArrVal.slice(newArrVal.length - 60, newArrVal.length);
                    demoNewArrTime = newArrTime.slice(newArrTime.length - 60, newArrTime.length);

                    newArrVal = tempVal;
                    newArrTime = tempTime;
                }


                arrVal[key] = newArrVal;
                arrTime[key] = newArrTime;
                arrTag[key] = newArrTag;
                demoArrayVal[key] = demoNewArrVal;
                demoArrayTime[key] = demoNewArrTime;
            }
        }

        return [arrVal, arrTime, arrTag, demoArrayVal, demoArrayTime];
    }

    // ----------------------------------------------------------------------------------------------
    // Draggable Panels
    jQuery(function($) {
        sortFrontPage()
    });

    function sortFrontPage(argument){
        var panelList = $('#pageContent');

        panelList.sortable({
            // Only make the .panel-heading child elements support dragging.
            // Omit this to make then entire <li>...</li> draggable. 
            update: function() {
                $('.panel', panelList).each(function(index, elem) {
                     var $listItem = $(elem),
                         newIndex = $listItem.index();

                     // Persist the new indices.
                });

                saveToDatabase(panelList);
            }
        });

        saveToDatabase(panelList);
    }

    function saveToDatabase(argument){
        var list = $(argument[0]).children();

        var toDB = [];
        var temp;

        // Go to each card
        for(var i = 0; i < list.length; i++){
            //Get top bar
            var topBar = $(list[i]).children(0);
            var topBarDepth = $($(topBar[0]).children(0)).children(0)
            //Get title
            var title = $(topBarDepth[0])[0];
            
            //Get sensor
            var sensor = $($($(topBarDepth[1])[0]).children()[2]);
            temp = {'Sensor': title.textContent.trim(), 'Location': $(sensor[0])[0].value, 'Order': i};
            toDB[i] = temp;
        }

        //SAVE TO DB
        if(toDB.length > 0 && user !== null){
            $.ajax({
                data: {
                    "data": JSON.stringify(toDB),
                    "token": readCookie("token")
                },
                type: 'POST',
                url: "/api/set_page",
                success: function(result) {
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    console.log(XMLHttpRequest);
                    console.log(textStatus);
                    console.log(errorThrown);
                }
            });
        }
    }

    // ----------------------------------------------------------------------------------------------
    // Indexes of Max and Min
    function indexOfMax(arr) {
        if (arr.length === 0) {
            return -1;
        }

        var max = arr[0];
        var maxIndex = 0;

        for (var i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                maxIndex = i;
                max = arr[i];
            }
        }

        return maxIndex;
    }

    function indexOfMin(arr) {
        if (arr.length === 0) {
            return -1;
        }

        var min = arr[0];
        var minIndex = 0;

        for (var i = 1; i < arr.length; i++) {
            if (arr[i] < min) {
                minIndex = i;
                min = arr[i];
            }
        }

        return minIndex;
    }


    function generateToken() {
        return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
    }

    function generateRandomOrder(){
        return Math.round(Math.random() * 10000000 / Math.random()) + 1000;
    }

    // ----------------------------------------------------------------------------------------------
    // From http://www.chartjs.org/docs/latest/developers/updates.html
    function replaceData(chart, label, value) {
        if(chart !== null){
            chart.data.labels = label;
            chart.data.datasets[0].data = value;
            chart.update();
        }
    }

    // Todo - Load Cache Values to save time
    window.onload = function () {
        jsonObject = JSON.parse(localStorage.getItem('JSON_OBJECT')) || undefined;

        setGraphs();
    };

    // Call program
    getSensorsData();
    setInterval(getSensorsData, updateInterval);
});