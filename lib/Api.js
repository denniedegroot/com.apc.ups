"use strict";

const net = require('net');

class Api {

    constructor() {
        this._debug = true;
    }

    debug() {
        if (this._debug) {
            this.log.apply(this, arguments);
        }
    }

    log() {
        if (Homey.app) {
            Homey.app.log.bind(Homey.app, `[${this.constructor.name}]`).apply(Homey.app, arguments);
        }
    }

    error() {
        if (Homey.app) {
            Homey.app.error.bind(Homey.app, `[${this.constructor.name}]`).apply(Homey.app, arguments);
        }
    }

    init () {

    }

    getDevice (host, port, callback) {
        this.debug('_getDevice', host, port);

        let timer;

        let conn = net.createConnection({
            host: host,
            port: port
        }, () => {
            let data = Buffer.from('\x00\x06status');
            conn.write(data);
        });

        conn.on('data', (data) => {
            if (data.length > 2) {
                clearTimeout(timer);

                try {
                    callback(null, data.toString());
                } catch (e) {
                    callback(e);
                }
            }

            conn.end();
        });

        conn.on('error', (err) => {
            clearTimeout(timer);
            callback(err);
            conn.end();
        });

        timer = setTimeout(function() {
            callback(new Error('timeout getDevice'));
            conn.end();
        }, 2000);
    }

}

module.exports = Api;
