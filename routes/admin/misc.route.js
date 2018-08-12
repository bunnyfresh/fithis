"use strict";

var miscController = require("../../controllers/admin/misc.controller");

class adminMiscRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'auth';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let miscControllerObj = new miscController(this.app);
      this.app.get(mp + '/admin/dashboard', this.app.route_filter.tokenMiddleware(), miscControllerObj.getDashboardData);
      this.app.get(mp + '/admin/jobs-stat', this.app.route_filter.tokenMiddleware(), miscControllerObj.getJobsStat);
   }

   validations() {
      var validate = {

      };
      return validate;
   }

}
module.exports = adminMiscRoutes;