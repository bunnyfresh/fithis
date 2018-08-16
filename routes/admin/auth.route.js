"use strict";

var authController = require("../../controllers/admin/auth.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class adminUserRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'auth';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let authControllerObj = new authController(this.app);
      this.app.post(mp + '/admin/auth', validate(this.validations.login), authControllerObj.authenticate);
      this.app.post(mp + '/admin/refreshtoken', validate(this.validations.refresh), authControllerObj.refreshToken);
   }

   validations() {
      var validate = {
         login: {
            options: { flatten: false },
            body: {
               email: Joi.string().required().email(),
               password: Joi.string().required().min(6).max(10),
               device_token: Joi.string(),
               device_type: Joi.string().valid('1', '2')
            },
         },
          refresh: {
              options: { flatten: false },
              body: {
                  token: Joi.string(),
              },
          }
      };
      return validate;
   }

}
module.exports = adminUserRoutes;