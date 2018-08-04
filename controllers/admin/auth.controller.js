"use strict";

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
}
module.exports = AdminAuthController;