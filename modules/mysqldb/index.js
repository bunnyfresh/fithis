"use strict";
let Q = require('q');
const mysql = require('mysql');

class mysqldb {

   constructor(app) {
      this.app = app;
      this.status = 0;
      const toUnnamed = require('named-placeholders')();
      const originalQuery = require('mysql/lib/Connection').prototype.query;

      // patching query for namespaces 
      require('mysql/lib/Connection').prototype.query = function (...args) {
         if (Array.isArray(args[0]) || !args[1]) {
            return originalQuery.apply(this, args);
         }
         ([
            args[0],
            args[1]
         ] = toUnnamed(args[0], args[1]));

         return originalQuery.apply(this, args);
      };
      this.db = null;
      this.connect();
   }

   connect() {
      console.log("DB:", "@@@@@@@@@@@@@@@ NEW POOL @@@@@@@@@@@@@@@@");
      this.pool = mysql.createPool({
         host: process.env.APP_DB_HOST,
         user: process.env.APP_DB_USER,
         database: process.env.APP_DB_NAME,
         password: process.env.APP_DB_PASSWORD,
         multipleStatements: true,
         charset: "utf8_unicode_ci",
         connectionLimit: 10,
         timezone: 'UTC+0',
         dateStrings:true,
      });
      console.log(
        {
          host: process.env.APP_DB_HOST,
          user: process.env.APP_DB_USER,
          database: process.env.APP_DB_NAME,
          password: process.env.APP_DB_PASSWORD,
          multipleStatements: true,
          charset: "utf8_unicode_ci",
          connectionLimit: 10,
          timezone: 'UTC+0',
          dateStrings:true
         }
      )
      let medb = this;
      if (medb.status === 1) {
         console.log("DB:", 'Prev connection found!');
         return;
      }
      console.log("DB:", 'Attempting new connection...');
      this.pool.getConnection(function (err, connection) {
         if (err) {
            throw (err);
         }
         if (connection !== undefined) {
            medb.db = connection;
            medb.status = 1;
            console.log("DB:", 'Session set to 0 successfully');
            connection.on('error', function (err) {
               console.log("DB:", 'error occurred...', err);
               medb.status = 0;
            });
         } else {
            medb.status = 0;
         }
      });
   }

   disconnect() {
      try {
         this.db.destroy();
         this.status = 0;
         console.log("DB:", 'DB Connection Closed');
      } catch (e) {
         console.log("DB:", 'ERR: DB Connection Close ', e);
      }
   }

   /**
    * function to run query 
    **/
   query(sql, params) {
      var me = this;
      var q = Q.defer();
      me.pool.getConnection(function (err, connection) {
         if (err) {
            q.reject("Unable to execute query");
         }
         me.db = connection;
         let executedQuery = connection.query(sql, params, function (error, rows) {
            if (error) {
               console.log(error); // debug
               q.reject("Unable to execute query");
            } else {
               q.resolve(rows);
            }
            connection.destroy();
         });
         //----  debug see actual query --
         console.log(executedQuery.sql);
      });
      return q.promise;
   }
}

module.exports = mysqldb;