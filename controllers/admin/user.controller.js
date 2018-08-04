"use strict";
const userModel = require('../../models/admin/users.model');
const userAccountModel = require('../../models/usersaccount.model');

class adminUserController {
   constructor(app) {
      this.app = app;
   }

   /**
    * function to get user list
    * **/
   getUsersList(req, res, next) {
      try {
         var userModelObj = new userModel(this);
         //var userId = req.token.user_id;

         var pp = (!isNaN(req.query.pp) && req.query.pp > 0) ? req.query.pp : 10;
         var pg = (!isNaN(req.query.pg) && req.query.pg >= 1) ? req.query.pg : 1;

         var filters = {
            search_key: req.query.search_key || null,
            sort_field: req.query.sort_field || 'created_at',
            sort_order: req.query.sort_order || 'desc',
            status: req.query.status || 'default', // hack to ignore this filter if nothing is selected
            user_type: req.query.user_type || null,
         };

         userModelObj.getUserList(pp, pg, filters).then((response) => {
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
   * function to set user status
   * **/
   setUserStatus(req, res, next) {
      try {
         var userModelObj = new userModel(this);
         var userId = req.body.userId;
         var status = req.body.status;
         userModelObj.updateUserStatus(userId, status).then((response) => {
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
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }

   }

   /**
   * function to delete user 
   * **/
   deleteUser(req, res, next) {
      try {
         var userModelObj = new userModel(this);
         var userId = req.body.userId;
         userModelObj.deleteUser(userId).then((response) => {
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
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }

   }

   /**
    * function to get user details
    * **/
   userDetails(req, res, next) {
      try {
         var userAccountModelObj = new userAccountModel(this);
         var userId = req.query.userId;
         userAccountModelObj.getCompleteAccountProfile(userId).then((response) => {
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
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }
   }


   /**
    * function to handle user 
    * **/
   handleUser(req, res, next) {
      try {
         var userModelObj = new userModel(this);
         var userData = req.body;
         userData.profilePic = req.files.profile_pic;
         userData.coverPic = req.files.cover_pic;
         userModelObj.handleUserAdmin(userData).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         this.helper.sendFailureResponse(res, error);
      }
   }

   /** Upload user profile pic**/
   uploadUserPic(req, res, next) {
      try {
         var userId = req.body.user_id;
         var profilePic = req.files.profile_pic;
         var userModelObj = new userModel(this);
         userModelObj.uploadProfilepic(userId, profilePic).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      } catch (error) {
         this.helper.sendFailureResponse(res, error);
      }
   }
   /** Upload user profile pic**/
   uploadUserCoverPic(req, res, next) {
      try {
         var userId = req.body.user_id;
         var profilePic = req.files.cover_pic;
         var userModelObj = new userModel(this);
         userModelObj.uploadCoverpic(userId, profilePic).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            this.helper.sendFailureResponse(res, error);
         });
      } catch (error) {
         this.helper.sendFailureResponse(res, error);
      }
   }

   /** Reset user password **/
   resetUserPassword(req, res, next) {
      try {
         var userId = req.body.user_id;
         var userModelObj = new userModel(this);
         userModelObj.resetUserPassword(userId).then((response) => {
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
      } catch (error) {
         this.helper.sendFailureResponse(res, error);
      }
   }

}
module.exports = adminUserController;