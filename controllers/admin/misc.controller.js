"use strict";

var miscModel = require("../../models/misc.model");

class AdminMiscController {
   constructor(app) {
      this.app = app;
   }

   /**
    * handler to get admin dashboard data
    **/
   getDashboardData(req, res, next) {
      try {
         var miscModelObj = new miscModel(this);
         miscModelObj.getAdminDashboardData().then((response) => {
            this.helper.sendSuccessResponse(res,response,{});
         }).catch((error) => {
            this.helper.sendFailureResponse(res,error);
         });
      }
      catch (error) {
         console.log(error);
         this.helper.sendFailureResponse(res,error);
      }
   }
}
module.exports = AdminMiscController;