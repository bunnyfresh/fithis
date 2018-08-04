"use strict";

var userSkillsController = require("../controllers/userSkills.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class userSkillsRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'userskills';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let mount_point = mp + '/' + this.name;
      let userSkillsControllerObj = new userSkillsController(this.app);
      this.app.get(mount_point + '/list', validate(this.validations.list), this.app.route_filter.tokenMiddleware(), userSkillsControllerObj.listSkills);
      this.app.post(mount_point + '/add', validate(this.validations.add), this.app.route_filter.tokenMiddleware(), userSkillsControllerObj.addSkill);
      this.app.post(mount_point + '/delete', validate(this.validations.delete), this.app.route_filter.tokenMiddleware(), userSkillsControllerObj.deleteSkill);
   }

   validations() {
      var validate = {
         list: {
            options: { flatten: false },
            body: {
               skillType: Joi.string()
            }
         },
         add: {
            options: { flatten: false },
            body: {
               skillType: Joi.string().required(),
               value: Joi.string().required()
            }
         },
         delete: {
            options: { flatten: false },
            body: {
               skillType: Joi.string().required(),
               value: Joi.string().required()
            }
         }
      };
      return validate;
   }

}
module.exports = userSkillsRoutes;