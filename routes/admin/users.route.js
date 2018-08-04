"use strict";

var userController = require("../../controllers/admin/user.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class adminUserRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'users';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let userControllerObj = new userController(this.app);
      this.app.get(mp + '/admin/users', validate(this.validations.getUsersList), this.app.route_filter.tokenMiddleware(), userControllerObj.getUsersList);
      this.app.put(mp + '/admin/user/status', validate(this.validations.setUserStatus), this.app.route_filter.tokenMiddleware(), userControllerObj.setUserStatus);
      this.app.del(mp + '/admin/user/delete', validate(this.validations.userDelete), this.app.route_filter.tokenMiddleware(), userControllerObj.deleteUser);
      this.app.post(mp + '/admin/user/handle', validate(this.validations.userHandle), this.app.route_filter.tokenMiddleware(), userControllerObj.handleUser);
      this.app.get(mp + '/admin/user/details', validate(this.validations.userDetails), this.app.route_filter.tokenMiddleware(), userControllerObj.userDetails);
      this.app.post(mp + '/admin/user/uploadpic', validate(this.validations.uploadUserPic), this.app.route_filter.tokenMiddleware(), userControllerObj.uploadUserPic);
      this.app.post(mp + '/admin/user/uploadcoverpic', validate(this.validations.uploadUserPic), this.app.route_filter.tokenMiddleware(), userControllerObj.uploadUserCoverPic);
      this.app.post(mp + '/admin/user/resetpassword', validate(this.validations.resetUserPassword), this.app.route_filter.tokenMiddleware(), userControllerObj.resetUserPassword);
   }

   validations() {
      var validate = {
         getUsersList: {
            options: { flatten: false },
            query: {
               pp: Joi.number(),
               pg: Joi.number(),
               search_key: Joi.string(),
               status: Joi.string().valid("active", "inactive", "deleted"),
               user_type: Joi.string().valid('fixer', 'poster'),
               sort_field: Joi.string(),
               sort_order: Joi.string(),
            }
         },
         uploadUserPic: {
            options: { flatten: false },
            body: {
               user_id: Joi.number().required(),
            }
         },
         setUserStatus: {
            options: { flatten: false },
            body: {
               userId: Joi.number(),
               status: Joi.number()
            }
         },
         resetUserPassword: {
            options: { flatten: false },
            body: {
               user_id: Joi.number().required(),
            }
         },
         userDelete: {
            options: { flatten: false },
            body: {
               userId: Joi.number(),
            }
         },
         userHandle: {
            options: { flatten: false },
            body: {
               userId: Joi.number(),
               first_name: Joi.string().required(),
               last_name: Joi.string().required(),
               email: Joi.string().email().required(),
               location: Joi.string().required(),
               asFixer: Joi.number(),
               mobile_number: Joi.string(),
               tagline: Joi.string().allow(''),
               about: Joi.string().allow(''),
               birth_date: Joi.string().allow(''),
               userSkills: Joi.object().allow(null),
            }
         },
         userDetails: {
            options: { flatten: false },
            query: {
               userId: Joi.number().required(),
            }
         }
      };
      return validate;
   }

}
module.exports = adminUserRoutes;