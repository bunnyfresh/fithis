"use strict";
var Q = require('q');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var randomstring = require("randomstring");
var httpClient = require('rest');
var socialSites = require("../consts/socialsites");
var userModel = require('./users.model');
var notifcationModel = require("./notifications.model");
const baseModel = require("./base.model");
var userType = require('../consts/userTypes');

class AuthModel extends baseModel {

   /**
  * Function to authenticate user 
  * @param {string} username username of the user 
  * @param {string} password password of the user 
  * @param {string} userType type of user
  * **/
   authenticate(username, password, userType) {
      var q = Q.defer();
      var me = this;
      try {
         //go to our databse and ask if we have a username password match
         var selectUserSql = `SELECT u.*,up.*,sut.role,IFNULL(sal.lan_code,'en') AS locale 
                              FROM users u 
                              JOIN sys_user_types sut on sut.id = u.user_type
                              LEFT JOIN user_profile up ON u.id = up.user_id
                              LEFT JOIN sys_app_languages sal ON sal.id = up.app_language
                              WHERE email = :uid AND user_type=:ut ;`;
         var selectUserParams = { uid: username, ut: userType };
         this.app.mysqldb.query(selectUserSql, selectUserParams).then(function (resultSet) {
            if (resultSet.length > 0) {
               var userRow = resultSet[0];
               bcrypt.compare(password, userRow.password).then((res) => {
                  if (res) {
                     if (userRow.account_status == 0) {
                        q.reject({ status: "400", message: "Your account is not verifed." });
                     }
                     else {
                        // update last logged in time
                        var currentEpoch = Math.floor(new Date() / 1000);
                        var updateUserSql = "UPDATE users SET last_logged_in = :lli WHERE email = :em";
                        var sqlParams = { em: username, lli: currentEpoch };
                        me.app.mysqldb.query(updateUserSql, sqlParams).then(function () {
                           //user exists and password matches
                           var objToSendInToken = {
                              user_id: userRow.id,
                              email: userRow.email,
                              locale: userRow.locale,
                              isProfileCreated: (userRow.first_name == null) ? false : true
                           };

                           var token = jwt.sign(objToSendInToken, process.env.JWT_SECRET, {
                              expiresIn: process.env.JWT_EXPIRE_TIME
                           });

                           var userInfo = { "location": userRow.location };

                           me.app.route_filter.acl.addUserRoles(userRow.id, userRow.role);
                           q.resolve({ status: "SUCCESS", token: token, userInfo: userInfo });
                        }).catch(function () {
                           q.reject({ status: "500", message: 'Internal server error' });
                        });
                     }
                  }
                  else {
                     q.reject({ status: "500", message: "Invalid credentials" });
                  }
               }).catch(error => {
                  q.reject({ status: "500", message: 'Internal server error' });
               });
            }
            else {
               //incorrect details
               q.reject({ status: "500", message: "Invalid credentials" });
            }
         }).catch(function () {
            q.reject({ status: "400", message:'Failed select sql' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message:'Internal Sever error' });
      }
      return q.promise;
   }


   /**
   * Function to authenticate user 
   * @param {string} social_site social site with which to login 
   * @param {string} site_auth_token auth token of site 
   * **/
   authenticateSocial(social_site, site_auth_token) {
      var q = Q.defer();
      var me = this;
      try {
         var access_token = site_auth_token;
         var verifyLinks = {
            fb: 'https://graph.facebook.com/me?fields=id,name,email&access_token=',
            google: 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token='
         };
         var idFields = {
            fb: 'id',
            google: 'user_id',
         };
         // make request to facebook auth
         var socialAuthUrl = verifyLinks[social_site] + `${access_token}`;
         httpClient({ method: 'GET', path: socialAuthUrl }).then(httpResponse => {
            var socialLoginResponse = JSON.parse(httpResponse.entity);
            //handle error for invalid token
            if (socialLoginResponse.error) {
               q.reject({ status: "400", message: 'Access token is invalid' });
            }
            else {
               var user_id = socialLoginResponse[idFields[social_site]];
               var email = socialLoginResponse.email;
               var selectUserSql = "SELECT * FROM users WHERE email = :uid;";
               var selectUserParams = { uid: email };
               var userInfo = {};
               var token = null;
               me.app.mysqldb.query(selectUserSql, selectUserParams).then(function (resultSet) {
                  var sql = '';
                  var params = {};
                  var currentEpoch = Math.floor(new Date() / 1000);
                  if (resultSet.length > 0) {
                     // update details and valid login
                     sql = `UPDATE users SET social_site = :ss , social_site_id=:ssi,account_status = 1,last_logged_in=:lli  WHERE email = :em ;`;
                  }
                  else {
                     // do register
                     sql = `INSERT INTO users (email,last_logged_in,social_site,social_site_id,account_status,updated_at) 
                           VALUES (:em,:lli,:ss,:ssi,1,NOW()); `;
                  }
                  sql += `SELECT u.id,email,first_name ,up.location,sut.role
                          FROM users u 
                          JOIN sys_user_types sut on sut.id = u.user_type
                          LEFT JOIN user_profile up ON u.id = up.user_id
                          WHERE email = :em AND user_type=${userType.appUser};
                          INSERT INTO user_social_info (user_id,site_id,site_token) VALUES((SELECT id FROM users WHERE email = :em),:ss,:ssi) ON DUPLICATE KEY UPDATE site_token=values(site_token)`;
                  params = { ss: socialSites[social_site], ssi: user_id, lli: currentEpoch, em: email };
                  return me.app.mysqldb.query(sql, params);
               }).then((response) => {

                  // is user is registered user then insert notification settings 
                  if (response[0].insertId) {
                     var objNotificationsModel = new notifcationModel(me.app);
                     objNotificationsModel.insertDefaultNotificationSettings(response[1][0].id).catch((error) => {
                        q.reject({ status: "500", message: 'Internal server error' });
                     });
                  }

                  me.app.route_filter.acl.addUserRoles(response[1][0].id, response[1][0].role);
                  //user exists and password matches
                  var objToSendInToken = {
                     user_id: response[1][0].id,
                     email: response[1][0].email,
                     locale: "en",
                     isProfileCreated: (response[1][0].first_name == null) ? false : true
                  };
                  token = jwt.sign(objToSendInToken, process.env.JWT_SECRET, {
                     expiresIn: process.env.JWT_EXPIRE_TIME
                  });
                  userInfo = { "location": response[1][0].location };
                  q.resolve({ status: "SUCCESS", token: token, userInfo: userInfo });
               }).catch(function (error) {
                  q.reject({ status: "500", message: 'Internal server error' });
               });
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
    * Function to send mail for forgot password
    * @param {string} email email of the user 
    **/
   sendForgotPasswordEmail(email) {
      var q = Q.defer();
      var me = this;
      var userModelObj = new userModel(this.app);
      try {
         userModelObj.checkMailInRecord(email).then((response) => {
            if (response.isInRecord) {
               var reset_token = randomstring.generate(10);
               var currentEpoch = Math.floor(new Date() / 1000);
               var updateUserSql = `UPDATE users SET reset_token = :rt , reset_token_time = :ce WHERE email = :em;
                                    SELECT * FROM sys_mail_templates WHERE mail_id = 'forgot_password'`;
               var sqlParams = { rt: reset_token, ce: currentEpoch, em: email };
               this.app.mysqldb.query(updateUserSql, sqlParams).then(function (response) {
                  var emailTemplate = response[1][0];
                  /** send account verification mail **/
                  var resetLink = process.env.CMS_DOMAIN + '/resetpassword/' + reset_token;
                  var templateReplacements = { link: resetLink };
                  var mailObj = {
                     to: email,
                     html: me.app.helper.prepareBodyFromTemplate(emailTemplate.html, templateReplacements),
                     text: me.app.helper.prepareBodyFromTemplate(emailTemplate.text, templateReplacements),
                     subject: emailTemplate.subject
                  };
                  me.app.mailer.send(mailObj).then(() => {
                     q.resolve({ status: "SUCCESS", message: 'Reset instructions sent to the provided mail' });
                  }).catch(() => {
                     q.reject({ status: "404", message: 'Failed reset'});
                  });

               }).catch(function (error) {
                  q.reject({ status: "505", message: 'Internal server error' });
               });
            }
            else {
               q.reject({ status: "400", message: 'Email does not exists' });
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
    * Function to logout
    * @param {number} userId id of the user
    * @param {string} device_token device token 
    * **/
   logout(userId, device_token) {
      var q = Q.defer();
      try {
         var updateUserSql = `DELETE FROM user_devices WHERE user_id=:uid AND device_token=:dt`;
         var sqlParams = { dt: device_token, uid: userId };
         this.app.mysqldb.query(updateUserSql, sqlParams).then(function (response) {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: "User successfully logout" });
            }
            else {
               q.reject({ status: "400", message: "Error logging out user" });
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
    * Function to resetpassword
    * @param {string} token reset token of the user 
    * @param {string} password new password 
    * **/
   resetPassword(token, password) {
      var q = Q.defer();
      try {
         var hashedPassword = bcrypt.hashSync(password, 10);
         // constraint of 24 hours 
         var epochBefore24Hours = Math.floor(new Date() / 1000) - 24 * 60 * 60;
         var updateUserSql = `UPDATE users SET password = :pwd, updated_at = NOW(),reset_token=NULL ,reset_token_time=NULL WHERE reset_token = :rt AND reset_token_time > :rtt ;`;
         var sqlParams = { rt: token, pwd: hashedPassword, rtt: epochBefore24Hours };
         this.app.mysqldb.query(updateUserSql, sqlParams).then(function (response) {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: "Password successfully reset" });
            }
            else {
               q.reject({ status: "400", message: "Reset link is not valid" });
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
}

module.exports = AuthModel;


