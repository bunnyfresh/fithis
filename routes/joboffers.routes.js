"use strict";

var jobOffersController = require("../controllers/joboffers.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class jobCommentsRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'offers';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      //let mount_point = mp + '/' + this.name;
      let jobOffersControllerObj = new jobOffersController(this.app);
      this.app.post(mp + '/job/offer', validate(this.validations.newOffer), this.app.route_filter.tokenMiddleware(), jobOffersControllerObj.postNewOffer);
      this.app.post(mp + '/job/offer/delete', validate(this.validations.deleteOffer), this.app.route_filter.tokenMiddleware(), jobOffersControllerObj.deleteOffer);
      this.app.post(mp + '/job/offer/update', validate(this.validations.updateOffer), this.app.route_filter.tokenMiddleware(), jobOffersControllerObj.updateOffer);
      this.app.get(mp + '/job/offers/review', validate(this.validations.getOffersReview), this.app.route_filter.tokenMiddleware(), jobOffersControllerObj.getOffersReview);
      this.app.get(mp + '/job/offer/details', validate(this.validations.getOffersDetails), this.app.route_filter.tokenMiddleware(), jobOffersControllerObj.getOffersDetails);
   }

   validations() {
      var validate = {
         newOffer: {
            options: { flatten: false },
            body: {
               task_id: Joi.number().required(),
               comment: Joi.string().required(),
               offer_amount: Joi.number().required().greater(0)
            }
         },
         getOffersReview: {
            options: { flatten: false },
            query: {
               task_id: Joi.number().required(),
               sequence: Joi.number().required()
            }
         },
         getOffersDetails: {
            options: { flatten: false },
            query: {
               offerId: Joi.number().required(),
            }
         },
         deleteOffer: {
            options: { flatten: false },
            body: {
               offer_id: Joi.number().required(),
            }
         },
         updateOffer: {
            options: { flatten: false },
            body: {
               offer_id: Joi.number().required(),
               offer_comment: Joi.string(),
               offer_amount: Joi.number().greater(0)
            }
         }
      };
      return validate;
   }

}
module.exports = jobCommentsRoutes;