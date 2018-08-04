"use strict";

var notificationsController = require("../controllers/notifications.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class notificationsRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'notifications';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let mount_point =  mp + '/' + this.name;
      let notificationsControllerObj = new notificationsController(this.app);
      this.app.get(mount_point + '/list', validate(this.validations.notifications), this.app.route_filter.tokenMiddleware(), notificationsControllerObj.getNotificationsList);
   }

   validations() {
      var validate = {
         notifications: {
            options: { flatten: false },
            query: {
               pp: Joi.number(),
               pg: Joi.number()
            }
         }
      };
      return validate;
   }
}
module.exports = notificationsRoutes;