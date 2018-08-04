"use strict";
const jobOffersModel = require('../models/joboffers.model');
const _ = require("lodash");

class JobOffersController {
   constructor(app) {
      this.app = app;
   }

   /**
    * Handler to post new offer
    **/
   postNewOffer(req, res, next) {
      var userId = req.token.user_id;
      var jobOffersModelObj = new jobOffersModel(this);
      var commentData = {
         task_id: req.body.task_id,
         comment: req.body.comment,
         offer_amount: req.body.offer_amount
      };
      jobOffersModelObj.postNewOffer(userId, commentData).then((response) => {
         this.helper.sendSuccessResponse(res, response, {});
      }).catch((error) => {
        switch (error.status){
          case '400':
             this.helper.sendBadResponse(res, error);
             break;
          case '500':
             this.helper.sendFailureResponse(res, error);
             break;
        }
      });
   }


   /**
     * Handler to get offers details
     **/
   getOffersDetails(req, res, next) {
      try {
         var jobOffersModelObj = new jobOffersModel(this);
         var offerId = req.query.offerId;
         jobOffersModelObj.getOfferDetails(offerId).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
          switch (error.status){
            case '400':
               this.helper.sendBadResponse(res, error);
               break;
            case '500':
               this.helper.sendFailureResponse(res, error);
               break;
          }
         });
      }
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }
   }

   /**
    * Handler to get offers for task
    **/
   getOffersReview(req, res, next) {
      try {
         var jobOffersModelObj = new jobOffersModel(this);
         var taskId = req.query.task_id;
         var offerSequence = req.query.sequence;

         jobOffersModelObj.getOffersReviewList(taskId, offerSequence).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
          this.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }

   }

   /**
   * Handler to delete offer
   **/
   deleteOffer(req, res, next) {
      var jobOffersModelObj = new jobOffersModel(this);
      var offerId = req.body.offer_id;
      var userId = req.token.user_id;
      jobOffersModelObj.deleteOffer(offerId, userId).then((response) => {
         this.helper.sendSuccessResponse(res, response, {});
      }).catch((error) => {
        switch (error.status){
          case '400':
             this.helper.sendBadResponse(res, error);
             break;
          case '500':
             this.helper.sendFailureResponse(res, error);
             break;
        }
      });
   }

   /**
   * Handler to update  offer
   **/
   updateOffer(req, res, next) {
      var jobOffersModelObj = new jobOffersModel(this);
      var offerId = req.body.offer_id;
      var userId = req.token.user_id;

      var dataToUpdate = {};

      delete req.body.offer_id;
      _.each(req.body, function (value, property) {
         if (value) {
            dataToUpdate[property] = value;
         }
      });

      jobOffersModelObj.updateOffer(offerId, userId, dataToUpdate).then((response) => {
         this.helper.sendSuccessResponse(res, response, {});
      }).catch((error) => {
         switch (error.status){
          case '400':
             this.helper.sendBadResponse(res, error);
             break;
          case '500':
             this.helper.sendFailureResponse(res, error);
             break;
        }
      });
   }

}
module.exports = JobOffersController;