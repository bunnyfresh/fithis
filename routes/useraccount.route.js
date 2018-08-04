"use strict";

var useraccountController = require("../controllers/useraccount.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class useraccoutRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'useraccount';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let mount_point = mp;
      let useraccountControllerObj = new useraccountController(this.app);
      this.app.get(mount_point + '/user/ratings', this.app.route_filter.tokenMiddleware(), useraccountControllerObj.getUserRatings);
      this.app.post(mount_point + '/profile/handlegeneralinfo', this.app.route_filter.tokenMiddleware(), validate(this.validations.handlegeneralinfo), useraccountControllerObj.handleGeneralInfo);
      this.app.post(mount_point + '/profile/handleprivateinfo', this.app.route_filter.tokenMiddleware(), validate(this.validations.handleprivateinfo), useraccountControllerObj.handlePrivateInfo);
      this.app.post(mount_point + '/profile/addportfolio', this.app.route_filter.tokenMiddleware(), useraccountControllerObj.addportfolio);
      this.app.get(mount_point + '/profile/dashboard', this.app.route_filter.tokenMiddleware(), useraccountControllerObj.getDashboard);
      this.app.get(mount_point + '/user/checkinfo', this.app.route_filter.tokenMiddleware(), useraccountControllerObj.getCheckinfo);
      this.app.get(mount_point + '/user/getAccountData', this.app.route_filter.tokenMiddleware(), useraccountControllerObj.getAccountData);
      this.app.post(mount_point + '/profile/removeportfolio', this.app.route_filter.tokenMiddleware(), validate(this.validations.removePortfolio), useraccountControllerObj.removeportfolio);
      this.app.post(mount_point + '/user/updatecheckinfo', this.app.route_filter.tokenMiddleware(), validate(this.validations.updatecheckinfo), useraccountControllerObj.updatecheckinfo);
      this.app.post(mount_point + '/preferences/notification/update', this.app.route_filter.tokenMiddleware(), validate(this.validations.updateNotificationPreferences), useraccountControllerObj.updateAlertPreferences);
      this.app.get(mount_point + '/preferences/notification/get', this.app.route_filter.tokenMiddleware(), validate(this.validations.getAlertPreferences), useraccountControllerObj.getAlertPreferences);
      this.app.post(mount_point + '/user/setlanguage', this.app.route_filter.tokenMiddleware(), validate(this.validations.setLanguage), useraccountControllerObj.setLanguage);
      this.app.get(mount_point + '/user/transactions', this.app.route_filter.tokenMiddleware(), validate(this.validations.transactions), useraccountControllerObj.getTransactions);
   }

   validations() {
      var validate = {
         getAlertPreferences: {
            options: { flatten: false },
            body: {
               alertType: Joi.string(),
            }
         },
         removePortfolio: {
            options: { flatten: false },
            body: {
               portfolioid: Joi.number().required(),
            }
         },
         handlegeneralinfo: {
            options: { flatten: false },
            body: {
               first_name: Joi.string(),
               last_name: Joi.string(),
               location: Joi.string(),
               tagline: Joi.string(),
               about_me: Joi.string()
            }
         },
         handleprivateinfo: {
            options: { flatten: false },
            body: {
               email: Joi.string().required().email(),
               birth_date: Joi.string().required(),
            }
         },
         updateNotificationPreferences: {
            options: { flatten: false },
            body: {
               alertType: Joi.string(),
               email: Joi.number(),
               sms: Joi.number()
            }
         },
         updatecheckinfo: {
            options: { flatten: false },
            body: {
               fieldType: Joi.string().required().valid('dob', 'billing_address'),
               value: Joi.string().required(),
            }
         },
         setLanguage: {
            options: { flatten: false },
            body: {
               language_id: Joi.number().required(),
            }
         },
         transactions: {
            options: { flatten: false },
            query: {
               transactionType: Joi.number().required(),
               type: Joi.number().required(),
               pp: Joi.number(),
               pg: Joi.number(),
            }
         }
      };
      return validate;
   }
}
module.exports = useraccoutRoutes;