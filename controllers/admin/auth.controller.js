"use strict";

const atob = require("atob");
const authModel = require('../../models/auth.model');
const userdeviceModel = require('../../models/usersdevices.model');
var jwt = require('jsonwebtoken');
const userTypes = require('../../consts/userTypes');
require('dotenv').config()

class AdminAuthController {
   constructor(app) {
      this.app = app;
   }

   /**
    * handler to authenticate user 
    **/
   authenticate(req, res, next) {
      var authModelObj = new authModel(this);
      var requestBody = req.body;
      var email = requestBody.email;
      var password = requestBody.password;
      var deviceToken = requestBody.device_token;
      var deviceType = requestBody.device_type;
      var userdeviceModelObj = new userdeviceModel(this);
      var loginResponse;
      authModelObj.authenticate(email, password,userTypes.admin).then((response) => {   
         loginResponse = response;
         if (deviceToken && deviceType) {
            var decodeToken = jwt.verify(response.token, process.env.JWT_SECRET);
            return userdeviceModelObj.insertUserDevice(decodeToken.user_id, deviceToken, deviceType);
         }
      }).then(() => {
         loginResponse.message = "User successfully authenticated";
         this.helper.sendSuccessResponse(res,loginResponse,{});
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

    refreshToken(req, res, next) {
        try {
            const token = req.body.token;
            console.log(token);
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace('-', '+').replace('_', '/');

            const decodeToken = JSON.parse(atob(base64));
            const objToSendInToken = { ...decodeToken };
            console.log(decodeToken);
            const refreshToken = jwt.sign(objToSendInToken, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRE_TIME
            });
            this.helper.sendSuccessResponse(res, { token: refreshToken }, {});
        }
        catch (error) {
            console.log(error);
            this.helper.sendFailureResponse(res, { message: 'Internal server error' });
        }
    }
}
module.exports = AdminAuthController;