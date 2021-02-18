const fs = require('fs');
const axios = require('axios');
const https = require('https');
const { dialog } = require('electron');
const prompt = require('native-prompt')

const global = require('./global.js');

let config = global.getConfig();
let locale = global.getLocale(config);

window.onload = function() {
    axios.get(config.servers.query + '/studies/' + global.getParams("id"), {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).then(function (res) {
        if (res.status == 200) {
            // setup return button
            document.getElementById("returnButton").innerHTML = locale.ret;
            document.getElementById("returnButton").onclick = function() {
                window.location.href = "./index.html";
            }

            // studies level
            let study = global.readStudiesResp(res.data);

            document.getElementById("accessionNo").innerHTML = locale.accessionNo + ': ' + study.accessionNo;
            document.getElementById("patientName").innerHTML = locale.patName + ': ' + study.name;
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


                    }
                }
            })).catch(function (err) {
                alert(locale.connError + err);
            });
        }
    }).catch(function (err) {
        alert(err);
    });
};

//document.getElementById(id).innerHTML 