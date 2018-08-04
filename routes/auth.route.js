"use strict";

var authController = require("../controllers/auth.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class authRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'auth';
      this.validations = this.validations();
   }
   /**
    * @param  {} mp
    */
   resource(mp) {
      let mount_point = mp + '/' + this.name;
      let authControllerObj = new authController(this.app);
      this.app.post(mount_point + '/login', validate(this.validations.login), authControllerObj.login);
      this.app.get(mount_point + '/refreshtoken', this.app.route_filter.tokenMiddleware(), authControllerObj.refreshToken);
      this.app.post(mount_point + '/social', validate(this.validations.authSocial), authControllerObj.authSocial);
      this.app.post(mount_point + '/register', validate(this.validations.register), authControllerObj.register);
      this.app.post(mount_point + '/forgotpassword', validate(this.validations.forgotpassword), authControllerObj.forgotpassword);
      this.app.post(mount_point + '/resetpassword/:token', validate(this.validations.resetpassword), authControllerObj.resetpassword);
      this.app.post(mount_point + '/logout', validate(this.validations.logout), this.app.route_filter.tokenMiddleware(), authControllerObj.logout);
   }


   validations() {
      var validate = {
         login: {
            options: { flatten: false },
            body: {
               email: Joi.string().required().email(),
               password: Joi.string().required().min(6),
               device_token: Joi.string(),
               device_type: Joi.string().valid('1', '2')
            }
         },
         logout: {
            options: { flatten: false },
            body: {
               device_token: Joi.string().required(),
            }
         },
         authSocial: {
            options: { flatten: false },
            body: {
               social_site: Joi.required().valid('fb', 'google'),
               site_auth_token: Joi.string().required(),
               device_token: Joi.string(),
               device_type: Joi.string().valid('1', '2')
            }
         },
         register: {
            options: { flatten: false },
            body: {
               email: Joi.string().required().email(),
               password: Joi.string().required().min(6),
               device_token: Joi.string(),
               device_type: Joi.string().valid('1', '2'),
            }
         },
         forgotpassword: {
            options: { flatten: false },
            body: {
               email: Joi.string().required().email()
            }
         },
         resetpassword: {
            options: { flatten: false },
            body: {
               password: Joi.string().required()
            }
         }
      };
      return validate;
   }

}
module.exports = authRoutes;