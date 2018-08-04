"use strict";
const messagesModel = require('../models/messages.model');

class messagesController {
   constructor(app) {
      this.app = app;
   }

   /**
    * Handler to send new message
    **/
   sendMessage(req, res, next) {
      var userId = req.token.user_id;
      var messagesModelObj = new messagesModel(this);
      var messageData = {
         to_user: req.body.to_user,
         job_id: req.body.job_id,
         message: req.body.message,
         from_user: userId
      };
      messagesModelObj.postNewMessage(messageData).then((response) => {
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
    * Handler to get conversations
    **/
   getConversation(req, res, next) {
      var userId = req.token.user_id;
      var pp = (!isNaN(req.query.pp) && req.query.pp > 0) ? req.query.pp : 10;
      var pg = (!isNaN(req.query.pg) && req.query.pg >= 1) ? req.query.pg : 1;
      var job_id = req.query.job_id;
      var with_user = req.query.with_user;
      var messagesModelObj = new messagesModel(this);
      var conversationData = {
         userId: userId,
         withUser: with_user,
         jobId: job_id
      };
      messagesModelObj.getConversation(conversationData, pp, pg).then((response) => {
         this.helper.sendSuccessResponse(res, response, {});
      }).catch((error) => {
         this.helper.sendFailureResponse(res, error);
      });
   }

   /**
     * Handler to get user inbox
     **/
   getUserInbox(req, res, next) {
      var userId = req.token.user_id;
      var pp = (!isNaN(req.query.pp) && req.query > 0) ? req.query.pp : 10;
      var pg = (!isNaN(req.query.pg) && req.query >= 1) ? req.query.pg : 1;
      var messagesModelObj = new messagesModel(this);
      messagesModelObj.getUserInbox(userId, pp, pg).then((response) => {
         this.helper.sendSuccessResponse(res, response, {});
      }).catch((error) => {
         this.helper.sendFailureResponse(res, error);
      });
   }
}
module.exports = messagesController;