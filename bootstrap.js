"use strict";

var restify = require("restify");
var fs = require("fs");
var _ = require('lodash');
var nodeCleanup = require('node-cleanup');
var glob = require('glob');

class bootstrap {
   constructor(server) {
      let me = this;
      server.use(restify.plugins.bodyParser({
         uploadDir: './temp/uploads',
         multiples: true
      }));
      server.use(restify.plugins.gzipResponse());
      server.use(restify.plugins.queryParser());
      server.use(restify.plugins.fullResponse());
      me.server = server;
      me.server.app = this;
      me.initCors();
      me.loadModules();
      me.loadRoutes();
      me.loadSwagger();
      me.loadAcl();
      me.initStaticRoutes();
   }

   initCors() {
      if (process.env.APP_CORS_URLS) {
         var corsUrls = process.env.APP_CORS_URLS.split(',');
         console.log("corsUrls", corsUrls);
         var allowedHeaders = [
            'Accept',
            'Accept-Version',
            'Content-Type',
            'Api-Version',
            'Origin',
            'X-Requested-With',
            'Authorization'
         ];
         const corsMiddleware = require('restify-cors-middleware');
         const cors = corsMiddleware({
            preflightMaxAge: 5, //Optional
            origins: corsUrls,
            allowHeaders: allowedHeaders
         });

         this.server.pre(cors.preflight);
         this.server.pre(cors.actual);
         this.server.opts(/\.*/, function (req, res, next) {
            res.send(200);
            next();
         });
      }
   }


   loadAcl() {
      this.server.route_filter.loadUserRoles(this.server.route_filter.acl).then((result) => {
         console.log("acl: loaded all user roles");
      }).catch((err) => {
         console.error("acl: unable to load user roles", err);
      });
   }

   loadModules() {
      var modules = fs.readdirSync('./modules');
      console.log('App:', 'Loading modules...');
      for (var i in modules) {
         var name = modules[i];
         if (_.startsWith(name, '.')) {
            continue;
         }
         try {
            var moduleObj = require('./modules/' + name);
            this.server[name] = new moduleObj(this.server);
            console.log('App:', 'Module name:', name);
         } catch (e) {
            console.error('App:', 'Exception in Module Include:', name, e, e.stack);
         }
      } //modules
   }

   loadSwagger() {
      var me = this;
      me.server.head('/docs/', function (req, res, next) {
         res.header('Swagger-API-Docs-URL', '/api-docs');
         res.send();
         next();
      });
      this.server.get(/\/docs\/?.*/, restify.plugins.serveStatic({
         directory: './resources',
         default: 'index.html'
      }));

      me.server.get('/api-docs/', restify.plugins.serveStatic({
         directory: './data/',
         file: 'swagger.json'
      }));
   }

   loadRoutes() {
      var me = this;
      console.log('App:', 'Loading routes...');
      glob('routes/**/*.js', function (err, files) {
         try {
            _.each(files, function (route) {
               var temp = new (require('./' + route))(me.server);
               temp.resource('/api');
               console.log('App:', 'Route setup for: ', route);
            });

         } catch (e) {
            console.error('App:', 'Exception in Route Include:', e, e.stack);
         }
      });
      this.server.pre(this.server.route_filter.preRequestHandle);
      this.server.on('NotFound', this.server.route_filter.notFoundHandler);
      this.server.on('InternalServer', function (req, res, err, callback) {
         err.body = 'Sorry, an error occurred!';
         console.error('InternalServer', err);
         return callback();
      });
      this.server.on('restifyError', function (req, res, err, callback) {
         if (err.hasOwnProperty('status')) {
            return res.send(err.status,err);
         }
         err.body = 'Sorry, an error occurred!';
         return callback();
      });
   }

   initStaticRoutes() {
      this.server.get(/\/uploads\/?.*/, restify.plugins.serveStatic({
         directory: __dirname
      }));
   }

   loadProcessCleanup() {
      let me = this;
      nodeCleanup(function (exitCode, signal) {
         me.server.mysql.pool.end(function (err) {
            // all connections in the pool have ended
            if (err) {
               console.error("MySQL close connection error", err);
            }
            process.kill(process.pid, signal);
         });
      }, {
            ctrl_C: "{^C} process stopped",
            uncaughtException: "Uh oh. Look what happened:"
         });
   }

}

module.exports = bootstrap;
