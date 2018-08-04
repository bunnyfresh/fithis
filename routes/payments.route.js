"use strict";

var paymentController = require("../controllers/payment.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class PaymentsRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'payments';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let mount_point = mp;
      let paymentControllerObj = new paymentController();
      this.app.post(mount_point + '/user/carddetails', validate(this.validations.carddetails), this.app.route_filter.tokenMiddleware(), paymentControllerObj.handleCardDetails);
      this.app.post(mount_point + '/user/bankdetails', validate(this.validations.bankdetails), this.app.route_filter.tokenMiddleware(), paymentControllerObj.handleBankDetails);
   }

   validations() {
      var validate = {
         carddetails: {
            options: { flatten: false },
            body: {
               card_name: Joi.string().required(),
               card_number: Joi.number().required(),
               exp_month: Joi.number().required(),
               exp_year: Joi.number().required(),
               cvc: Joi.number().required().min(3),
            }
         },
         bankdetails: {
            options: { flatten: false },
            body: {
               account_name: Joi.string().required(),
               bank_name: Joi.string().required(),
               routing_number: Joi.number().required(),
               is_default_method: Joi.number().required(),
               account_number: Joi.number().required().min(10),
               personal_id_number: Joi.number().required(),
            }
         }
      };
      return validate;
   }

}
module.exports = PaymentsRoutes;