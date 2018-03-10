'use strict';

const Homey = require('homey');
const Device = require('../../lib/Device.js');

const refreshDevicesTimeout = 10000;

const modelMap = {
    'Back-UPS ES 325G': '185',
    'Back-UPS ES 550G': '330',
    'Back-UPS ES 700G': '405'
}

class DeviceUPS extends Device {

    _initDevice() {
        this.log('_initDevice');

        this.intervalId = setInterval(this._syncDevice.bind(this), refreshDevicesTimeout);
    }

    _deleteDevice() {
        this.log('_deleteDevice');

        clearInterval(this.intervalId);
    }

    _syncDevice() {
        this.log('_syncDevice');

        let device = this.getData();
        let device_state = [];

        Homey.app.getDevice(device.ip, device.port, (error, result) => {
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
                    device_state[capabilityname[values.indexOf(label)]] = Number(item[1].trim().split(' ')[0]);
                }
            });

            Promise.all(items).then((results) => {
                if (device_state['measure_voltage.power'] > 50) {
                    device_state.alarm_battery = false;
                } else {
                    device_state.alarm_battery = true;
                }

                if (typeof modelMap[device.model] === 'string') {
                    device_state.measure_power = Number(modelMap[device.model]) / 100 * device_state.measure_power;
                } else {
                    device_state.measure_power = device.nompower / 100 * device_state.measure_power;
                }

                this.setCapabilityValue('alarm_battery', device_state.alarm_battery).catch(error => {
                    this.error(error);
                });

                this.setCapabilityValue('measure_battery', device_state.measure_battery).catch(error => {
                    this.error(error);
                });

                this.setCapabilityValue('measure_power', device_state.measure_power).catch(error => {
                    this.error(error);
                });

                this.setCapabilityValue('measure_voltage.power', device_state['measure_voltage.power']).catch(error => {
                    this.error(error);
                });

                this.setCapabilityValue('measure_voltage.battery', device_state['measure_voltage.battery']).catch(error => {
                    this.error(error);
                });
            });

        });
    }

}

module.exports = DeviceUPS;
