"use strict";

var messagesController = require("../controllers/messages.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class messagesRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'messages';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let mount_point = mp + '/' + this.name;
      let messagesControllerObj = new messagesController(this.app);
      this.app.post(mount_point + '/send', validate(this.validations.send), this.app.route_filter.tokenMiddleware(), messagesControllerObj.sendMessage);
      this.app.get(mount_point + '/inbox', validate(this.validations.inbox), this.app.route_filter.tokenMiddleware(), messagesControllerObj.getUserInbox);
      this.app.get(mount_point + '/conversation', validate(this.validations.conversation), this.app.route_filter.tokenMiddleware(), messagesControllerObj.getConversation);
   }

   validations() {
      var validate = {
         send: {
            options: { flatten: false },
            body: {
               job_id: Joi.number().required(),
               message: Joi.string().required(),
               to_user: Joi.number().required()
            }
         },
         inbox: {
            options: { flatten: false },
            query: {
               pp: Joi.number(),
               pg: Joi.number()
            }
         },
         conversation: {
            options: { flatten: false },
            query: {
               with_user: Joi.number().required(),
               job_id: Joi.string().required(),
               pp: Joi.number(),
               pg: Joi.number()
            }
         }
      };
      return validate;
   }

}
module.exports = messagesRoutes;