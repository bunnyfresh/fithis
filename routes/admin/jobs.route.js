"use strict";

var jobsController = require("../../controllers/admin/job.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class adminJobRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'jobs';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let jobControllerObj = new jobsController(this.app);
      this.app.get(mp + '/admin/jobs', validate(this.validations.getJobList), this.app.route_filter.tokenMiddleware(), jobControllerObj.getJobList);
      this.app.put(mp + '/admin/job/status', validate(this.validations.setJobStatus), this.app.route_filter.tokenMiddleware(), jobControllerObj.setJobStatus);
      this.app.post(mp + '/admin/job/handle', validate(this.validations.handleJob), this.app.route_filter.tokenMiddleware(), jobControllerObj.handleJob);
   }

   validations() {
      var validate = {
         getJobList: {
            options: { flatten: false },
            query: {
               pp: Joi.number(),
               pg: Joi.number(),
               search_key: Joi.string(),
               jobs_for_user: Joi.number(),
               sort_field: Joi.string(),
               job_status: Joi.string().valid('', '0', '1', '2', '3', '4'),
               sort_order: Joi.string(),
            }
         },
         setJobStatus: {
            options: { flatten: false },
            body: {
               jobId: Joi.number().required(),
               status: Joi.number().required()
            }
         },
         handleJob: {
            options: { flatten: false },
            body: {
               job_id: Joi.number(),
               user_id: Joi.number().required(),
               job_name: Joi.string().required(),
               no_of_fixers: Joi.number().allow(''),
               job_description: Joi.string().required(),
               is_online_task: Joi.number().required(),
               task_end_time: Joi.string().allow(''),
               job_status: Joi.number().valid(0, 1).required(),
               task_end_day: Joi.string().allow(''),
               category_id: Joi.number().required(),
               location: Joi.string().required(),
               latitude: Joi.string().required(),
               longitude: Joi.string().required(),
               abn_number: Joi.string(),
            }
         }
      };
      return validate;
   }

}
module.exports = adminJobRoutes;