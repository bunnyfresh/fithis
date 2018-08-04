"use strict";
const userModel = require('../models/users.model');

class UserController {
   constructor(app) {
      this.app = app;
   }

   /**
    * Handler to create profile 
    **/
   createProfile(req, res, next) {
      try {
         var userId = req.token.user_id;
         var first_name = req.body.first_name;
         var last_name = req.body.last_name;
         var subUrb = req.body.subUrb;
         var asFixer = req.body.asFixer;
         var userModelObj = new userModel(this);
         var userData = {
            first_name: first_name,
            last_name: last_name,
            subUrb: subUrb,
            asFixer: asFixer,
         };
         userModelObj.createProfile(userId, userData).then((response) => {
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
    * handler to get user profile 
    * **/
   getProfile(req, res, next) {
      try {
         var userModelObj = new userModel(this);
         var userId = req.token.user_id;
         userModelObj.getUserProfile(userId).then((response) => {
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

   /**
    * verify user account
    **/
   verifyAccount(req, res, next) {
      try {
         var token = req.params.token;
         var userModelObj = new userModel(this);
         userModelObj.verifyEmail(token).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            switch (error.status){
                case '404':
                   this.helper.sendNotFoundResponse(res, error);
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


   /**
    * Upload profile pic 
    **/
   uploadProfilepic(req, res, next) {
      try {
         var userId = req.token.user_id;
         var profilePic = req.files.profilePic;
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

   /**
    * Upload cover pic 
    **/
   uploadCoverpic(req, res, next) {
      try {
         var userId = req.token.user_id;
         var coverPic = req.files.coverPic;
         var userModelObj = new userModel(this);
         userModelObj.uploadCoverpic(userId, coverPic).then((response) => {
            this.helper.sendSuccessResponse(res, response, {});
         }).catch((error) => {
            console.log(error);
            this.helper.sendFailureResponse(res, error);
         });
      } catch (error) {
         this.helper.sendFailureResponse(res, error);
      }

   }


   /** Function to change password**/
   changePassword(req, res, next) {
      try {
         var userId = req.token.user_id;
         var currentPassword = req.body.current_password;
         var newPassword = req.body.new_password;
         var userModelObj = new userModel(this);
         userModelObj.changeUserPassword(userId, currentPassword, newPassword).then((response) => {
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

   /** 
    * Handler to send OTP
    * **/
   sendOtp(req, res, next) {
      try {
         var userId = req.token.user_id;
         var mobile = req.body.mobile;
         var userModelObj = new userModel(this);
         userModelObj.sendOtp(userId, mobile).then((response) => {
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

   /** 
    * Handler to verify OTP
    * **/
   verifyOtp(req, res, next) {
      try {
         var userId = req.token.user_id;
         var otp = req.body.otp;
         var userModelObj = new userModel(this);
         userModelObj.verifyOtp(userId, otp).then((response) => {
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

   /**
    * Set online user status 
    **/
   setOnlineStatus(req, res, next) {
      try {
         var userId = req.token.user_id;
         var status = req.body.status;
         var userModelObj = new userModel(this);
         userModelObj.setOnlineStatus(userId, status).then((response) => {
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
module.exports = UserController;