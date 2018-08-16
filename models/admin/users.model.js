"use strict";
var Q = require('q');
var _ = require('lodash');
const baseUserModel = require("../users.model");
var randomstring = require("randomstring");
var bcrypt = require('bcrypt');
var notifcationModel = require("../notifications.model");
const userSkillsIdMap = require("../../consts/userSkills");


class UsersModel extends baseUserModel {


   /**
   * Function to create user by admin
   * @param {object} userData userData that ia to be added
   * **/
   _createUserAdmin(userData) {

      /**
       * note : Name for form columns must be same as that of the tbl columns
       * **/
      var me = this;
      var q = Q.defer();
      var handledId = null;
      try {
         var password = randomstring.generate(6); // auto generated password
         var userTblFields = ['first_name', 'last_name', 'email', 'password'];
         var userProfileFields = ['location', 'is_fixer', 'mobile_number', 'tagline', 'about', 'birth_date'];

         var userTblColumns = [];
         var userProfileTblColumn = [];
         userData.password = bcrypt.hashSync(password, 10);

         // user table
         _.each(userTblFields, function (column) {
            if (userData[column]) {
               userTblColumns.push(`${column} = ${me.escape(userData[column])}`);
            }
         });

         // user profile table
         _.each(userProfileFields, function (column) {
            if (userData[column]) {
               userProfileTblColumn.push(`${column} = ${me.escape(userData[column])}`);
            }
         });

         // skills
         var skillSql = me._prepareUserSkillsQuery(userData.userSkills, 'LAST_INSERT_ID()');


         var sql = 'START TRANSACTION ;';
         if (userTblColumns.length) {
            sql += `INSERT INTO users SET ${userTblColumns.join(",")},account_status = 1 ;`;
         }
         if (userTblColumns.length && userTblColumns.length) {
            sql += `INSERT INTO user_profile SET ${userProfileTblColumn.join(",")},user_id=LAST_INSERT_ID();`;
         }
         sql += skillSql;
         sql += 'COMMIT ;';
         sql += `SELECT * FROM sys_mail_templates WHERE mail_id = 'admin_user_add' ;`;
         if (!sql) {
            q.reject({ status: "ERROR", message: 'No data to handle' });
            return q.promise;
         }

         me.checkMailInRecord(userData.email).then(response => {
            if (response.isInRecord) {
               q.reject({ status: "ERROR", error: "Email already exists" });
               return q.promise;
            }
            else {
               return me.app.mysqldb.query(sql, {});
            }
         }).then(multiResponse => {
            var insertUserResponse = multiResponse[1];
            var mailTemplateDetails = _.last(multiResponse)[0];

            if (insertUserResponse.insertId) {
               handledId = insertUserResponse.insertId;
               //add user role to acl
               me.app.route_filter.acl.addUserRoles(insertUserResponse.insertId, 'appuser');

               /** send account creation mail **/
               var templateReplacements = { email: userData.email, password: password };
               var mailObj = {
                  to: userData.email,
                  html: me.app.helper.prepareBodyFromTemplate(mailTemplateDetails.html, templateReplacements),
                  text: me.app.helper.prepareBodyFromTemplate(mailTemplateDetails.text, templateReplacements),
                  subject: mailTemplateDetails.subject
               };
               me.app.mailer.send(mailObj).catch((error) => { console.log(error); });

               // upload profile pic or cover pic
               return Q.all([me.uploadProfilepic(handledId, userData.profilePic),
               me.uploadCoverpic(handledId, userData.coverPic)]);
            }
            else {
               //incorrect details
               q.reject({ status: "ERROR" });
               return q.promise;
            }
         }).then((response) => {
            var objNotificationModel = new notifcationModel(me.app);
            objNotificationModel.insertDefaultNotificationSettings(handledId);
         }).then((response) => {
            q.resolve({ status: "SUCCESS", handledId: handledId });
         }).catch(error => {
            console.log(error);
            me.app.mysqldb.query('ROLLBACK;', {});
            q.reject({ status: "ERROR", error: "Internal server error" });
         });
      }
      catch (error) {
         q.reject({ status: "ERROR", error: error });
      }
      return q.promise;
   }


   /** Add user skills **/
   _prepareUserSkillsQuery(userSkills, userId) {
      var me = this;
      var rows = [];
      _.each(userSkills, function (skills, skillType) {
         _.each(skills, function (value) {
            rows.push(`(${userId},${userSkillsIdMap[skillType]},${me.escape(value)})`);
         });
      });
      if (rows.length > 0) {
         return `INSERT INTO user_skills (user_id,skill_id,value) VALUES ${rows.join(",")} 
                 ON DUPLICATE KEY UPDATE value=VALUES(value);`;
      }
      return '';
   }



