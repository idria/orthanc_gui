const fs = require('fs');
const axios = require('axios');
const https = require('https');
const { dialog } = require('electron');
const prompt = require('native-prompt')

const global = require('./global.js');

let config = global.getConfig();
let locale = global.getLocale(config);

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

// clean all values
document.getElementById("cleanButton").onclick = function () {
    document.getElementById("patName").value = "";
    document.getElementById("accessionNo").value = "";
    document.getElementById("patientId").value = "";
    document.getElementById("studyDate").value = "";
    document.getElementById("modality").value = locale.all;
}

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
function checkProgress(id) {
    axios.get(config.servers.store + '/jobs/' + id, {
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
                } else {
                    document.getElementById("progress").style = "width: " + res.data.Progress + "%";
                    if (res.data.ErrorCode) {
                        document.getElementById("progress").classList.add("bg-danger");
                        document.getElementById("studiesTable").removeAttribute("disabled", "");
                        alert(locale.sendError + res.data.ErrorDescription);
                    } else {
                        setTimeout(checkProgress(id), 5000);
                    }
                }
            }
        }
    }).catch(function (err) {
        document.getElementById("progress").classList.add("bg-danger");
        document.getElementById("studiesTable").removeAttribute("disabled", "");
        alert(locale.connectionError + err);
    });
}

// modify accession number
function changeAccesionNo(id) {
    if (config.change) {
        prompt("Orthanc GUI", locale.accessionNoLabel).then(text => {
            if (text) {
                axios.post(config.servers.query + '/studies/' + id + '/modify', {
                    "Replace": {
                        "AccessionNumber": text
                    }
                }, {
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false
                    })
                }).then(function (res) {
                    if (res.status == 200) {
                        alert(local.modified);
                        searchStudies();
                    }else{
                        alert(local.invalidResp);
                    }
                }).catch(function (err) {
                    alert(locale.connectionError + err);
                });
            }
        });
    } else {
        alert(locale.errChange);
    }
}

// delete study
function deleteStudy(id) {
    if (confirm(locale.deleteQuestion)) {
        axios.delete(config.servers.query + '/studies/' + id, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        }).then(function (res) {
            if (res.status == 200) {
                alert(locale.deleted);
                searchStudies();
            }else{
                alert(locale.invalidResp);
            }
        }).catch(function (err) {
            alert(locale.connectionError + err);
        });
    }
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

    if (confirm("Desea enviar el estudio seleccionado a " + exportDest)) {
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
                    checkProgress(res.data.ID);
                } else {
                    alert(locale.invalidResp);
                }
            }
        }).catch(function (err) {
            alert(locale.connectionError + err);
        });
    }
}

// open split page
function splitStudy(id) {
    window.location.href = "./split.html?id=" + id;
}

// search studies
function searchStudies() {
    blockForSeach();

    let inputName = document.getElementById("patName").value;
    let inputAccession = document.getElementById("accessionNo").value;
    let inputID = document.getElementById("patientId").value;
    let studyDate = document.getElementById("studyDate").value;
    let modality = document.getElementById("modality").value;

    let query = new Object();
    query["Level"] = "Study";
    query["Expand"] = true;
    query["Limit"] = 51;
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
        alert(locale.empty);
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
            let table = "";

            for (let i = 0; i < res.data.length; i++) {
                let study = global.readStudiesResp(res.data[i]);

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
                    for (let i = 0; i < res.length; i++) {
                        if (res[i].status == 200) {
                            if (res[i].data.MainDicomTags !== undefined) {
                                let modality = res[i].data.MainDicomTags.Modality;
                                if (!modsInStudy.includes(modality) && modality !== "PR") {
                                    modsInStudy.push(modality);
                                }
                            } else {
                                alert(locale.invalidResponse);
                            }
                        }
                    }
                    document.getElementById("MOD_" + study.studyHash).innerHTML = modsInStudy;
                })).catch(function (err) {
                    alert(locale.connectionError + err);
                    readyForSearch();
                    return;
                });

                // draw row
                table += '<tr>';
                table += '<th scope="row">' + i + '</th>';
                table += '<td>' + study.name + '</td>';
                table += '<td onclick="changeAccesionNo(' + "'" + study.studyHash + "'" + ');">' + study.accessionNo + '</td>';
                table += '<td>' + study.patientId + '</td>';
                table += '<td>' + study.studyDate + '</td>';
                table += '<td id="MOD_' + study.studyHash + '"></td>';
                table += '<td>' + study.description + '</td>';
                table += '<td>';
                table += '<button class="btn btn-primary" onclick="sendStudy(' + "'" + study.studyHash + "'" + ');" style="margin-right: 5px;">';
                table += locale.send + '</button>';
                table += '<button class="btn btn-primary" onclick="openStudy(' + "'" + study.studyHash + "'" + ');" style="margin-right: 5px;">';
                table += locale.open + '</button>';
                table += '<button class="btn btn-primary" onclick="splitStudy(' + "'" + study.studyHash + "'" + ');" style="margin-right: 5px;" ';
                table += ((config.split) ? '' : 'disabled') + '>' + locale.split + '</button>';
                table += '<button class="btn btn-danger" onclick="deleteStudy(' + "'" + study.studyHash + "'" + ');" style="margin-right: 5px;" ';
                table += ((config.delete) ? '' : 'disabled') + '>' + locale.delete + '</button>';
                table += '</td>';
                table += '</tr>';
            }

            readyForSearch();
            document.getElementById("studiesTableBody").innerHTML = table;
        }
    }).catch(function (err) {
        alert(locale.connectionError + err);
        readyForSearch();
    });
}

document.getElementById("searchButton").onclick = searchStudies;