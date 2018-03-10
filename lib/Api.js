'use strict';

const Homey = require('homey');
const net = require('net');

class Api extends Homey.SimpleClass {

    getDevice (host, port, callback) {
        console.log('_getDevice', host, port);

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
