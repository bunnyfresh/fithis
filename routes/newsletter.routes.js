"use strict";

var newsletterController = require("../controllers/newsletter.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class jobRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'newsletter';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let mount_point = mp + '/' + this.name;
      let newsletterControllerObj = new newsletterController(this.app);
      this.app.post(mount_point + '/subscribe', validate(this.validations.subscribe),  newsletterControllerObj.subscribe);
   }

   validations() {
      var validate = {
         subscribe: {
            options: { flatten: false },
            body: {
               email: Joi.string().required()
            }
         }
      };
      return validate;
   }

}
module.exports = jobRoutes;