"use strict";
const jobModel = require('../models/jobs.model');

class JobController {
   constructor(app) {
      this.app = app;
   }

   /**
    * Function to browse jobs 
    **/
   searchJobs(req, res, next) {
      var userId = req.token.user_id;
      var jobModelObj = new jobModel(this);
      var jobSearchData = {
         user_id: userId,
         searchForUserjobs: req.query.user_id || null,
         user_current_lat: req.query.lat || null,
         user_current_long: req.query.long || null,
         radius: req.query.radius || req.query.radius === 0 ? req.query.radius : null,
         title: req.query.title || null,
         category: req.query.job_category || null,
         myjobs: req.query.myjobs,
         is_online: req.query.is_online || req.query.is_online === 0 ? req.query.is_online : null,
         job_status: req.query.job_status || req.query.job_status === 0 ? req.query.job_status : null,
         sort_by: req.query.sort_field || null
      };
      var pp = (!isNaN(req.query.pp) && req.query.pp > 0) ? req.query.pp : 10;
      var pg = (!isNaN(req.query.pg) && req.query.pg >= 1) ? req.query.pg : 1;
      jobModelObj.getJobsListing(jobSearchData, pp, pg).then((response) => {
         var keysToTranslate = { "data.jobs": { "type": "multi", keys: ['task_name', 'task_description'] } };
         this.helper.sendSuccessResponse(res, response, keysToTranslate);
      }).catch((error) => {
         this.helper.sendFailureResponse(res, error);
      });
   }


   /**
    * Handler to post new job
    **/
   postNewJob(req, res, next) {
      var userId = req.token.user_id;
      var jobModelObj = new jobModel(this);
      var jobData = {
         user_id: userId,
         category_id: req.body.category_id,
         job_name: req.body.job_name,
         job_description: req.body.job_description,
         location: req.body.location,
         latitude: req.body.latitude,
         longitude: req.body.longitude,
         is_online: req.body.is_online_task,
      };
      jobModelObj.postNewJob(userId, jobData).then((response) => {
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
   * Handler to update job
   **/
   updateJob(req, res, next) {
      var jobModelObj = new jobModel(this);
      var taskId = req.body.job_id;
      delete req.body.job_id;
      jobModelObj.updateJob(taskId, req.body).then((response) => {
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
    * Handler to delete job
    **/
   deleteJob(req, res, next) {
      var jobId = req.body.job_id;
      var userId = req.token.user_id;
      var jobModelObj = new jobModel(this);
      jobModelObj.deleteJob(jobId, userId).then((response) => {
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
    * Handler to upload job document
    **/
   getJobDetails(req, res, next) {
      var jobId = req.params.jobId;
      var jobModelObj = new jobModel(this);
      jobModelObj.getJobDetails(jobId).then((response) => {
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
    * Handler to upload job document
    **/
   uploadDoc(req, res, next) {
      var jobId = req.body.job_id;
      var docFile = req.files.document;
      var jobModelObj = new jobModel(this);
      jobModelObj.uploadJobDoc(jobId, docFile).then((response) => {
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
    * Handler to get job categories 
    **/
   getJobCategories(req, res, next) {
      var jobModelObj = new jobModel(this);
      jobModelObj.getJobCategories().then((response) => {
         this.helper.sendSuccessResponse(res, response, {});
      }).catch((error) => {
         this.helper.sendFailureResponse(res, error);
      });
   }

   /** Handler to assign job**/
   assignJob(req, res, next) {
      var jobModelObj = new jobModel(this);
      var userId = req.token.user_id;
      var offerId = req.body.offerId;
      jobModelObj.assignJob(offerId, userId).then((response) => {
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
   /** Handler to complete job**/
   completeJob(req, res, next) {
      var jobModelObj = new jobModel(this);
      var jobId = req.body.jobId;
      var userId = req.token.user_id;
      jobModelObj.completeJob(jobId, userId).then((response) => {
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
    * Handler to get jobs for reviews 
    **/
   getJobsToReview(req, res, next) {
      var jobModelObj = new jobModel(this);
      var userId = req.token.user_id;
      var pp = (!isNaN(req.query.pp) && req.query.pp > 0) ? req.query.pp : 10;
      var pg = (!isNaN(req.query.pg) && req.query.pg >= 1) ? req.query.pg : 1;
      jobModelObj.getJobsToReview(userId, pp, pg).then((response) => {
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
    * Handler for job feedback 
    **/
   handleJobFeedback(req, res, next) {
      var jobModelObj = new jobModel(this);
      var jobId = req.body.job_id;
      var userId = req.token.user_id;
      var feedbackData = {
         rating: req.body.rating,
         comment: req.body.comment,
         feedback_tags: JSON.stringify(req.body.feedback_tags.split(','))
      };
      jobModelObj.handleJobFeedback(userId, jobId, feedbackData).then((response) => {
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
module.exports = JobController;