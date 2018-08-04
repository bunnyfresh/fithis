"use strict";

var jobController = require("../controllers/job.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class jobRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'job';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let mount_point = mp + '/' + this.name;
      let jobControllerObj = new jobController(this.app);
      this.app.post(mount_point + '/new', validate(this.validations.postJob), this.app.route_filter.tokenMiddleware(), jobControllerObj.postNewJob);
      this.app.post(mount_point + '/update', validate(this.validations.updateJob), this.app.route_filter.tokenMiddleware(), jobControllerObj.updateJob);
      this.app.get(mount_point + '/list', validate(this.validations.searchJobs), this.app.route_filter.tokenMiddleware(), jobControllerObj.searchJobs);
      this.app.post(mount_point + '/uploaddoc', validate(this.validations.jobUploadDoc), this.app.route_filter.tokenMiddleware(), jobControllerObj.uploadDoc);
      this.app.post(mount_point + '/delete', this.app.route_filter.tokenMiddleware(), jobControllerObj.deleteJob);
      this.app.get(mount_point + '/categories', this.app.route_filter.tokenMiddleware(), jobControllerObj.getJobCategories);
      this.app.post(mount_point + '/assign', validate(this.validations.jobAssign), this.app.route_filter.tokenMiddleware(), jobControllerObj.assignJob);
      this.app.post(mount_point + '/complete', validate(this.validations.jobComplete), this.app.route_filter.tokenMiddleware(), jobControllerObj.completeJob);
      this.app.post(mount_point + '/feedback', validate(this.validations.feedback), this.app.route_filter.tokenMiddleware(), jobControllerObj.handleJobFeedback);
      this.app.get(mount_point + '/details/:jobId', validate(this.validations.jobDetails), this.app.route_filter.tokenMiddleware(3), jobControllerObj.getJobDetails);
      this.app.get(mount_point + '/reviewlist', this.app.route_filter.tokenMiddleware(), jobControllerObj.getJobsToReview);
   }

   validations() {
      var validate = {
         searchJobs: {
            options: { flatten: false },
            query: {
               myjobs: Joi.boolean().required(),
               user_id: Joi.number().allow(''),
               lat: Joi.number().allow(''),
               long: Joi.number().allow(''),
               radius: Joi.number().allow(''),
               title: Joi.string().allow(''),
               is_online: Joi.number().allow(''),
               job_category: Joi.number().allow(''),
               job_status: Joi.number().valid(0, 1, 2, 3, 4).allow(''),
               sort_field: Joi.string().allow(''),
               pp: Joi.number(),
               pg: Joi.number()
            }
         },
         jobAssign: {
            options: { flatten: false },
            body: {
               offerId: Joi.number().required()
            }
         },
         jobUploadDoc: {
            options: { flatten: false },
            body: {
               job_id: Joi.number().required()
            }
         },
         jobComplete: {
            options: { flatten: false },
            body: {
               jobId: Joi.number().required()
            }
         },
         feedback: {
            options: { flatten: false },
            body: {
               rating: Joi.number().required().valid(0, 1, 2, 3, 4, 5),
               comment: Joi.string().required(),
               job_id: Joi.number().required(),
               feedback_tags: Joi.string().required(),
            }
         },
         jobDetails: {
            options: { flatten: false },
            path: {
               jobId: Joi.number().required()
            }
         },
         postJob: {
            options: { flatten: false },
            body: {
               job_name: Joi.string().required(),
               job_description: Joi.string().required(),
               is_online_task: Joi.number().required(),
               category_id: Joi.number().required(),
               location: Joi.string().required(),
               latitude: Joi.string().required(),
               longitude: Joi.string().required()
            }
         },
         updateJob: {
            options: { flatten: false },
            body: {
               job_id: Joi.number().required(),
               job_name: Joi.string(),
               job_description: Joi.string(),
               is_online_task: Joi.number(),
               task_end_time: Joi.string(),
               task_end_day: Joi.string(),
               category_id: Joi.number(),
               location: Joi.string(),
               latitude: Joi.string(),
               longitude: Joi.string(),
               abn_number: Joi.string(),
            }
         },
         deleteJob: {
            options: { flatten: false },
            body: {
               job_id: Joi.number().required()
            }
         }
      };
      return validate;
   }

}
module.exports = jobRoutes;