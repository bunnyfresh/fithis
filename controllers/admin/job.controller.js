"use strict";
const jobModel = require('../../models/admin/jobs.model');

class adminJobController {
   constructor(app) {
      this.app = app;
   }

   /**
    * function to get job list
    * **/
   getJobList(req, res, next) {
      try {
         var jobModelObj = new jobModel(this);
         //var userId = req.token.user_id;

         var pp = (!isNaN(req.query.pp) && req.query.pp > 0) ? req.query.pp : 10;
         var pg = (!isNaN(req.query.pg) && req.query.pg >= 1) ? req.query.pg : 1;

         var filters = {
            search_key: req.query.search_key || null,
            job_status: req.query.job_status || null,
            jobs_for_user: req.query.jobs_for_user || null,
            sort_field: req.query.sort_field || 'task_post_date',
            sort_order: req.query.sort_order || 'desc',
         };

         jobModelObj.getJobListingForAdmin(pp, pg, filters).then((response) => {
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
  * function to set job status
  * **/
   setJobStatus(req, res, next) {
      try {
         var jobModelObj = new jobModel(this);
         var jobId = req.body.jobId;
         var status = req.body.status;
         jobModelObj.updateJobStatus(jobId, status).then((response) => {
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
   * Handler to update job
   **/
   handleJob(req, res, next) {
      var jobModelObj = new jobModel(this);
      var taskId = req.body.job_id;
      delete req.body.job_id;
      jobModelObj.handleJobAdmin(req.body, taskId).then((response) => {
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
module.exports = adminJobController;