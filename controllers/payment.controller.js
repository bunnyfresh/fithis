"use strict";
const paymentModel = require('../models/payment.model');

class PaymentController {
   constructor(app) {
      this.app = app;
   }

   /**
    * handle card details
    **/
   handleCardDetails(req, res, next) {
      var userId = req.token.user_id;
      var cardInfo = req.body;
      var paymentModelObj = new paymentModel(this);
      paymentModelObj.handleCardDetails(userId, cardInfo).then((response) => {
         this.helper.sendSuccessResponse(res, response, {});
      }).catch((error) => {
         this.helper.sendFailureResponse(res, error);
      });
   }

   /**
   * handle bank details
   **/
   handleBankDetails(req, res, next) {
      var userId = req.token.user_id;
      var bankInfo = req.body;
      var paymentModelObj = new paymentModel(this);
      paymentModelObj.handleBankDetails(userId, bankInfo).then((response) => {
         this.helper.sendSuccessResponse(res, response, {});
      }).catch((error) => {
         this.helper.sendFailureResponse(res, error);
      });
   }

}
module.exports = PaymentController;