"use strict";

class BaseModel {
   constructor(app) {
      this.app = app;
      this.escape = (value) => {
         return this.app.mysqldb.db.escape(value);
      };
   }
}

module.exports = BaseModel;


