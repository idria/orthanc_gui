const mainLocale = require('./locale.js');
const defaultConfig = require('./defaultConfig.js').config;

exports.getConfig = function() {
    try {
        return JSON.parse(fs.readFileSync('./config.json'));
    } catch (err1) {
        alert(mainLocale['es'].invalidConfiguration);
    
        // if missing create new file
        if (!fs.existsSync('./config.json')) {
            try {
                fs.writeFileSync('./config.json', JSON.stringify(defaultConfig));
                return JSON.parse(fs.readFileSync('./config.json'));
            } catch (err2) {
                alert(mainLocale['es'].invalidNew);
            }
        }
    }
};

exports.getLocale = function(config) {
    return mainLocale[config.locale];
};

exports.getParams = function(name) {
    let url = new URL(window.location.href);
    return url.searchParams.get(name);
};

exports.readStudiesResp = function(resp) {
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

exports.readSeriesResp = function(resp) {
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

exports.sendAudit = function(config, message, cbOk, cbError) {
    axios.post(config.audit, message, {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).then(function (res) {
        if (res.status == 200) {
            if(cbOk) { cbOk(); }
        }
    }).catch(function () {
        if(cbError) { cbError(); }
    });
};

exports.getStudy = function(global, hash) {
    for(let i=0;i<global.length;i++) {
        if (global[i].studyHash == hash) {
            return global[i];
        }
    }

    return {};
};

exports.addStudyObj = function(global, hash, name, data) {
    for(let i=0;i<global.length;i++) {
        if(global[i].studyHash == hash) {
            global[i][name] = data;
        }
    }
};