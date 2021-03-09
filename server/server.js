////////////////////////////////////////////////////////////
const host = '0.0.0.0';
const port = 9201;
const elasticPath = 'http://127.0.0.1:9200';
////////////////////////////////////////////////////////////

var http = require('http');
var axios = require('axios');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

Array.prototype.remove = function(item) {
    for (let i = 0; i < this.length; i++) {
        if (this[i] === item) {
            this.splice(i, 1);
        }
    }
}

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        new winston.transports.Console(),
        new DailyRotateFile({
            filename: 'application-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ],
});
  
const requestListener = function (request, response) {
    let body = [];

    request.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        let message = '';

        try {
            body = Buffer.concat(body).toString();
            message = JSON.parse(body);

            if (message.modsInStudy) {
                if (message.modsInStudy.length > 0) {
                    let mods = message.modsInStudy;
                    mods = mods.remove('PR');
                    mods = mods.remove('SC');
                    mods = mods.remove('SR');
                    message.modsInStudy = mods[0];
                }
            }
        } catch(err) {
            logger.log('info', 'Body empty.');
        }

        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1;
        var year = dateObj.getUTCFullYear();

        if (message != '') {
            // send to elastic
            axios.post(elasticPath+'/orthancgui-'+ year + '-' + month +'/_doc/', message)
            .then(function () {
                logger.log('info', 'Send message!');
            })
            .catch(function (error) {
                logger.log('error', error);
            });
        }
    });

    response.writeHead(200);
    response.end("Ok");
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    logger.log('info', 'Audit server is running!');
});