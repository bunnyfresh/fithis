"use strict";

var testController = require("../controllers/test.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class testRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'test';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let testControllerObj = new testController(this.app);
      this.app.post(mp + '/test/notification', validate(this.validations.testNotification), this.app.route_filter.tokenMiddleware(), testControllerObj.testNotifications);
      this.app.get(mp + '/test/transalation', testControllerObj.testTransalation);
      this.app.post(mp + '/test/stripe', testControllerObj.testStripe);
   }

   validations() {
      var validate = {
         testNotification: {
            options: { flatten: false },
            body: {
               to_user: Joi.number().required(),
               message: Joi.string().required(),
            }
         }
      };
      return validate;
   }

}
module.exports = testRoutes;