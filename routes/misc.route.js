"use strict";

var miscController = require("../controllers/misc.controller");
var validate = require('restify-api-validation');
var Joi = require('joi');

class miscRoutes {
   constructor(app) {
      this.app = app;
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let miscControllerObj = new miscController(this.app);
      this.app.get(mp + '/applanguages', this.app.route_filter.tokenMiddleware(), miscControllerObj.getAppLanguages);
      this.app.post(mp + '/report', validate(this.validations.report), this.app.route_filter.tokenMiddleware(), miscControllerObj.report);
      this.app.post(mp + '/contactus', validate(this.validations.contactus), this.app.route_filter.tokenMiddleware(), miscControllerObj.contactUs);
   }

   validations() {
      var validate = {
         report: {
            options: { flatten: false },
            body: {
               category: Joi.string().required(),
               comment: Joi.string().required(),
               task_id: Joi.number().required()
            }
         },
         contactus: {
            options: { flatten: false },
            body: {
               message: Joi.string().required()
            }
         }
      };
      return validate;
   }

}
module.exports = miscRoutes;