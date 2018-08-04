"use strict";
const userModel = require('../models/users.model');
const authModel = require('../models/auth.model');
const userTypes = require('../consts/userTypes');
const userdeviceModel = require('../models/usersdevices.model');
var jwt = require('jsonwebtoken');

class AuthController {
   constructor(app) {
      this.app = app;
   }

   /**
    * handler to authenticate user 
    **/
   login(req, res, next) {
      var authModelObj = new authModel(this);
      var requestBody = req.body;
      var email = requestBody.email;
      var password = requestBody.password;
      var deviceToken = requestBody.device_token;
      var deviceType = requestBody.device_type;
      var userdeviceModelObj = new userdeviceModel(this);
      var loginResponse;
      authModelObj.authenticate(email, password, userTypes.appUser).then((response) => {
         loginResponse = response;
         if (deviceToken && deviceType) {
            var decodeToken = jwt.verify(response.token, process.env.JWT_SECRET);
            return userdeviceModelObj.insertUserDevice(decodeToken.user_id, deviceToken, deviceType);
         }
      }).then(() => {
         loginResponse.message = "User successfully authenticated";
         this.helper.sendSuccessResponse(res, loginResponse, {});
      }).catch((error) => {
        switch (error.status){
            case '404':
               this.helper.sendNotFoundResponse(res, error);
               break;
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
    * handler to handle login with social media 
    **/
   authSocial(req, res, next) {
      var authModelObj = new authModel(this);
      var requestBody = req.body;
      var socialSite = requestBody.social_site;
      var site_auth_token = requestBody.site_auth_token;
      var deviceToken = requestBody.device_token;
      var deviceType = requestBody.device_type;
      var userdeviceModelObj = new userdeviceModel(this);
      var loginResponse;
      authModelObj.authenticateSocial(socialSite, site_auth_token).then((response) => {
         loginResponse = response;
         if (deviceToken && deviceType) {
            var decodeToken = jwt.verify(response.token, process.env.JWT_SECRET);
            return userdeviceModelObj.insertUserDevice(decodeToken.user_id, deviceToken, deviceType);
         }
      }).then(() => {
         loginResponse.message = "User successfully authenticated";
         this.helper.sendSuccessResponse(res, loginResponse, {});
      }).catch((error) => {
        switch (error.status){
            case '404':
               this.helper.sendNotFoundResponse(res, error);
               break;
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
    * Function to get refresh token
    **/
   refreshToken(req, res, next) {
      try {
         var token = req.token;
         delete token.exp;
         delete token.iat;
         var refreshToken = jwt.sign(token, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE_TIME
         });
         this.helper.sendSuccessResponse(res, { refreshToken: refreshToken }, {});
      }
      catch (error) {
         this.helper.sendFailureResponse(res, { message: 'Internal server error' });
      }
   }

   /**
      * Function to logout
      **/
   logout(req, res, next) {
      try {
         var user_id = req.token.user_id;
         var deviceToken = req.body.device_token;
         var authModelObj = new authModel(this);
         authModelObj.logout(user_id, deviceToken).then((response) => {
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
    * Function to register user 
    **/
   register(req, res, next) {
      var requestBody = req.body;
      var email = requestBody.email;
      var password = requestBody.password;
      var deviceToken = requestBody.device_token;
      var deviceType = requestBody.device_type;
      var insertedUserId = null;
      var userModelObj = new userModel(this);
      var userdeviceModelObj = new userdeviceModel(this);

      // check is email is available to register
      userModelObj.checkMailInRecord(email).then((response) => {
         if (response.isInRecord) {
            this.helper.sendBadResponse(res, { message: 'This email is already taken' }, {});
         }
         // create user
         return userModelObj.createUser(email, password);
      }).then((response1) => {
         insertedUserId = response1.insertedId;
         if (deviceToken && deviceType) {
            // insert user device
            return userdeviceModelObj.insertUserDevice(insertedUserId, deviceToken, deviceType);
         }
      }).then(() => {
         var objToSendInToken = {
            user_id: insertedUserId,
            email: email,
            locale: 'en',
            isProfileCreated: false
         };
         var token = jwt.sign(objToSendInToken, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE_TIME
         });
         var responseObj = {
            'status': '200',
            'message': 'User successfully registered',
            'token': token
         };
         this.helper.sendSuccessResponse(res, responseObj, {});
      }).catch((error) => {
         switch (error.status){
             case '404':
                this.helper.sendNotFoundResponse(res, error);
                break;
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
    * Function to handle forgot password 
    **/
   forgotpassword(req, res, next) {
      var email = req.body.email;
      var authModelObj = new authModel(this);
      // check is email is available to register
      authModelObj.sendForgotPasswordEmail(email).then((response) => {
         this.helper.sendSuccessResponse(res, response, {});
      }).catch((error) => {
         switch (error.status){
            case '404':
               this.helper.sendNotFoundResponse(res, error);
               break;
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
    * Function to handle reset password 
    **/
   resetpassword(req, res, next) {
      var email = req.body.password;
      var token = req.params.token;
      var authModelObj = new authModel(this);
      // check is email is available to register
      authModelObj.resetPassword(token, email).then((response) => {
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
}
module.exports = AuthController;