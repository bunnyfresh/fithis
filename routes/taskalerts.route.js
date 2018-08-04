"use strict";

var taskAlertController = require("../controllers/taskAlert.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class taskAlertRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'useraccount';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let mount_point = mp;
      let taskalertControllerObj = new taskAlertController(this.app);
      this.app.post(mount_point + '/preferences/taskalert/add', this.app.route_filter.tokenMiddleware(), validate(this.validations.addTaskAlert), taskalertControllerObj.addTaskAlert);
      this.app.post(mount_point + '/preferences/taskalert/update', this.app.route_filter.tokenMiddleware(), validate(this.validations.updateTaskAlert), taskalertControllerObj.updateTaskAlert);
      this.app.post(mount_point + '/preferences/taskalert/delete', this.app.route_filter.tokenMiddleware(), validate(this.validations.deleteTaskAlert), taskalertControllerObj.deleteTaskAlert);
      this.app.get(mount_point + '/taskalerts/list', this.app.route_filter.tokenMiddleware(), validate(this.validations.getTaskAlertList), taskalertControllerObj.getTaskAlertList);
   }

   validations() {
      var validate = {
         getTaskAlertList: {
            options: { flatten: false },
            query: {
               pp: Joi.number(),
               pg: Joi.number(),
            }
         },
         deleteTaskAlert: {
            options: { flatten: false },
            body: {
               alertId: Joi.number().required(),
            }
         },
         addTaskAlert: {
            options: { flatten: false },
            body: {
               alert_type: Joi.number().valid(1, 2).required(),
               keyword: Joi.string().required(),
               distance: Joi.number(),
               suburb: Joi.string(),
               suburb_lat: Joi.number(),
               suburb_long: Joi.number()
            }
         },
         updateTaskAlert: {
            options: { flatten: false },
            body: {
               alertId: Joi.number().required(),
               alert_type: Joi.number().valid(1, 2).required(),
               keyword: Joi.string().required(),
               distance: Joi.number(),
               suburb: Joi.string(),
               suburb_lat: Joi.number(),
               suburb_long: Joi.number()
            }
         }
      };
      return validate;
   }
}
module.exports = taskAlertRoutes;