   /**
   * Function to edit user by admin
   * @param {object} userData userData that ia to be added
   * **/
   _editUserAdmin(userData) {
      /**
       * note : Name for form columns must be same as that of the tbl columns
       * **/
      var me = this;
      var q = Q.defer();

      try {
         var userTblFields = ['first_name', 'last_name'];
         var userProfileFields = ['location', 'is_fixer', 'mobile_number', 'tagline', 'about', 'birth_date'];

         var userTblColumns = [];
         var userProfileTblColumn = [];

         // user table
         _.each(userTblFields, function (column) {
            if (userData[column]) {
               userTblColumns.push(`${column} = ${me.escape(userData[column])}`);
            }
         });

         // user profile table
         _.each(userProfileFields, function (column) {
            if (userData[column]) {
               userProfileTblColumn.push(`${column} = ${me.escape(userData[column])}`);
            }
         });

         /** Prepare user skill query**/
         var userSkillQuery = me._prepareUserSkillsQuery(userData.userSkills, userData.user_id);

         var sql = 'START TRANSACTION ;';

         if (userTblColumns.length) {
            sql += `UPDATE users SET ${userTblColumns.join(",")} WHERE id = ${me.escape(userData.user_id)};`;
         }
         if (userTblColumns.length && userTblColumns.length) {          
            sql += `INSERT INTO user_profile SET ${userProfileTblColumn.join(",")} ,user_id = ${me.escape(userData.user_id)} ON DUPLICATE KEY UPDATE ${userProfileTblColumn.join(",")};`;
         }
         sql += `DELETE FROM user_skills WHERE user_id = ${userData.user_id};` + userSkillQuery;

         sql += 'COMMIT ;';

         if (!sql) {
            q.reject({ status: "ERROR", message: 'No data to update' });
            return q.promise;
         }

         this.app.mysqldb.query(sql, {}).then(function (multiResponse) {
            var updateUserResponse = multiResponse[1];
            if (updateUserResponse.affectedRows) {
               // upload profile pic
               return Q.all([me.uploadProfilepic(userData.user_id, userData.profilePic),
               me.uploadCoverpic(userData.user_id, userData.coverPic)]);
            }
            else {
               //incorrect details
               q.reject({ status: "ERROR" });
               return q.promise;
            }
         }).then((response) => {
            q.resolve({ status: "SUCCESS", handledId: userData.user_id });
         }).catch(function (error) {
            me.app.mysqldb.query('ROLLBACK;', {});
            q.reject({ status: "ERROR", error: error });
         });
      }
      catch (error) {
         q.reject({ status: "ERROR", error: error });
      }
      return q.promise;
   }


   /**
    * Function to handle reset user password
   * @param {number} userId Id of the user for whom password is to be reset   
   * **/
   resetUserPassword(userId) {
      var q = Q.defer();
      var me = this;
      try {
         var password = randomstring.generate(6); // auto generated password
         //go to our databse and ask if we have a username password match
         var selectUserSql = `SELECT email FROM users WHERE id = :uid;
                              SELECT * FROM sys_mail_templates WHERE mail_id = 'admin_resetuser_pass'`;
         var selectUserParams = { uid: userId };
         this.app.mysqldb.query(selectUserSql, selectUserParams).then(function (multiRowset) {
            if (multiRowset.length > 0) {
               var userSelectResponse = multiRowset[0];
               if (!userSelectResponse.length) {
                  q.reject({ status: "ERROR", message: 'Invalid user id' });
                  return q.promise;
               }
               var userRow = userSelectResponse[0];
               var mailTemplateRow = multiRowset[1][0];
               bcrypt.hash(password, 10).then((res) => {
                  var updatePasswordSql = 'UPDATE users SET password=:pwd WHERE id=:uid:';
                  me.app.mysqldb.query(updatePasswordSql, { uid: userId, pwd: res }).then(response => {
                     /** send password reset mail **/
                     var templateReplacements = { password: password };
                     var mailObj = {
                        to: userRow.email,
                        html: me.app.helper.prepareBodyFromTemplate(mailTemplateRow.html, templateReplacements),
                        text: me.app.helper.prepareBodyFromTemplate(mailTemplateRow.text, templateReplacements),
                        subject: mailTemplateRow.subject
                     };
                     me.app.mailer.send(mailObj).catch((error) => { console.log(error); });
                     q.resolve({ status: "SUCCESS", message: "Password updated successfully" });
                  }).catch(error => {
                     q.reject({ status: "400", message: 'Failed update password' });
                  });
               }).catch(error => {
                  q.reject({ status: "500", message: 'Internal server error' });
               });
            }
            else {
               //incorrect details
               q.reject({ status: "400", message: "Invalid mail template" });
            }
         }).catch(function () {
            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "ERROR", message: 'Internal server error' });
      }
      return q.promise;
   }


   /**
   * Function to handle user by admin
   * @param {object} userData userData that is to be added
   * **/
   handleUserAdmin(userData) {
      var me = this;
      var q = Q.defer();
      try {
         var handlerPromise = null;
         // edit
         if (userData.user_id) {
            handlerPromise = me._editUserAdmin(userData);
         }
         //add
         else {
            handlerPromise = me._createUserAdmin(userData);
         }
         handlerPromise.then(response => {
            q.resolve({ status: "SUCCESS", handledId: response.handledId });
         }).catch(error => {
            q.reject(error);
         });
      }
      catch (error) {
         q.reject({ status: "ERROR", message: 'Internal Server Error' });
      }
      return q.promise;
   }

}

module.exports = UsersModel;


