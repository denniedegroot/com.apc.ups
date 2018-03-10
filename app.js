'use strict';

const Homey = require('homey');
const api = require('./lib/Api.js');

class App extends Homey.App {

    log() {
        console.log.bind(this, '[log]').apply(this, arguments);
    }

    error() {
        console.error.bind(this, '[error]').apply(this, arguments);
    }

    onInit() {
        console.log(`${Homey.manifest.id} running...`);

        this._api = new api();
    }

    getDevice(host, port, callback) {
        this._api.getDevice(host, port, callback);
    }

}

module.exports = App;
