"use strict";
var Q = require('q');
const baseModel = require("./base.model");
const _ = require('lodash');

class MiscModel extends baseModel {
   /**
    * Function to get admin dashboard data
    * **/
   getAdminDashboardData() {
      var q = Q.defer();
      try {

         var sql = `SELECT COUNT(*) as total_users FROM users;
                    SELECT COUNT(IF(task_activity_status=3,1,NULL)) as completed_jobs,count(*) as total_jobs FROM jobs`;
         this.app.mysqldb.query(sql, {}).then(function (multiResponse) {
            var returnSet = {
               total_users: multiResponse[0][0].total_users,
               total_jobs: multiResponse[1][0].total_jobs,
               completed_jobs: multiResponse[1][0].completed_jobs,
            };
            q.resolve({ status: "SUCCESS", message: 'Data successfully fetched', data: returnSet });
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
      * Function to get admin dashboard data
   * **/
   getAppLanguages() {
      var q = Q.defer();
      try {

         var sql = `SELECT * FROM sys_app_languages`;
         this.app.mysqldb.query(sql, {}).then(function (response) {
            q.resolve({ status: "SUCCESS", message: 'Data successfully fetched', data: response });
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
     * Function to handle task reporting 
     * @param {object} reportData Data for reporting
   **/
   reportTask(reportData) {
      var q = Q.defer();
      try {
         var me = this;
         var columns = [];
         _.each(reportData, function (value, dbColumn) {
            columns.push(`${dbColumn} = ${me.escape(value)}`);
         });

         var sql = ` SELECT task_name FROM jobs WHERE task_id =:ti;
                     SELECT CONCAT(first_name ,' ',last_name) as full_name ,email FROM users WHERE id = :ui; 
                     SELECT 1 FROM reported_jobs WHERE task_id =:ti AND reported_by = :ui; 
                  `;

         this.app.mysqldb.query(sql, { ti: reportData.task_id, ui: reportData.reported_by }).then(function (multiResponse) {

            var reportedTaskCheck = multiResponse[2];
            var taskDetails = multiResponse[0][0];
            var userDetails = multiResponse[1][0];
            if (reportedTaskCheck.length > 0) {
               q.reject({ status: "400", message: 'You have already reported this task' });
               return q.promise;
            }
            if (multiResponse[0].length == 0) {
               q.reject({ status: "400", message: 'Task id is not valid' });
               return q.promise;
            }
            else {
               var mailBodyForAdmin = `<div>
                                       <div>New Report</div>
                                       <p> Name :${userDetails.full_name}<br>
                                        Task name : ${taskDetails.task_name}<br>
                                        Category:${reportData.category}<br>
                                        Message: ${reportData.comment}
                                      </div>`;

               var mailBodyForUser = `<div> We have sent report to admin.Action will be taken soon </div>`;

               // mail to admin
               var mailObjAdmin = {
                  to: process.env.ADMIN_MAIL,
                  html: mailBodyForAdmin,
                  text: mailBodyForAdmin,
                  subject: 'New Report'
               };

               // Mail to user
               var mailObjUser = {
                  to: userDetails.email,
                  html: mailBodyForUser,
                  text: mailBodyForUser,
                  subject: 'New Report'
               };

               // send response out of mail so that code should not wait for mail 
               me.app.mailer.send(mailObjAdmin);
               me.app.mailer.send(mailObjUser);

               var insertSql = `   INSERT INTO reported_jobs SET ${columns.join(",")}`;
               return me.app.mysqldb.query(insertSql, []);
            }

         }).then(response => {
            q.resolve({ status: "SUCCESS", message: 'Task reported successfully' });
         }).catch(function (error) {
            q.reject({ status: "400", message: 'Error reporting task' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal Server Error' });
      }
      return q.promise;
   }

   /**
      * Function to handle contact us 
      * @param {object} data  Data for contactus
    **/
   contactUs(data) {
      var q = Q.defer();
      var me = this;
      try {
         // send mail to admin
         var updateUserSql = `SELECT * FROM sys_mail_templates WHERE mail_id = 'contactus'`;
         this.app.mysqldb.query(updateUserSql, []).then(function (response) {
            var emailTemplate = response[0];
            var templateReplacements = { message: data.message };
            var mailObj = {
               to: process.env.ADMIN_MAIL,
               html: me.app.helper.prepareBodyFromTemplate(emailTemplate.html, templateReplacements),
               text: me.app.helper.prepareBodyFromTemplate(emailTemplate.text, templateReplacements),
               subject: emailTemplate.subject
            };
            if (data.attachment) {
               mailObj.attachments = [{ 'path': data.attachment.path, 'filename': data.attachment.name }];
            }

            // send response out of mail so that code should not wait for mail 
            me.app.mailer.send(mailObj).catch((error) => {
               console.log("Error From Mail ==>", error);
            });
            q.resolve({ status: "SUCCESS", message: 'Admin will contact you soon' });
         });
      }
      catch (error) {
         console.log(error);
         q.reject({ status: "ERROR", message: 'Internal Server Error' });
      }
      return q.promise;
   }



}

module.exports = MiscModel;


