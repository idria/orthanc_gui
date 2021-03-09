const axios = require('axios');
const https = require('https');

const global = require('./global.js');

let locale;
let config;

// disable and enable search buttons
function blockForSeach() {
    document.getElementById("searchLoading").removeAttribute("hidden", "");
    document.getElementById("searchButton").setAttribute("disabled", "");
}

function readyForSearch() {
    document.getElementById("searchLoading").setAttribute("hidden", "");
    document.getElementById("searchButton").removeAttribute("disabled", "");
}

// progress bar 
function checkProgress(jobID, oldStudyHash, newStudyHash) {
    axios.get(config.servers.store + '/jobs/' + jobID, {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).then(function (res) {
        if (res.status == 200) {
            if (res.data.Progress !== undefined) {
                if (res.data.Progress === 100) {
                    document.getElementById("progress").style = "width: 100%";
                    document.getElementById("progress").classList.add("bg-success");
                    document.getElementById("studiesTable").removeAttribute("disabled", "");

                    if(oldStudyHash) {
                        if (newStudyHash) {
                            document.getElementById("accessionNo").value = newStudyHash;
                        }
                        deleteStudy(null, oldStudyHash);
                    }
                } else {
                    document.getElementById("progress").style = "width: " + res.data.Progress + "%";
                    if (res.data.ErrorCode) {
                        document.getElementById("progress").classList.add("bg-danger");
                        document.getElementById("studiesTable").removeAttribute("disabled", "");
                        global.alert(locale.sendError + res.data.ErrorDescription);
                    } else {
                        setTimeout(checkProgress(jobID, oldStudyHash, newStudyHash), 5000);
                    }
                }
            }
        }
    }).catch(function () {
        document.getElementById("progress").classList.add("bg-danger");
        document.getElementById("studiesTable").removeAttribute("disabled", "");
        setTimeout(checkProgress(jobID, oldStudyHash, newStudyHash), 5000);
    });
}

// modify accession number
function changeAccesionNo(id) {
    if (config.changeAccessionNo) {
        global.prompt(locale.accessionNoLabel, (text) => {
            if (text) {
                // execute change
                axios.post(config.servers.store + '/studies/' + id + '/modify', {
                    "Asynchronous": true,
                    "Replace": {
                        "AccessionNumber": text.trim()
                    }
                }, {
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false
                    })
                }).then(function (res) {
                    if (res.data.ID !== undefined) {
                        // clean progress status
                        document.getElementById("progress").classList.remove("bg-success");
                        document.getElementById("progress").classList.remove("bg-danger");
                        document.getElementById("studiesTable").setAttribute("disabled", "");
                        // progress bar
                        checkProgress(res.data.ID, id, text.trim());
                        // send audit
                        let message = global.getStudy(globalStudies, id);
                        message.user = config.user;
                        message.action = 'changeAccessionNo';
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
        global.alert(locale.errChange);
    }
}

// modify patient id
function changePatientId(id) {
    if (config.changePatientId) {
        global.prompt(locale.patientIdLabel, (text) => {
            if (text) {
                // get study patient
                axios.get(config.servers.store + '/studies/' + id, {
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false
                    })
                }).then(function (res) {
                    if (res.status == 200) {
                        let patient = res.data.ParentPatient;

                        // search if patient has more studies
                        axios.get(config.servers.store + '/patients/' + patient, {
                            httpsAgent: new https.Agent({
                                rejectUnauthorized: false
                            })
                        }).then(function (res) {
                            if (res.data.Studies !== undefined) {
                                if (res.data.Studies.length == 1) {
                                    // modify patient id
                                    axios.post(config.servers.store + '/patients/' + patient + '/modify', {
                                        "Asynchronous": true,
                                        "Replace": {
                                            "PatientID": text.trim()
                                        },
                                        "Force":true
                                    }, {
                                        httpsAgent: new https.Agent({
                                            rejectUnauthorized: false
                                        })
                                    }).then(function (res) {
                                        if (res.data.ID !== undefined) {
                                            // clean progress status
                                            document.getElementById("progress").classList.remove("bg-success");
                                            document.getElementById("progress").classList.remove("bg-danger");
                                            document.getElementById("studiesTable").setAttribute("disabled", "");
                                            // progress bar
                                            checkProgress(res.data.ID, null, null);
                                            // send audit
                                            let message = global.getStudy(globalStudies, id);
                                            message.user = config.user;
                                            message.action = 'changePatientId';
                                            message.newValue = text.trim();
                                            global.sendAudit(config, message);
                                        } else {
                                            global.alert(locale.invalidResp);
                                        }
                                    }).catch(function (err) {
                                        global.alert(locale.connectionError + err);
                                    });
                                } else {
                                    global.alert(locale.errModifyPatient);
                                }
                            } else {
                                global.alert(locale.invalidResp);
                            }
                        }).catch(function (err) {
                            global.alert(locale.connectionError + err);
                        });
                    } else {
                        global.alert(locale.errChange);
                    }
                }).catch(function (err) {
                    global.alert(locale.connectionError + err);
                });
            }
        });
    } else {
        global.alert(locale.errChange);
    }
}

// delete study
function deleteStudy(elemnt, id) {
    global.confirm(locale.deleteQuestion, (value) => {
        if (value) {
            if (elemnt) {
                elemnt.setAttribute("disabled", "");
            }
    
            axios.delete(config.servers.store + '/studies/' + id, {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            }).then(function (res) {
                if (res.status == 200) {
                    global.alert(locale.deleted);
                    showStudies();
    
                    // send audit
                    let message = global.getStudy(globalStudies, id);
                    message.user = config.user;
                    message.action = 'deleteStudy';
                    global.sendAudit(config, message);
                }else{
                    global.alert(locale.invalidResp);
                    if (elemnt) {
                        elemnt.removeAttribute("disabled", "");
                    }
                }
            }).catch(function (err) {
                global.alert(locale.connectionError + err);
            });
        }
    });
}

// open osimis viewer
function openStudy(id) {
    window.open(config.servers.viewer + "/osimis-viewer/app/index.html?study=" + id, '_blank', 'nodeIntegration=no');
}

// send to registered modality
function sendStudy(id) {
    let exportDest = document.getElementById("export").value;

    let destOrthanc = "";
    for (let i = 0; i < config.destinations.length; i++) {
        if (config.destinations[i].label == exportDest) {
            destOrthanc = config.destinations[i].name;
        }
    }

    global.confirm(locale.sendStudyConfirm + exportDest, (value) => {
        if (value) {
            axios.post(config.servers.store + '/modalities/' + destOrthanc + '/store', {
                "Asynchronous": true,
                "Permissive": true,
                "Resources": [id],
            }, {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            }).then(function (res) {
                if (res.status == 200) {
                    if (res.data.ID !== undefined) {
                        // clean progress status
                        document.getElementById("progress").classList.remove("bg-success");
                        document.getElementById("progress").classList.remove("bg-danger");
                        document.getElementById("studiesTable").setAttribute("disabled", "");
                        // progress bar
                        checkProgress(res.data.ID, null, null);
                        // send audit
                        // let message = global.getStudy(globalStudies, id);
                        // message.user = config.user;
                        // message.action = 'sendStudy';
                        // global.sendAudit(config, message);
                    } else {
                        global.alert(locale.invalidResp);
                    }
                }
            }).catch(function (err) {
                global.alert(locale.connectionError + err);
            });
        }
    });
}

// open split page
function splitStudy(id) {
    let link = "./split.html?id=" + id;
    link += "&patName=" + document.getElementById("patName").value.trim();
    link += "&accessionNo=" + document.getElementById("accessionNo").value.trim();
    link += "&patientId=" + document.getElementById("patientId").value.trim();
    link += "&studyDate=" + document.getElementById("studyDate").value.trim();
    link += "&modality=" + document.getElementById("modality").value.trim();
    window.location.href = link;
}

// search studies
function searchStudies(cbOk) {
    blockForSeach();

    let inputName = document.getElementById("patName").value.trim();
    let inputAccession = document.getElementById("accessionNo").value.trim();
    let inputID = document.getElementById("patientId").value.trim();
    let studyDate = document.getElementById("studyDate").value.trim();
    let modality = document.getElementById("modality").value.trim();

    let query = new Object();
    query["Level"] = "Study";
    query["Expand"] = true;
    query["Limit"] = config.limit;
    query["Query"] = new Object();

    if (inputName !== "") {
        query.Query["PatientName"] = "*" + inputName + "*";
    }

    if (inputAccession !== "") {
        query.Query["AccessionNumber"] = inputAccession;
    }

    if (inputID !== "") {
        query.Query["PatientID"] = inputID;
    }

    if (studyDate !== "") {
        let chunks = studyDate.split("/");
        query.Query["StudyDate"] = chunks[2] + chunks[1] + chunks[0] + "-" + chunks[2] + chunks[1] + chunks[0];
    }

    if (Object.keys(query["Query"]).length === 0) {
        global.alert(locale.empty);
        readyForSearch();
        return;
    }

    if (modality !== locale.all) {
        query.Query["Modality"] = modality;
    }

    axios.post(config.servers.query + '/tools/find',
        query, {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).then(function (res) {
        if (res.status == 200) {
            readyForSearch();
            cbOk(res);
        }
    }).catch(function (err) {
        global.alert(locale.connectionError + err);
        readyForSearch();
    });
}

function showStudies() {
    searchStudies(function(res) {
        let table = "";
        globalStudies = [];

        for (let i = 0; i < res.data.length; i++) {
            let study = global.readStudiesResp(res.data[i]);

            // send to elastic
            let elasticStudy = Object.assign({}, study);
            delete elasticStudy.studyDate;
            globalStudies.push(elasticStudy);

            // render modalities async
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
                let modsInStudy = [];
                let stationName = '';
                for (let i = 0; i < res.length; i++) {
                    if (res[i].status == 200) {
                        if (res[i].data.MainDicomTags !== undefined) {
                            let modality = res[i].data.MainDicomTags.Modality;
                            stationName = res[i].data.MainDicomTags.StationName;
                            if (!modsInStudy.includes(modality) && modality !== "PR") {
                                modsInStudy.push(modality);
                            }
                        }
                    }
                }
                document.getElementById("MOD_" + study.studyHash).innerHTML = modsInStudy;
                global.addStudyObj(globalStudies, study.studyHash, "modInStudy", modsInStudy);
                global.addStudyObj(globalStudies, study.studyHash, "stationName", stationName);

            })).catch(function (err) {
                global.alert(locale.connectionError + err);
                readyForSearch();
                return;
            });

            // draw row
            table += '<tr>';
            table += '<th scope="row">' + i + '</th>';
            table += '<td>' + study.name + '</td>';
            table += '<td onclick="changeAccesionNo(' + "'" + study.studyHash + "'" + ');">' + study.accessionNo + '</td>';
            table += '<td onclick="changePatientId(' + "'" + study.studyHash + "'" + ');">' + study.patientId + '</td>';
            table += '<td>' + study.studyDate + '</td>';
            table += '<td id="MOD_' + study.studyHash + '"></td>';
            table += '<td>' + study.description + '</td>';
            table += '<td>';
            table += '<button class="btn btn-primary" onclick="sendStudy(' + "'" + study.studyHash + "'" + ');" style="margin-right: 5px;">';
            table += locale.send + '</button>';
            table += '<button class="btn btn-primary" onclick="openStudy(' + "'" + study.studyHash + "'" + ');" style="margin-right: 5px;">';
            table += locale.open + '</button>';
            table += '<button class="btn btn-primary" onclick="splitStudy(' + "'" + study.studyHash + "'" + ');" style="margin-right: 5px;">';
            table += locale.series + '</button>';
            table += '<button class="btn btn-danger" onclick="deleteStudy(this, ' + "'" + study.studyHash + "'" + ');" style="margin-right: 5px;" ';
            table += ((config.delete) ? '' : 'disabled') + '>' + locale.delete + '</button>';
            table += '</td>';
            table += '</tr>';
        }

        document.getElementById("studiesTableBody").innerHTML = table;
    });
}

global.getConfig((inputConfig) => {
    let globalStudies = [];
    config = inputConfig;
    locale = global.getLocale(config);
    
    // destinations
    for (let i = 0; i < config.destinations.length; i++) {
        document.getElementById("export").innerHTML += "<option>" + config.destinations[i].label + "</option>";
    }

    // setup locale names
    document.getElementById("patNameLabel").innerHTML = locale.patientName;
    document.getElementById("colNameLabel").innerHTML = locale.patientName;
    document.getElementById("accessionNoLabel").innerHTML = locale.accessionNo;
    document.getElementById("colAccessionNoLabel").innerHTML = locale.accessionNo;
    document.getElementById("patientIdLabel").innerHTML = locale.patientId;
    document.getElementById("colPatientIdLabel").innerHTML = locale.patientId;
    document.getElementById("studyDateLabel").innerHTML = locale.studyDate + " " + locale.studyDateFormat;
    document.getElementById("colStudyDateLabel").innerHTML = locale.studyDate;
    document.getElementById("modalityLabel").innerHTML = locale.modality;
    document.getElementById("colModalityLabel").innerHTML = locale.modality;
    document.getElementById("colDescription").innerHTML = locale.desc;
    document.getElementById("all").innerHTML = locale.all;
    document.getElementById("searchLabel").innerHTML = locale.search;
    document.getElementById("cleanButton").innerHTML = locale.clean;
    document.getElementById("destLabel").innerHTML = locale.dest;
    document.getElementById("exportButton").innerHTML = locale.exportLabel;

    // fill with params
    let patName = global.getParams("patName");
    let accessionNo = global.getParams("accessionNo");
    let patientId = global.getParams("patientId");
    let studyDate = global.getParams("studyDate");
    let modality = global.getParams("modality");

    document.getElementById("patName").value = patName;
    document.getElementById("accessionNo").value = accessionNo;
    document.getElementById("patientId").value = patientId;
    document.getElementById("studyDate").value = studyDate;
    if (modality) {
        document.getElementById("modality").value = modality;
    }

    if (patName || accessionNo || patientId || studyDate) {
        showStudies();
    }

    // clean all values
    document.getElementById("cleanButton").onclick = function () {
        document.getElementById("patName").value = "";
        document.getElementById("accessionNo").value = "";
        document.getElementById("patientId").value = "";
        document.getElementById("studyDate").value = "";
        document.getElementById("modality").value = locale.all;
    }

    // audit server ping test
    if (config.audit) {
        blockForSeach();

        global.sendAudit(config, "", () => {
            readyForSearch();
        }, () => {
            global.alert(locale.auditConnectionError);
        });
    }

    axios.get(config.audit, {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).then(function (res) {
        if (res.status == 200) {
            readyForSearch();
        }
    }).catch(function () {
        global.alert(locale.auditConnectionError);
    });

    document.getElementById("searchButton").onclick = showStudies;

    document.getElementById("exportButton").onclick = function() {
        searchStudies(function(res) {
            let file = "Name,Patient ID,Accession No,Study Date, Description\n";
            for (let i = 0; i < res.data.length; i++) {
                let study = global.readStudiesResp(res.data[i]);
                file += study.name.trim() + "," + study.patientId.trim() + "," + study.accessionNo.trim() + ",";
                file += study.studyDate + "," + study.description.trim() + "\n";
            }

            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(file));
            element.setAttribute('download', 'orthanc_export.csv');
        
            element.style.display = 'none';
            document.body.appendChild(element);
        
            element.click();
        
            document.body.removeChild(element);
        });
    }
}, () => {
    global.alert(mainLocale['es'].invalidConfiguration);
});
