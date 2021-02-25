const mainLocale = require('./locale.js');
const fs = require('fs');

var prompt = function(message, callback) {
    vex.dialog.confirm({
        message: message,
        input: [
            '<input name="data" type="text" placeholder="" required />',
        ].join(''),
        callback: function (value) {
            callback(value.data);
        }
    });
};

var alert = function(message) {
    vex.dialog.alert(message);
};

var confirm = function(message, callback) {
    vex.dialog.confirm({
        message: message,
        callback: function (value) {
            callback(value);
        }
    });
};

exports.prompt = prompt;
exports.alert = alert;
exports.confirm = confirm;

exports.getConfig = function (cbOk, cbErr) {
    try {
        let configPath = fs.readFileSync('./config.path');
        let config = JSON.parse(fs.readFileSync(configPath));

        if(config.user == undefined) {
            prompt('Enter user name:', (value) => {
                if (value) {
                    config.user = value;
                    fs.writeFileSync(configPath, JSON.stringify(config));
                    if (cbOk) { 
                        cbOk(config);
                    }
                } else {
                    if (cbErr) { 
                        cbErr();
                    }
                }
            });
        } else {
            if (cbOk) { 
                cbOk(config);
            }
        }
    } catch (err) {
        if (cbErr) { 
            cbErr();
        }
    }
};

exports.getLocale = function (config) {
    if (config == undefined) {
        return mainLocale['es'];
    } else {
        return mainLocale[config.locale];
    }
};

exports.getParams = function (name) {
    let url = new URL(window.location.href);
    return url.searchParams.get(name);
};

exports.readStudiesResp = function (resp) {
    let studyHash = "";
    let name = "";
    let accessionNo = "";
    let institutionName = "";
    let patientId = "";
    let studyDate = "";
    let description = "";
    let series = [];
    let elasticStudyDateTime = "";

    if (resp.ID !== undefined) {
        studyHash = resp.ID;
    }

    if (resp.PatientMainDicomTags !== undefined) {
        if (resp.PatientMainDicomTags.PatientName !== undefined) {
            name = resp.PatientMainDicomTags.PatientName.replaceAll("^", " ");
        }
        if (resp.PatientMainDicomTags.PatientID !== undefined) {
            patientId = resp.PatientMainDicomTags.PatientID;
        }
    }

    if (resp.MainDicomTags !== undefined) {
        if (resp.MainDicomTags.AccessionNumber !== undefined) {
            accessionNo = resp.MainDicomTags.AccessionNumber;
        }
        if (resp.MainDicomTags.InstitutionName !== undefined) {
            institutionName = resp.MainDicomTags.InstitutionName;
        }
        if (resp.MainDicomTags.StudyDate !== undefined) {
            let date = resp.MainDicomTags.StudyDate;
            if (date !== "") {
                studyDate = date.substr(6, 2) + '/' + date.substr(4, 2) + '/' + date.substr(0, 4);
                elasticStudyDateTime = date.substr(0, 4) + '-' + date.substr(4, 2) + '-' + date.substr(6, 2);

                if (resp.MainDicomTags.StudyTime !== undefined) {
                    let time = resp.MainDicomTags.StudyTime;
                    elasticStudyDateTime = elasticStudyDateTime + 'T' + time.substr(0, 2) + ':' + time.substr(2, 2) + ':' + time.substr(4, 2) + 'Z';
                } else {
                    elasticStudyDateTime = elasticStudyDateTime + 'T00:00:00Z';
                }
            }
        }
        if (resp.MainDicomTags.StudyDescription !== undefined) {
            description = resp.MainDicomTags.StudyDescription;
        }
    }

    if (resp.Series !== undefined) {
        series = resp.Series;
    }

    return {
        studyHash: studyHash,
        name: name,
        accessionNo: accessionNo,
        institutionName: institutionName,
        patientId: patientId,
        studyDate: studyDate,
        elasticStudyDateTime: elasticStudyDateTime,
        description: description,
        series: series
    };
};

exports.readSeriesResp = function (resp) {
    let seriesHash = '';
    let bodyPartExamined = '';
    let modality = '';
    let seriesDescription = '';
    let seriesNo = '';
    let stationName = '';

    if (resp.ID !== undefined) {
        seriesHash = resp.ID;
    }

    if (resp.MainDicomTags !== undefined) {
        if (resp.MainDicomTags.BodyPartExamined !== undefined) {
            bodyPartExamined = resp.MainDicomTags.BodyPartExamined;
        }

        if (resp.MainDicomTags.Modality !== undefined) {
            modality = resp.MainDicomTags.Modality;
        }

        if (resp.MainDicomTags.SeriesDescription !== undefined) {
            seriesDescription = resp.MainDicomTags.SeriesDescription;
        }

        if (resp.MainDicomTags.SeriesNumber !== undefined) {
            seriesNo = resp.MainDicomTags.SeriesNumber;
        }

        if (resp.MainDicomTags.StationName !== undefined) {
            stationName = resp.MainDicomTags.StationName;
        }
    }

    return {
        seriesHash: seriesHash,
        bodyPartExamined: bodyPartExamined,
        modality: modality,
        seriesDescription: seriesDescription,
        seriesNo: seriesNo,
        stationName: stationName
    };
};

exports.sendAudit = function (config, message, cbOk, cbError) {
    axios.post(config.audit, message, {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).then(function (res) {
        if (res.status == 200) {
            if (cbOk) { cbOk(); }
        }
    }).catch(function () {
        if (cbError) { cbError(); }
    });
};

exports.getStudy = function (global, hash) {
    for (let i = 0; i < global.length; i++) {
        if (global[i].studyHash == hash) {
            return global[i];
        }
    }

    return {};
};

exports.addStudyObj = function (global, hash, name, data) {
    for (let i = 0; i < global.length; i++) {
        if (global[i].studyHash == hash) {
            global[i][name] = data;
        }
    }
};