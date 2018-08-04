"use strict";
var Q = require('q');
const baseModel = require("./base.model");

class UsersdevicesModel extends baseModel {

   /**
    * Function get user devices
    * @param {number} userId id of the user for whom devices are to be found 
    **/
   getUserDevices(userId) {
      var q = Q.defer();
      try {
         var selectUserDevice = "SELECT GROUP_CONCAT(device_token) as device_token,device_type FROM user_devices WHERE user_id = :uid GROUP BY device_type";
         var sqlParams = { uid: userId };
         this.app.mysqldb.query(selectUserDevice, sqlParams).then(function (response) {
            if (response.length > 0) {
               q.resolve(response);
            }
            else {
               q.reject([]);
            }
         }).catch(function (error) {
            q.reject([]);
         });
      }
      catch (error) {
         q.reject([]);
      }
      return q.promise;
   }



   /**
    * Function to authenticate user 
    * @param {number} userId id of the user
    * @param {string} deviceToken device token
    * @param {string} deviceType Type of the device
    * **/
   insertUserDevice(userId, deviceToken, deviceType) {
      var q = Q.defer();
      try {
         var insertUserDevice = "INSERT INTO user_devices (user_id,device_token,device_type) VALUES (:uid,:dto,:dty) ON DUPLICATE KEY UPDATE crd = NOW()";
         var sqlParams = { uid: userId, dto: deviceToken, dty: deviceType };
         this.app.mysqldb.query(insertUserDevice, sqlParams).then(function (response) {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS" });
            }
            else {
               q.reject({ status: "404" ,msg: 'Failed insert userdevice' });
            }
         }).catch(function (error) {
            q.reject({ status: "400", msg: 'Failed Query' });
         });
      }
      catch (error) {
         q.reject({ status: "500", msg: 'Internal Server Error' });
      }
      return q.promise;
   }

}

module.exports = UsersdevicesModel;


