"use strict";
var Q = require('q');
var bcrypt = require('bcrypt');
var randomstring = require("randomstring");
var twilio = require('twilio');
var _ = require('lodash');
var userTypes = require('../consts/userTypes');
var notifcationModel = require("./notifications.model");
const baseModel = require("./base.model");
const feedbackModel = require("./feedbackrating");


class UsersModel extends baseModel {


   /**
   * Function to create user 
   * @param {string} username username of the user 
   * @param {string} password password of the user 
   * **/
   createUser(username, password) {
      var me = this;
      var q = Q.defer();
      try {
         var hashedPassword = bcrypt.hashSync(password, 10);
         var verification_token = randomstring.generate(10);
         var sql = `INSERT INTO users (email,password,verification_token) VALUES (:un,:pwd,:vt);
                    SELECT * FROM sys_mail_templates WHERE mail_id = 'verification' 
                    `;
         var insertParams = { un: username, pwd: hashedPassword, vt: verification_token };
         this.app.mysqldb.query(sql, insertParams).then(function (response) {
            var insertionResponse = response[0];
            var verificationmail = response[1][0];
console.log("VERIFICATION EMAIL", verificationmail);            
            if (insertionResponse.insertId) {
               var objNotificationModel = new notifcationModel(me.app);
               /** send account verification mail **/
               var verificationLink = process.env.CMS_DOMAIN + '/verify/' + verification_token;
console.log("VERIFICATION LINK", verificationLink);               
               var templateReplacements = { link: verificationLink };
               var mailObj = {
                  to: username,
                  html: me.app.helper.prepareBodyFromTemplate(verificationmail.html, templateReplacements),
                  text: me.app.helper.prepareBodyFromTemplate(verificationmail.text, templateReplacements),
                  subject: verificationmail.subject
               };
console.log("MAIL OBJECT", mailObj);               
               //add user role to acl
               me.app.route_filter.acl.addUserRoles(insertionResponse.insertId, 'appuser');
               // insert default notification settings
               objNotificationModel.insertDefaultNotificationSettings(insertionResponse.insertId).then(response => {
                  // send mail      
                  me.app.mailer.send(mailObj).then(() => {
                     q.resolve({ status: "SUCCESS", insertedId: insertionResponse.insertId });
                  }).catch(() => {
                     q.reject({ status: "404", msg: 'Faild mail verify' });
                  });
               }).catch(error => {
                  q.reject({ status: "404", msg: 'Failed Notification Setting' });
               });
            }
            else {
               //incorrect details
               q.reject({ status: "404", msg: 'Failed mail insert' });
            }
         }).catch(function (error) {
            q.reject({ status: "400", msg: 'Failed Query' });
         });
      }
      catch (error) {
         q.reject({ status: "500", msg: 'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to check if email already exists
    * @param {string} email 
    **/
   checkMailInRecord(email) {
      var q = Q.defer();
      var selectUserSql = "SELECT 1 FROM users WHERE email = :em";
      var selectUserParams = { em: email };
      this.app.mysqldb.query(selectUserSql, selectUserParams).then(function (resultSet) {
         if (resultSet.length > 0) {
            q.resolve({ status: "SUCCESS", isInRecord: true });
         }
         else {
            q.resolve({ status: "SUCCESS", isInRecord: false });
         }
      }).catch(function () {
         q.reject({ status: "500", message: 'Internal server error' }); //error. what happened?
      });
      return q.promise;
   }


   /**
    * Function to verify email 
    **/
   verifyEmail(verification_token) {
      var q = Q.defer();
      try {
         var updateUserSql = "UPDATE users SET verification_token = NULL , account_status = 1,updated_at=NOW() WHERE verification_token = :vt ";
         var sqlParams = { vt: verification_token };
         this.app.mysqldb.query(updateUserSql, sqlParams).then(function (resultSet) {
            if (resultSet.affectedRows > 0) {
               q.resolve({ status: "SUCCESS" });
            }
            else {
               q.reject({ status: "404", message: 'Unable to verify account' });
            }
         }).catch(function () {
            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }


   /** 
   * Function to get user profile 
   * @param {int} userId id of the user for whom profile is to be fetched
   ** */
   getUserProfile(userId) {
      var q = Q.defer();
      var me = this;
      try {
         var selectUserSql = "SELECT * FROM users u LEFT JOIN user_profile up ON up.user_id = u.id  WHERE id = :uid";
         var selectUserParams = { uid: userId };
         this.app.mysqldb.query(selectUserSql, selectUserParams).then(function (resultSet) {
            if (resultSet.length > 0) {
               var row = resultSet[0];
               var objFeedback = new feedbackModel(me.app);
               objFeedback.getUserFeedbackData(userId).then(response => {
                  var data = {
                     email: row.email,
                     first_name: row.first_name,
                     last_name: row.last_name,
                     contact: row.mobile_number,
                     location: row.location,
                     is_fixer: row.is_fixer,
                     profile_pic: me.app.helper.serverUrl({
                        partialUrl: row.profile_pic
                     }),
                     ratings: response.rating
                  };
                  q.resolve({ status: "SUCCESS", data: data });
               }).catch(error => {

                  q.reject({ status: "500", message: "Internal Server error" });
               });
            }
            else {
               q.reject({ status: "400", message: "Unable to find profile" });
            }
         }).catch(function (error) {
            q.reject({ status: "500", message: "Internal server error" });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: "Internal server error" });
      }
      return q.promise;

   }


   /**
    * Function to create user profile 
    * @param {int} userId id of the user for whom profile is to be created
    * @param {object} userData User data that is to be 
    **/
   createProfile(userId, userData) {
      var q = Q.defer();
      try {
         var updateUserSql = `UPDATE users SET first_name = :fn,last_name=:ln,updated_at=NOW() WHERE id=:uId;
                              INSERT INTO user_profile (user_id,location,is_fixer) VALUES(:uId,:loc,:af) ON DUPLICATE KEY UPDATE 
                                 location=:loc,is_fixer=:af`;

         var sqlParams = { uId: userId, fn: userData.first_name, ln: userData.last_name, af: userData.asFixer, loc: userData.subUrb };

         this.app.mysqldb.query(updateUserSql, sqlParams).then(function (resultSet) {
            q.resolve({ status: "SUCCESS", message: "Profile successully updated" });
         }).catch(function () {
            q.reject({ status: "ERROR", message: 'Internal server error' });
         });
         return q.promise;
      }
      catch (error) {
         q.reject({ status: "ERROR", message: 'Internal server error' });
      }
   }


   /**
    * Function to verify otp 
    * @param {int}userId id of the user for whom OTP is to be verified
    * @param {int}otp OTP to be verified 
   */
   verifyOtp(userId, otp) {
      /**
       * @notes : Token is set to -1 after it si successfully verified 
       * **/
      var q = Q.defer();
      try {
         var sql = `SELECT mobile_verification_token FROM users WHERE id = ?`;
         this.app.mysqldb.query(sql, [userId]).then(response => {
            if ((response[0].mobile_verification_token == otp)) {
               var sql = `UPDATE users SET mobile_verification_token = :mvt,updated_at=NOW() WHERE id = :uid;
                          UPDATE user_profile SET is_mobile_verified =1 WHERE user_id =:uid`;

               this.app.mysqldb.query(sql, { mvt: null, uid: userId }).then(response => {
                  q.resolve({ status: "SUCCESS", message: 'OTP successfully verified' });
               }).catch((error) => {
                  q.reject({ status: "500", 'message': 'Internal server error' });
               });
            }
            else {
               q.reject({ status: "400", message: "Invalid verification token" });
            }
         }).catch((error) => {

            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {

         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }



   /** Function to send otp
   * @param {int} userId id of user to whom OTP is to be sent
   * @param {string} mobile mobile of user
   **/
   sendOtp(userId, mobile) {
      var q = Q.defer();
      var twilioClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTHTOKEN);
      try {
         var token = Math.floor(100 + Math.random() * 900);
         var sql = `UPDATE user_profile SET mobile_number = :mn WHERE user_id = :uid ;
                    UPDATE users SET mobile_verification_token = :mt,updated_at=NOW() WHERE id =  :uid`;
         this.app.mysqldb.query(sql, { uid: userId, mn: mobile, mt: token }).then(multiResponse => {
            if (multiResponse[1].affectedRows > 0) {
               var phnNumber = process.env.TWILIO_COUNTRY_CODE + mobile;
               twilioClient.messages.create({
                  body: 'Your OTP for FixThis is ' + token,
                  to: phnNumber,
                  from: process.env.TWILIO_NUMBER
               }).then(response => {
                  q.resolve({ status: "SUCCESS", message: 'OTP successfully sent' });
               }).catch((error) => {
                  q.reject({ status: "400", message: 'Error sending OTP' });
               });
            }
            else {
               q.reject({ status: "400", message: "Mobile number is not added for this profile" });
            }
         }).catch((error) => {

            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {

         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to update user password
    * @param {int} userId id of the use for whom password is to be changed
    * @param {int} userId id of the use for whom password is to be changed
    **/
   changeUserPassword(userId, currentPassword, newPassword) {
      var q = Q.defer();
      var me = this;
      try {
         //go to our databse and ask if we have a username password match
         var selectUserSql = "SELECT password FROM users WHERE id = :uid;";
         var selectUserParams = { uid: userId };
         this.app.mysqldb.query(selectUserSql, selectUserParams).then(function (resultSet) {
            if (resultSet.length > 0) {
               var userRow = resultSet[0];
               bcrypt.compare(currentPassword, userRow.password).then((res) => {
                  if (res) {
                     if (userRow.account_status == 0) {
                        q.reject({ status: "400", message: "Your account is not verifed." });
                     }
                     else {
                        //update new password
                        var hashedPassword = bcrypt.hashSync(newPassword, 10);
                        var updatePasswordSql = 'UPDATE users SET password=:pwd WHERE id=:uid:';
                        me.app.mysqldb.query(updatePasswordSql, { uid: userId, pwd: hashedPassword }).then(response => {
                           q.resolve({ status: "SUCCESS", message: "Password updated successfully" });
                        }).catch(error => {

                           q.reject({ status: "500", message: 'Internal server error' });
                        });
                     }
                  }
                  else {
                     q.reject({ status: "400", message: "Current Password is incorrect" });
                  }
               }).catch(error => {
                  q.reject({ status: "500", message: 'Internal server error' });
               });
            }
            else {
               //incorrect details
               q.reject({ status: "400", message: "Invalid credentials" });
            }
         }).catch(function () {
            q.reject({ status: "500",message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }


   /** Function to upload cover pic
       * @param {int} userId id of the user for whom cover pic is to be uploaded
       * @param {file} coverPic upload profile pic
       **/
   uploadCoverpic(userId, coverPic) {
      var q = Q.defer();
      var me = this;
      try {
         if (!coverPic) {
            q.resolve({ status: "SUCCESS", "message": "No cover pic to upload" });
            return q.promise;
         }
         var uploadFileObj = {
            "destination": 'uploads/users/',
            "tempFile": coverPic.path,
            "uploadedFileName": coverPic.name,
            "nameOnFileSystem": userId,
         };
         var uploadedCoverPic = null;
         this.app.helper.uploadFile(uploadFileObj).then(response => {
            var sql = `UPDATE user_profile SET cover_pic = ?,upd= NOW() WHERE user_id = ?`;
            uploadedCoverPic = uploadFileObj.destination + response.uploadedFile;
            return this.app.mysqldb.query(sql, [uploadFileObj.destination + response.uploadedFile, userId]);
         }).then(response => {
            var imageInfo = {
               path: me.app.helper.serverUrl({
                  partialUrl: uploadedCoverPic
               })
            };
            q.resolve({ status: "SUCCESS", message: "Cover pic uploaded successfully", data: imageInfo });
         }).catch((error) => {
            q.reject({ status: "ERROR", message: 'Internal Server Error' });
         });
      }
      catch (error) {
         q.reject({ status: "ERROR", message: 'Internal Server Error' });
      }
      return q.promise;
   }

   /** Function to upload profile pic
    * @param {int} userId id of the user for whom profilepic is to be uploaded
    * @param {file} profilePic upload profile pic
    **/
   uploadProfilepic(userId, profilePic) {
      var q = Q.defer();
      var uploadedProfilePic = null;
      try {
         var me = this;
         if (!profilePic) {
            q.resolve({ status: "SUCCESS", "message": "No profile pic to upload" });
            return q.promise;
         }
         var uploadFileObj = {
            "destination": 'uploads/users/',
            "tempFile": profilePic.path,
            "uploadedFileName": profilePic.name,
            "nameOnFileSystem": userId,
         };
         this.app.helper.uploadFile(uploadFileObj).then(response => {
            var sql = `UPDATE user_profile SET profile_pic = ?,upd= NOW() WHERE user_id = ?`;
            uploadedProfilePic = uploadFileObj.destination + response.uploadedFile;
            return this.app.mysqldb.query(sql, [uploadedProfilePic, userId]);
         }).then(response => {
            var imageInfo = {
               path: me.app.helper.serverUrl({
                  partialUrl: uploadedProfilePic
               })
            };
            q.resolve({ status: "SUCCESS", "message": "Profile pic uploaded successfully", data: imageInfo });
         }).catch((error) => {
            q.reject({ status: "ERROR", message: 'Internal Server Error' });
         });

      }
      catch (error) {
         q.reject({ status: "ERROR", message: 'Internal Server Error' });
      }
      return q.promise;
   }


   /**
    * Function to get user conversation
     * @param {number} pp records per page
     * @param {number} pg page number
     * @param {object} filters filters for search
    * **/
   getUserList(pp, pg, filters) {
      var q = Q.defer();
      var me = this;

      var statusIdMap = {
         'active': '1',
         'inactive': '0',
      };


      var typeFieldMap = {
         'fixer': '1',
         'poster': '0',
      };

      try {

         var rowCount = pp;
         var offset = (pg - 1) * pp;

         var whereQuery = `user_type = ${userTypes.appUser} `;

         /** Implements filtering **/
         if (filters.search_key) {
            var search_key = filters.search_key;
            whereQuery = whereQuery + `AND (CONCAT(u.first_name,' ',u.last_name) LIKE ${me.escape('%' + search_key + '%')}
                                             OR u.email LIKE ${me.escape('%' + search_key + '%')})`;
         }

         // filtering for user status
         switch (filters.status) {
            case 'active':
            case 'inactive':
               whereQuery = whereQuery + `  AND account_status = ${statusIdMap[filters.status]} AND is_deleted = 0`;
               break;
            case 'deleted':
               whereQuery = whereQuery + `AND is_deleted = 1`;
               break;
            default:
               whereQuery = whereQuery + `AND is_deleted = 0`;
               break;
         }

         // filtering for user_type
         if (filters.user_type) {
            whereQuery = whereQuery + ` AND is_fixer = ${typeFieldMap[filters.user_type]}`;
         }

         var sql = `SELECT * 
                    FROM users u 
                    LEFT JOIN user_profile up ON u.id = up.user_id 
                    WHERE ${whereQuery}
                    ORDER by ${filters.sort_field} ${filters.sort_order}`;

         let limitClause = " LIMIT " + offset + "," + rowCount + ";";

         var sql2 = `#Get total record counts
                     SELECT COUNT(id) as records_count                 
                     FROM users u
                     LEFT JOIN user_profile up ON u.id = up.user_id 
                     WHERE ${whereQuery}`;

         let normalQuery = sql + limitClause;
         let countQuery = sql2;
         const finalSql = normalQuery + countQuery;
         var sqlParams = {};
         this.app.mysqldb.query(finalSql, sqlParams).then(function (multiRowset) {

            var usersList = [];
            _.each(multiRowset[0], function (userRow) {
               usersList.push({
                  first_name: userRow.first_name,
                  last_name: userRow.last_name,
                  id: userRow.id,
                  email: userRow.email,
                  account_status: userRow.account_status,
                  tagline: userRow.tagline,
                  about: userRow.about,
                  mobile_number: userRow.mobile_number,
                  birth_date: userRow.birth_date,
                  location: userRow.location,
                  crd: Date.parse(userRow.created_at),
               });
            });

            var metaInfo = {
               "total": (multiRowset[1].length > 0) ? multiRowset[1][0].records_count : 0,
               "pg": pg,
               "pp": rowCount,
               "totalInPage": multiRowset[0].length
            };
            var returnSet = {
               users: usersList,
               meta: metaInfo
            };

            var message = _.isEmpty(usersList) ? "No users available" : "Fetched Users sucessfully.";
            q.resolve({ status: "SUCCESS", message: message, data: returnSet });
         }).catch(function (error) {

            q.reject({ status: "ERROR", message: 'Internal Server Error' });
         });
      }
      catch (error) {

         q.reject({ status: "ERROR", message: 'Internal Server Error' });
      }
      return q.promise;
   }

   /**
    * Function to set online user status
    * @param {int} userId id of user for whom status is to be set
    * @param {int} status online status 
    **/
   setOnlineStatus(userId, status) {
      var q = Q.defer();
      try {
         var columnsToUpdate = [`online_status=${status}`];
         if (status == '1') {
            columnsToUpdate.push(`last_online=NOW()`);
         }
         var sql = `UPDATE users SET ${columnsToUpdate.join(',')} WHERE id = ?`;
         this.app.mysqldb.query(sql, [userId]).then(response => {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: 'Status successfully set' });
            }
            else {
               q.reject({ status: "400", message: 'Error setting status' });
            }
         }).catch((error) => {
            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }

   /**
  * Function to set  user status
  * @param {int} userId id of user for whom status is to be set
  * @param {int} status status to set
  **/
   updateUserStatus(userId, status) {
      var q = Q.defer();
      try {

         var columnsToUpdate = [`account_status=${status}`];
         var sql = `UPDATE users SET ${columnsToUpdate.join(',')} WHERE id = ?`;
         this.app.mysqldb.query(sql, [userId]).then(response => {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: 'Status successfully set' });
            }
            else {
               q.reject({ status: "400", message: 'Error setting status' });
            }
         }).catch((error) => {
            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }
   /**
  * Function to set  user status
  * @param {int} userId id of user for whom status is to be set
  * @param {int} status status to set
  **/
   deleteUser(userId) {
      var q = Q.defer();
      try {

         var columnsToUpdate = [`is_deleted=1`];
         var sql = `UPDATE users SET ${columnsToUpdate.join(',')} WHERE id = ? 
                    AND user_type != ${userTypes.admin}`;
         this.app.mysqldb.query(sql, [userId]).then(response => {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: 'User successfully deleted' });
            }
            else {
               q.reject({ status: "400", message: 'Error deleting user' });
            }
         }).catch((error) => {
            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }
}

module.exports = UsersModel;


