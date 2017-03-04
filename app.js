"use strict";

const api = require('./lib/Api.js');

class App {

    constructor() {
        this.init = this._onExportsInit.bind(this);
        this._api = new api();
    }

    log() {
        console.log.bind(this, '[log]').apply(this, arguments);
    }

    error() {
        console.error.bind(this, '[error]').apply(this, arguments);
    }

    _onExportsInit() {
        console.log(`${Homey.manifest.id} running...`);
        this._api.init();
    }

    getDevice(host, port, callback) {
        this._api.getDevice(host, port, callback);
    }

}

module.exports = new App();
