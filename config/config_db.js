var mysql = require('mysql');
var config;
config = {
   mysql_pool: mysql.createPool({
      multipleStatements: true,
      host: process.env.APP_DB_HOST,
      user:process.env.APP_DB_USER,
      password: process.env.APP_DB_PASSWORD,
      database:process.env.APP_DB_NAME
   })
};

module.exports = config;
