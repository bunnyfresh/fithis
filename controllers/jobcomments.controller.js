"use strict";
const jobCommentsModel = require('../models/jobcomments.model');

class JobCommentsController {
   constructor(app) {
      this.app = app;
   }

   /**
    * Handler to post new comment
    **/
   postNewComment(req, res, next) {
      try {
         var userId = req.token.user_id;
         var jobCommentsModelObj = new jobCommentsModel(this);
         var commentData = {
            task_id: req.body.task_id,
            comment: req.body.comment,
            attatchment: req.files.attatchment,
            parent_comment_id: (!req.body.parent_comment_id || req.body.parent_comment_id == 0) ? null : req.body.parent_comment_id // if 0 is send then make it null
         };
         jobCommentsModelObj.postNewComment(userId, commentData).then((response) => {
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
    * Handler to get comments for task
    **/
   getCommentsList(req, res, next) {
      try {
         var jobCommentsModelObj = new jobCommentsModel(this);
         var taskId = req.query.task_id;
         var pp = (!isNaN(req.query.pp) && req.query.pp > 0) ? req.query.pp : 10;
         var pg = (!isNaN(req.query.pg) && req.query.pg >= 1) ? req.query.pg : 1;

         jobCommentsModelObj.getCommentList(taskId, pp, pg).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }


   }

}
module.exports = JobCommentsController;