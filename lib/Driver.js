'use strict';

const Homey = require('homey');

class Driver extends Homey.Driver {

    onPair (socket) {
        this.log('onPair');

        socket.on('search_devices', (data, callback) => {
            if (this._onPairSearchDevices) {
                this._onPairSearchDevices(data, callback);
            } else {
                callback(new Error('missing _onPairSearchDevices'));
            }
        });

        socket.on('list_devices', (data, callback) => {
            if (this._onPairListDevices) {
                this._onPairListDevices(data, callback);
            } else {
                callback(new Error('missing _onPairListDevices'));
            }
        });
    }

}

module.exports = Driver;
