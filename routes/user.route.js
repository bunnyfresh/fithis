"use strict";

var userController = require("../controllers/user.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class userRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'user';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let mount_point = mp + '/' + this.name;
      let userControllerObj = new userController(this.app);
      this.app.get(mount_point + '/profile', this.app.route_filter.tokenMiddleware(), userControllerObj.getProfile);
      this.app.post(mount_point + '/changepassword', validate(this.validations.updateUserPassword), this.app.route_filter.tokenMiddleware(), userControllerObj.changePassword);
      this.app.get(mp + '/verify/:token', userControllerObj.verifyAccount);
      this.app.post(mount_point + '/sendotp', validate(this.validations.sendOtp), this.app.route_filter.tokenMiddleware(), userControllerObj.sendOtp);
      this.app.post(mount_point + '/verifyotp', validate(this.validations.verifyOtp), this.app.route_filter.tokenMiddleware(), userControllerObj.verifyOtp);
      this.app.post(mount_point + '/createprofile', validate(this.validations.createProfile), this.app.route_filter.tokenMiddleware(), userControllerObj.createProfile);
      this.app.post(mount_point + '/uploadpic', this.app.route_filter.tokenMiddleware(), userControllerObj.uploadProfilepic);
      this.app.post(mount_point + '/uploadcoverpic', this.app.route_filter.tokenMiddleware(), userControllerObj.uploadCoverpic);
      this.app.post(mount_point + '/onlinestatus', validate(this.validations.setOnlineStatus), this.app.route_filter.tokenMiddleware(), userControllerObj.setOnlineStatus);
   }

   validations() {
      var validate = {
         createProfile: {
            options: { flatten: false },
            body: {
               first_name: Joi.string().required(),
               last_name: Joi.string().required(),
               subUrb: Joi.string().required(),
               asFixer: Joi.number().required(),
               asPoster: Joi.number().required()
            }
         },
         verifyOtp: {
            options: { flatten: false },
            body: {
               otp: Joi.string().required(),
            }
         },
         sendOtp: {
            options: { flatten: false },
            body: {
               mobile: Joi.string().required(),
            }
         },
         updateUserPassword: {
            options: { flatten: false },
            body: {
               current_password: Joi.string().required(),
               new_password: Joi.string().required()
            }
         },
         setOnlineStatus: {
            options: { flatten: false },
            body: {
               status: Joi.string().required().valid('0', '1'),
            }
         }
      };
      return validate;
   }

}
module.exports = userRoutes;