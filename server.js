#!/usr/bin/env node
"use strict";
var restify = require("restify");
var http_port = process.env.APP_HTTP_PORT || 3000;
var http_server = null;
http_server = restify.createServer();
http_server.listen(http_port);
require('dotenv').config()

console.log("server is running on "+ http_port +" now...");
new (require('./bootstrap'))(http_server);