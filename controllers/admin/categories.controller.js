"use strict";
const categoryModel = require('../../models/jobcategories.model');

class adminCategoryController {
   constructor(app) {
      this.app = app;
   }

   /**
    * function to get categories list
    * **/
   getCategoriesList(req, res, next) {
      try {
         var jobCategoryModelObj = new categoryModel(this);
         //var userId = req.token.user_id;

         var pp = (!isNaN(req.query.pp) && req.query.pp > 0) ? req.query.pp : 10;
         var pg = (!isNaN(req.query.pg) && req.query.pg >= 1) ? req.query.pg : 1;
         var filters = {
            search_key: req.query.search_key || null,
         };

         jobCategoryModelObj.getPaginatedCategoryListing(pp, pg, filters).then((response) => {
            this.helper.sendSuccessResponse(res,response,{});
         }).catch((error) => {
            this.helper.sendFailureResponse(res,error);
         });
      }
      catch (error) {
         this.helper.sendFailureResponse(res,error);
      }
   }

   /**
    * function to add categories list
    * **/
   addJobCategory(req, res, next) {
      try {
         var jobCategoryModelObj = new categoryModel(this);

         var categoryData = req.body;
         var categoryImage = req.files.category_image;

         jobCategoryModelObj.addJobCategory(categoryData, categoryImage).then((response) => {
            this.helper.sendSuccessResponse(res,response,{});
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
         this.helper.sendFailureResponse(res,error);
      }
   }

   /**
    * function to edit categories list
    * **/
   editJobCategory(req, res, next) {
      try {
         var jobCategoryModelObj = new categoryModel(this);

         var categoryData = req.body;
         var categoryImage = req.files.category_image;

         jobCategoryModelObj.editJobCategory(categoryData, categoryImage).then((response) => {
            this.helper.sendSuccessResponse(res,response,{});
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
         this.helper.sendFailureResponse(res,error);
      }
   }
}
module.exports = adminCategoryController;