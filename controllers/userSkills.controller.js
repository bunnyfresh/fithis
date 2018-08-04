"use strict";
const userSkillsModel = require('../models/userSkills.model');

class userSkillsController {
   constructor(app) {
      this.app = app;
   }

   /**
    * Handler to list skills
    **/
   listSkills(req, res, next) {
      var userId = req.token.user_id;
      var skill = (req.query)?req.query.skillType:null;
      var userSkillsModelObj = new userSkillsModel(this);
      userSkillsModelObj.getUserSkills(userId, skill).then((response) => {
        this.helper.sendSuccessResponse(res,response,{});
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
    * Handler to add skill
    **/
   addSkill(req, res, next) {
      var userId = req.token.user_id;
      var skill = req.body.skillType;
      var value = req.body.value;
      var userSkillsModelObj = new userSkillsModel(this);
      userSkillsModelObj.addUserSkill(userId, skill, value).then((response) => {
        this.helper.sendSuccessResponse(res,response,{});
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
   * Handler to delete skill
   **/
   deleteSkill(req, res, next) {
      var userId = req.token.user_id;
      var skill = req.body.skillType;
      var value = req.body.value;
      var userSkillsModelObj = new userSkillsModel(this);
      userSkillsModelObj.deleteUserSkill(userId, skill, value).then((response) => {
        this.helper.sendSuccessResponse(res,response,{});
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
module.exports = userSkillsController;