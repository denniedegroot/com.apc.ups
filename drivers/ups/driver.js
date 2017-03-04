"use strict";

const Driver = require('../../lib/Driver.js');

let foundDevices = [];
const refreshDevicesTimeout = 10000;

const modelMap = {
    'Back-UPS ES 325G': '185',
    'Back-UPS ES 550G': '330',
    'Back-UPS ES 700G': '405'
}

class DriverUPS extends Driver {

    constructor() {
        super();

        this._deviceType = 'ups';
        this.capabilities = {};

        setInterval(this._syncDevices.bind(this), refreshDevicesTimeout);

        this.capabilities.alarm_battery = {};
        this.capabilities.alarm_battery.get = this._onExportsCapabilitiesAlarmBatteryGet.bind(this);

        this.capabilities.measure_battery = {};
        this.capabilities.measure_battery.get = this._onExportsCapabilitiesBatteryGet.bind(this);

        this.capabilities.measure_power = {};
        this.capabilities.measure_power.get = this._onExportsCapabilitiesPowerGet.bind(this);

        this.capabilities['measure_voltage.power'] = {};
        this.capabilities['measure_voltage.power'].get = this._onExportsCapabilitiesVoltagePowerGet.bind(this);

        this.capabilities['measure_voltage.battery'] = {};
        this.capabilities['measure_voltage.battery'].get = this._onExportsCapabilitiesVoltageBatteryGet.bind(this);
    }

    _syncDevices() {
        this.debug('_syncDevices');

        let devices = this.getDevices();

        for (let i in devices) {
            let device = devices[i];
            this.debug('_syncDevice', device.data.id);

            Homey.app.getDevice(device.data.ip, device.data.port, (error, result) => {
                if (error) {
                    return this.error(error);
                }

                let items = result.split('\n\x00');
                let values = ['linev', 'loadpct', 'battv', 'bcharge', 'timeleft'];
                let capabilityname = ['measure_voltage.power', 'measure_power', 'measure_voltage.battery', 'measure_battery', 'measure_timeleft'];

                items.forEach((line) => {
                    let item = line.substring(1).split(' : ');
                    let label = item[0].toLowerCase().trim();

                    if (values.indexOf(label) > -1) {
                        device.state[capabilityname[values.indexOf(label)]] = Number(item[1].trim().split(' ')[0]);
                    }
                });

                Promise.all(items).then((results) => {
                    if (device.state['measure_voltage.power'] > 50) {
                        device.state.alarm_battery = false;
                    } else {
                        device.state.alarm_battery = true;
                    }

                    if (typeof modelMap[device.data.model] === 'string') {
                        device.state.measure_power = Number(modelMap[device.data.model]) / 100 * device.state.measure_power;
                    } else {
                        device.state.measure_power = device.data.nompower / 100 * device.state.measure_power;
                    }

                    module.exports.realtime(device.data, 'alarm_battery', device.state.alarm_battery);
                    module.exports.realtime(device.data, 'measure_battery', device.state.measure_battery);
                    module.exports.realtime(device.data, 'measure_power', device.state.measure_power);
                    module.exports.realtime(device.data, 'measure_voltage.power', device.state['measure_voltage.power']);
                    module.exports.realtime(device.data, 'measure_voltage.battery', device.state['measure_voltage.battery']);
                });

            });
        }
    }

    _onExportsPairSearchDevices(data, callback) {
        this.debug('_onExportsPairSearchDevices', data);

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
                device.name = device.data.upsname;
                device.data.id = device.data.serialno;
                device.data.ip = data.ip;
                device.data.port = data.port;

                foundDevices.push(device);

                callback(null, foundDevices);
            });
        });
    }

    _onExportsPairListDevices(data, callback) {
        this.debug('_onExportsPairListDevices');

        callback(null, foundDevices);
    }

    _onExportsCapabilitiesAlarmBatteryGet(device_data, callback) {
        this.debug('_onExportsCapabilitiesAlarmBatteryGet', device_data.id);

        let device = this.getDevice(device_data);

        if (device instanceof Error) {
            return callback(device);
        }

        callback(null, device.state.alarm_battery);
    }

    _onExportsCapabilitiesBatteryGet(device_data, callback) {
        this.debug('_onExportsCapabilitiesBatteryGet', device_data.id);

        let device = this.getDevice(device_data);

        if (device instanceof Error) {
            return callback(device);
        }

        callback(null, device.state.measure_battery);
    }

    _onExportsCapabilitiesPowerGet(device_data, callback) {
        this.debug('_onExportsCapabilitiesPowerGet', device_data.id);

        let device = this.getDevice(device_data);

        if (device instanceof Error) {
            return callback(device);
        }

        callback(null, device.state.measure_power);
    }

    _onExportsCapabilitiesVoltagePowerGet(device_data, callback) {
        this.debug('_onExportsCapabilitiesVoltagePowerGet', device_data.id);

        let device = this.getDevice(device_data);

        if (device instanceof Error) {
            return callback(device);
        }

        callback(null, device.state['measure_voltage.power']);
    }

    _onExportsCapabilitiesVoltageBatteryGet(device_data, callback) {
        this.debug('_onExportsCapabilitiesVoltageBatteryGet', device_data.id);

        let device = this.getDevice(device_data);

        if (device instanceof Error) {
            return callback(device);
        }

        callback(null, device.state['measure_voltage.battery']);
    }
}

module.exports = new DriverUPS();
