"use strict";

var jobCommentsController = require("../controllers/jobcomments.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class jobCommentsRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'comments';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      //let mount_point = mp + '/' + this.name;
      let jobCommentsControllerObj = new jobCommentsController(this.app);
      this.app.post( mp+'/job/comment', validate(this.validations.postComment), this.app.route_filter.tokenMiddleware(), jobCommentsControllerObj.postNewComment);
      this.app.get( mp+'/job/comments',validate(this.validations.commentsList),this.app.route_filter.tokenMiddleware(), jobCommentsControllerObj.getCommentsList);
   }

   validations() {
      var validate = {
         postComment: {
            options: { flatten: false },
            body: {
               task_id: Joi.number().required(),
               comment: Joi.string().required(),
            }
         },
         commentsList:{
            options: { flatten: false },
            query: {
               task_id: Joi.number().required(),
               pp: Joi.number(),
               pg: Joi.number()
            }
         }
      };
      return validate;
   }

}
module.exports = jobCommentsRoutes;