const axios = require('axios');
const https = require('https');

const global = require('./global.js');

let locale;
let config;

window.onload = function () {
    let globalStudy = {};

    // load series
    axios.get(config.servers.query + '/studies/' + global.getParams("id"), {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).then(function (res) {
        if (res.status == 200) {
            let table = "";

            // setup return button
            document.getElementById("returnButton").innerHTML = locale.ret;
            document.getElementById("returnButton").onclick = function () {
                let link = "./index.html?patName=" + global.getParams("patName");
                link += "&accessionNo=" + global.getParams("accessionNo");
                link += "&patientId=" + global.getParams("patientId");
                link += "&studyDate=" + global.getParams("studyDate");
                link += "&modality=" + global.getParams("modality");
                window.location.href = link;
            }

            // studies level
            let study = global.readStudiesResp(res.data);
            globalStudy = study;

            document.getElementById("accessionNo").innerHTML = locale.accessionNo + ': ' + study.accessionNo;
            document.getElementById("patientName").innerHTML = locale.patientName + ': ' + study.name;
            document.getElementById("patientId").innerHTML = locale.patientId + ': ' + study.patientId;
            document.getElementById("studyDate").innerHTML = locale.studyDate + ': ' + study.studyDate;
            document.getElementById("studyDesc").innerHTML = locale.desc + ': ' + study.description;

            // series level
            let allGets = [];
            for (let i = 0; i < study.series.length; i++) {
                allGets.push(
                    axios.get(config.servers.query + '/series/' + study.series[i], {
                        httpsAgent: new https.Agent({
                            rejectUnauthorized: false
                        })
                    })
                );
            }

            axios.all(allGets).then(axios.spread(function (...res) {
                for (let i = 0; i < res.length; i++) {
                    if (res[i].status == 200) {
                        let series = global.readSeriesResp(res[i].data);

                        // draw row
                        table += '<tr>';
                        table += '<td>' + series.seriesNo + '</td>';
                        table += '<td>' + series.seriesDescription + '</td>';
                        table += '<td>' + series.bodyPartExamined + '</td>';
                        table += '<td>' + series.modality + '</td>';
                        table += '<td>' + series.protocolName + '</td>';
                        table += '<td>' + series.seriesDate + '</td>';
                        table += '<td>' + series.seriesTime + '</td>';
                        table += '<td>' + series.stationName + '</td>';
                        table += '<td><input type="checkbox" class="checkGroup form-check-input" name="' + series.seriesHash + '"></td>';
                        table += '</tr>';
                    }
                }

                document.getElementById("seriesTableBody").innerHTML = table;
            })).catch(function (err) {
                global.alert(locale.connectionError + err);
            });
        }
    }).catch(function (err) {
        global.alert(err);
    });

    // setup split button
    document.getElementById("splitButton").onclick = function () {
        let checks = document.getElementsByClassName("checkGroup");
        let splitSeries = [];

        for (var i = 0; i < checks.length; i++) {
            if (checks[i].checked) {
                splitSeries.push(checks[i].name);
            }
        }

        if (splitSeries.length > 0) {
            global.prompt(locale.accessionNoLabel, (text) => {
                if (text) {
                    axios.post(config.servers.store + '/studies/' + global.getParams("id") + '/split', {
                        "Series": splitSeries,
                        "Replace": {
                            "AccessionNumber": text.trim()
                        }
                    }, {
                        httpsAgent: new https.Agent({
                            rejectUnauthorized: false
                        })
                    }).then(function (res) {
                        if (res.status == 200) {
                            global.alert(locale.modified);
                            // send audit
                            let message = globalStudy;
                            message.user = config.user;
                            message.action = 'splitStudy';
                            message.newValue = text.trim();
                            global.sendAudit(config, message);
                        } else {
                            global.alert(locale.invalidResp);
                        }
                    }).catch(function (err) {
                        global.alert(locale.connectionError + err);
                    });
                }
            });
        } else {
            global.alert(locale.noSelection);
        }
    }

    // setup delete button
    document.getElementById("deleteButton").onclick = function() {
        let checks = document.getElementsByClassName("checkGroup");
        let deleteSeries = [];

        for (var i = 0; i < checks.length; i++) {
            if (checks[i].checked) {
                deleteSeries.push(checks[i].name);
            }
        }

        if (deleteSeries.length === 0) {
            global.alert(locale.noSelection);
        } else if (deleteSeries.length === 1) {
                        global.confirm(locale.deleteQuestionSeries, (value) => {
                if (value) {
                    axios.delete(config.servers.store + '/series/' + deleteSeries[0], {
                        httpsAgent: new https.Agent({
                            rejectUnauthorized: false
                        })
                    }).then(function (res) {
                        if (res.status == 200) {
                            global.alert(locale.deleted);
                        }else{
                            global.alert(locale.invalidResp);
                        }
                    }).catch(function (err) {
                        global.alert(locale.connectionError + err);
                    });
                }
            });
        } else {
            global.alert(locale.onlyOneSelection);
        }
    }
}; 

global.getConfig((inputConfig) => {
    config = inputConfig;
    locale = global.getLocale(config);

    // setup locale names
    document.getElementById("colSeriesNoLabel").innerHTML = locale.seriesNo;
    document.getElementById("colSeriesDescLabel").innerHTML = locale.seriesDesc;
    document.getElementById("colBodyPartExaminedLabel").innerHTML = locale.bodyPartExamined;
    document.getElementById("colModalityLabel").innerHTML = locale.modality;
    document.getElementById("colProtocolName").innerHTML = locale.protocolName;
    document.getElementById("colSeriesDate").innerHTML = locale.seriesDate;
    document.getElementById("colSeriesTime").innerHTML = locale.seriesTime;
    document.getElementById("colStationName").innerHTML = locale.stationName;
    document.getElementById("splitButton").innerHTML = locale.split;
    document.getElementById("deleteButton").innerHTML = locale.delete;
    document.getElementById("splitMessage").innerHTML = locale.splitMessage;

    if (!config.split) {
        document.getElementById("splitButton").setAttribute("disabled", "");
    }
}, (err) => {
    console.log(err);
});
