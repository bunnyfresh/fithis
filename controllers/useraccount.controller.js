"use strict";
const userAccountModel = require('../models/usersaccount.model');
var jwt = require('jsonwebtoken');

class UseraccountController {
   constructor(app) {
      this.app = app;
   }

   /**
    * set language
    **/
   setLanguage(req, res, next) {
      try {
         var userId = req.token.user_id;
         var language_id = req.body.language_id;
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.setLanguage(userId, language_id).then((response) => {
            /** Updating token with changed locale so that result is in immediate effect without logging in**/
            var newLanguage = response.update_lan_code;
            var token = req.token;
            token.locale = newLanguage;
            var updatedToken = jwt.sign(token, process.env.JWT_SECRET);
            response.token = updatedToken;
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            console.log(error);
            this.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }
   }

   /**
    * add portfolio
    **/
   addportfolio(req, res, next) {
      try {
         var userId = req.token.user_id;
         var portfolio = req.files.portfolio;
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.addUserPortfolio(userId, portfolio).then((response) => {
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

   /**
    * Remove portfolio 
    **/
   removeportfolio(req, res, next) {
      try {
         var userId = req.token.user_id;
         var portfolioid = req.body.portfolioid;
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.removeUserPortfolio(userId, portfolioid).then((response) => {
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


   /**
    * handle general user info
    **/
   handleGeneralInfo(req, res, next) {
      try {
         var userId = req.token.user_id;
         var infoToUpdate = req.body || {};
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.handleGeneralInfo(userId, infoToUpdate).then((response) => {
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

   /**
    * handle private user info
    **/
   handlePrivateInfo(req, res, next) {
      try {
         var userId = req.token.user_id;
         var infoToUpdate = req.body;
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.handlePrivateInfo(userId, infoToUpdate).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }

   }


   /**
    * get user dashboard
    **/
   getDashboard(req, res, next) {
      try {
         var userId = req.token.user_id;
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.getDashboard(userId).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }

   }

   /**
    * Get check info that is required before posting job
    **/
   getCheckinfo(req, res, next) {
      try {
         var userId = req.token.user_id;
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.getCheckInfo(userId).then((response) => {
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

   /**
      * Get user account info 
   **/
   getAccountData(req, res, next) {
      try {
         var userId = req.token.user_id;
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.getCompleteAccountProfile(userId).then((response) => {
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


   /** Update notification preferences **/
   updateAlertPreferences(req, res, next) {
      try {
         var userId = req.token.user_id;
         var alertType = req.body.alertType;
         var preferences = {
            email: req.body.email,
            sms: req.body.sms,
            push: req.body.push,
         };
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.updateAlertPreferences(userId, alertType, preferences).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }

   }

   /** Update notification preferences **/
   getAlertPreferences(req, res, next) {
      try {
         var userId = req.token.user_id;
         var alertType = req.query.alertType;
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.getAlertPreferences(userId, alertType).then((response) => {
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

   /** Update notification preferences **/
   updatecheckinfo(req, res, next) {
      try {
         var userId = req.token.user_id;
         var fieldType = req.body.fieldType;
         var value = req.body.value;
         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.updatecheckinfo(userId, fieldType, value).then((response) => {
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

   /**
   * handler to get user rating 
   * **/
   getUserRatings(req, res, next) {
      try {
         var userAccountModelObj = new userAccountModel(this);
         var userId = req.token.user_id;
         userAccountModelObj.getUserRatings(userId).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      } catch (error) {
         this.helper.sendFailureResponse(res, error);
      }

   }
   /** Get user transaction **/
   getTransactions(req, res, next) {
      try {

         var userId = req.token.user_id;
         var pp = (!isNaN(req.query.pp) && req.query.pp > 0) ? req.query.pp : 10;
         var pg = (!isNaN(req.query.pg) && req.query.pg >= 1) ? req.query.pg : 1;

         var transactionFilters = {
            transactionType: req.query.transactionType,
            type: req.query.type,
         };

         var userAccountModelObj = new userAccountModel(this);
         userAccountModelObj.getTransactions(userId, transactionFilters, pp, pg).then((response) => {
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