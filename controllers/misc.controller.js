"use strict";

var miscModel = require("../models/misc.model");

class MiscController {
   constructor(app) {
      this.app = app;
   }

   /**
    * handler to get app languages 
    **/
   getAppLanguages(req, res, next) {
      try {
         var miscModelObj = new miscModel(this);
         miscModelObj.getAppLanguages().then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         console.log(error);
         this.helper.sendFailureResponse(res, error);
      }
   }

   /**
   * handler to handle report functionality
   **/
   report(req, res, next) {
      try {
         var miscModelObj = new miscModel(this);

         var reportData = {
            task_id: req.body.task_id,
            reported_by: req.token.user_id,
            comment: req.body.comment,
            category: req.body.category,
         };

         miscModelObj.reportTask(reportData).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            switch (error.status){
                case '400':
                   this.helper.sendBadResponse(res, error);
                   break;
                case '500':
                   this.helper.sendFailureResponse(res, error);
                   break;
              }
         });
      }
      catch (error) {
         console.log(error);
         this.helper.sendFailureResponse(res, error);
      }
   }


   /**
   * handler to handle report functionality
   **/
   contactUs(req, res, next) {
      try {
         var miscModelObj = new miscModel(this);
         var contactData = {
            message: req.body.message,
            attachment: req.files.attachment,
         };
         miscModelObj.contactUs(contactData).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         console.log(error);
         this.helper.sendFailureResponse(res, error);
      }
   }
}
module.exports = MiscController;