const mainLocale = require('./locale.js');
const defaultConfig = require('./defaultConfig.js').config;

exports.getConfig = function() {
    try {
        return JSON.parse(fs.readFileSync('./config.json'));
    } catch (err1) {
        alert(mainLocale['es'].invalidConfig);
    
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
    let patientId = "";
    let studyDate = "";
    let description = "";
    let series = [];

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
        if (resp.MainDicomTags.StudyDate !== undefined) {
            let date = resp.MainDicomTags.StudyDate;
            if (date !== "") {
                studyDate = date.substr(6, 2) + '/' + date.substr(4, 2) + '/' + date.substr(0, 4);
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
        patientId: patientId,
        studyDate: studyDate,
        description: description,
        series: series
    };
};

exports.readSeriesResp = function(resp) {
    let bodyPartExamined = '';
    let modality = '';
    let seriesDescription = '';
    let seriesNumber = '';
    let stationName = '';

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
            seriesNumber = resp.MainDicomTags.SeriesNumber;
        }

        if (resp.MainDicomTags.StationName !== undefined) {
            stationName = resp.MainDicomTags.StationName;
        }
    }

    return {
        bodyPartExamined: bodyPartExamined,
        modality: modality,
        seriesDescription: seriesDescription,
        seriesNumber: seriesNumber,
        stationName: stationName
    };
};