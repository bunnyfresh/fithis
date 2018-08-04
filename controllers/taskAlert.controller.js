"use strict";

const taskAlertModel = require('../models/taskAlerts.model');

class UseraccountController {
   constructor(app) {
      this.app = app;
   }
   /** Add new task alert **/
   addTaskAlert(req, res, next) {
      try {
         var userId = req.token.user_id;
         var alertData = req.body;
         var taskAlertModelObj = new taskAlertModel(this);
         taskAlertModelObj.addTaskAlert(userId, alertData).then((response) => {
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
         this.helper.sendFailureResponse(res, error);
      }
   }

   /** update task alert **/
   updateTaskAlert(req, res, next) {
      try {
         var alertId = req.body.alertId;
         delete req.body.alertId;
         var alertData = req.body;
         var taskAlertModelObj = new taskAlertModel(this);
         taskAlertModelObj.updateTaskAlert(alertId, alertData).then((response) => {
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
         this.helper.sendFailureResponse(res, error);
      }
   }

   /** delete task alert **/
   deleteTaskAlert(req, res, next) {
      try {
         var userId = req.token.user_id;
         var alertId = req.body.alertId;
         var taskAlertModelObj = new taskAlertModel(this);
         taskAlertModelObj.deleteTaskAlert(alertId, userId).then((response) => {
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

   /** list task alert **/
   getTaskAlertList(req, res, next) {
      try {
         var userId = req.token.user_id;
         var pp = (!isNaN(req.query.pp) && req.query.pp > 0) ? req.query.pp : 10;
         var pg = (!isNaN(req.query.pg) && req.query.pg >= 1) ? req.query.pg : 1;
         var taskAlertModelObj = new taskAlertModel(this);
         taskAlertModelObj.getTaskAlertList(userId, pp, pg).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }
   }
}

module.exports = UseraccountController;