'use strict'

var mysql = require('mysql');

module.exports = {
    name: 'rest-api',
    hostname : 'http://localhost',
    version: '0.0.1',
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    db: {
        host     : 'localhost',
        user     : 'root',
        password : '12345',
        database : 'fixthis'
    },
    JWT_SECRET: "fixthis"
}