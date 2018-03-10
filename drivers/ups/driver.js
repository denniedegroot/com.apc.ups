'use strict';

const Homey = require('homey');
const Driver = require('../../lib/Driver.js');

let foundDevices = [];

class DriverUPS extends Driver {

    _onPairSearchDevices(data, callback) {
        this.log('_onPairSearchDevices', data);

        let device = {};
        device.data = {};
        foundDevices = [];

        if (data.ip === '' || data.port === '') {
            return callback(null, null);
        }

        Homey.app.getDevice(data.ip, data.port, (error, result) => {
            if (error) {
                return callback(this.error(error));
            }

            let items = result.split('\n\x00');
            let values = ['upsname', 'serialno', 'model', 'nompower'];

            items.forEach((line) => {
                let item = line.substring(1).split(' : ');
                let label = item[0].toLowerCase().trim();

                if (values.indexOf(label) > -1) {
                    if (label === 'model') {
                        device.data[label] = item[1].trim();
                    } else {
                        device.data[label] = item[1].trim().split(' ')[0];
                    }
                }
            });

            Promise.all(items).then((results) => {
                foundDevices.push({
                    name: device.data.upsname,
                    data: {
                        id: device.data.serialno,
                        ip: data.ip,
                        port: data.port,
                        model: device.data.model,
                        nompower: device.data.nompower
                    }
                });

                callback(null, foundDevices);
            });
        });
    }

    _onPairListDevices(data, callback) {
        this.log('_onPairListDevices');
        callback(null, foundDevices);
    }

}

module.exports = DriverUPS;
