"use strict";
var Q = require('q');
var _ = require('lodash');
var notificationModel = require("./notifications.model");
const baseModel = require("./base.model");
var uniqid = require('uniqid');
const commentAttachmentUploadDir = '/uploads/job_comments_attatchments/';

class JobCommentsModel extends baseModel {

   /**
   * Function to post comment 
   * @param {number} userId id of the user
   * @param {object} commentData comment data to be posted
   * **/
   postNewComment(userId, commentData) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `# insert comment
                      INSERT INTO job_comments(task_id,user_id,comment,parent_comment_id,attachment,upd)
                      VALUES (:ti,:uId,:cm,:rt,:att,NOW());
                   
                     #Get task details
                      SELECT * FROM jobs JOIN users WHERE task_id = :ti;`;

         var insertParams = {
            ti: commentData.task_id,
            cm: _.trim(commentData.comment),
            rt: commentData.parent_comment_id,
            uId: userId,
            att: null
         };

         var insertedCommentId = null;

         //conditional uploading of attatchment
         var commentAttatchmentData = commentData.attatchment || {};

         var uploadFileObj = {
            "destination": 'uploads/job_comments_attatchments/',
            "tempFile": commentAttatchmentData.path || null,
            "uploadedFileName": commentAttatchmentData.name || null,
            "nameOnFileSystem": uniqid.time()
         };
         this.app.helper.uploadFile(uploadFileObj).then(response => {
            if (response.hasOwnProperty('uploadedFile')) {
               insertParams.att = response.uploadedFile;
            }
            return this.app.mysqldb.query(sql, insertParams);
         }).then(multiResponse => {
            var insertionResponse = multiResponse[0];
            /** Trigger Notification **/
            var objNotificationModel = new notificationModel(me.app);
            var jobDetails = multiResponse[1][0];
            insertedCommentId = insertionResponse.insertId;
            var notificationObj = {
               from_user: userId,
               notification_type: 'task_updates',
               templateId: objNotificationModel.templates.new_comment[0],
               notification_data: { job_title: jobDetails.task_name },
               metadata: { task_id: jobDetails.task_id, type: objNotificationModel.templates.new_comment[1] }
            };
            return objNotificationModel.notify(notificationObj, jobDetails.user_id);
         }).then(response => {
            q.resolve({ status: "SUCCESS", insertedCommentId: insertedCommentId, message: 'Comment successfully posted' });
         }).catch(function (error) {
            //debug
            console.log(error);
            q.reject({ status: "ERROR", message: 'Internal server error' });
         });
      }
      catch (error) {
         //debug
         console.log(error);
         q.reject({ status: "ERROR", message: 'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to get comments list 
     * @param {number} taskId id of the task
     * @param {number} pp records per page
     * @param {number} pg page number
    * */
   getCommentList(task_id, pp, pg) {
      var q = Q.defer();
      var me = this;
      try {

         var rowCount = pp;
         var offset = (pg - 1) * pp;

         var sql = "SELECT utc.comment_id, utc.user_id, IFNULL(u.first_name,'') as first_name,IFNULL(u.last_name,'') as last_name, utc.parent_comment_id, utc.comment, utc.crd ,up.profile_pic,utc.attachment";
         sql += " ,GROUP_CONCAT(CONCAT(utc1.comment_id,'<=>',utc1.user_id,'<=>', IFNULL(u1.first_name,''),'<=>', IFNULL(u1.last_name,''),'<=>', utc1.parent_comment_id,'<=>', utc1.comment, '<=>',IFNULL(up1.profile_pic,''),'<=>' ,utc1.crd,IFNULL(utc1.attachment,''))  SEPARATOR '>=<') as replies "; //replies gruoup by comment_id of similar
         sql += " FROM job_comments as utc ";
         let commonSql = " INNER JOIN users u ON utc.user_id=u.id";
         commonSql += " LEFT JOIN job_comments as utc1 ON utc1.parent_comment_id = utc.comment_id";
         commonSql += " LEFT JOIN users as u1 ON utc1.user_id = u1.id";
         commonSql += " LEFT JOIN user_profile up ON up.user_id = u.id";
         commonSql += " LEFT JOIN user_profile up1 ON up1.user_id = u.id";
         commonSql += " WHERE utc.task_id = " + task_id + " and utc.parent_comment_id is NULL ";
         let commonSql1 = " GROUP BY utc.comment_id ORDER BY utc.crd desc ";
         let limitClause = " LIMIT " + offset + "," + rowCount + ";";

         var sql2 = " SELECT count(*) as records_count FROM (SELECT DISTINCT utc.comment_id FROM job_comments utc ";
         let normalQuery = sql + commonSql + commonSql1 + limitClause;
         let countQuery = sql2 + commonSql + commonSql1 + ') as countTbl;';
         const finalSql = normalQuery + countQuery;

         this.app.mysqldb.query(finalSql, {}).then(function (multiRowset) {

            var data = [];
            _.each(multiRowset[0], function (commentRow) {
               var replies = [];
               var repliesToComment = (commentRow.replies) ? commentRow.replies.split(">=<") : [];
               _.each(repliesToComment, function (reply) {
                  var commentDetails = reply.split("<=>");
                  var subComment = {
                     comment_id: commentDetails[0],
                     postedby: commentDetails[1],
                     posted_by_name: commentDetails[2] + ' ' + commentDetails[3],
                     parent_comment_id: commentDetails[4],
                     comment: commentDetails[5],
                     comment_datetime: Date.parse(commentDetails[7]),
                     posted_by_profileimage: me.app.helper.serverUrl({
                        partialUrl: commentDetails[6]
                     }),
                     comment_attachment: me.app.helper.serverUrl({
                        partialUrl: commentDetails[8] || '',
                        destination: commentAttachmentUploadDir
                     })
                  };
                  replies.push(subComment);
               });

               var usercomment = {
                  comment_id: commentRow.comment_id,
                  posted_by_name: commentRow.first_name + ' ' + commentRow.last_name,
                  comment: commentRow.comment,
                  postedby: commentRow.user_id,
                  replies: replies,
                  comment_datetime: Date.parse(commentRow.crd),
                  posted_by_profileimage: me.app.helper.serverUrl({
                     partialUrl: commentRow.profile_pic
                  }),
                  comment_attachment: me.app.helper.serverUrl({
                     partialUrl: commentRow.attachment || '',
                     destination: commentAttachmentUploadDir
                  })
               };
               data.push(usercomment);
            });
            var metaInfo = {
               "total": multiRowset[1][0].records_count,
               "pg": pg,
               "pp": rowCount,
               "totalInPage": multiRowset[0].length
            };
            var returnSet = {
               comments: data,
               meta: metaInfo
            };

            var message = _.isEmpty(data) ? "Currently there are no comments for this job." : "Fetched  comments successfully.";
            q.resolve({ status: "SUCCESS", message: message, data: returnSet });
         }).catch(function (error) {
            console.log(error);
            q.reject({ status: "ERROR", message: 'Internal Server Error' });
         });
      }
      catch (error) {
         console.log(error);
         q.reject({ status: "ERROR", message: 'Internal Server Error' });
      }
      return q.promise;
   }

}

module.exports = JobCommentsModel;


