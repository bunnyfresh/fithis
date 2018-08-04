"use strict";
var Q = require('q');
var _ = require('lodash');
var uniqid = require('uniqid');
const baseModel = require("./base.model");
class MessagesModel extends baseModel {

   /**
   * Function to post offer r
   * @param {object} messageData message data to be posted
   * **/
   postNewMessage(messageData) {
      var q = Q.defer();
      try {
         var sql = `INSERT INTO user_conversations(id,job_id,to_user,from_user,message)
                      VALUES (:id,:ji,:tu,:fu,:comment);`;
         var id = uniqid.time();
         var insertParams = {
            id: id,
            tu: messageData.to_user,
            fu: messageData.from_user,
            ji: messageData.job_id,
            comment: messageData.message // message will be base 64 encoded from front end
         };
         this.app.mysqldb.query(sql, insertParams).then(function (response) {
            var insertionResponse = response;
            console.log(response);
            if (insertionResponse.affectedRows) {
               q.resolve({ status: "SUCCESS", insertedId: id, message: 'Message successfully sent' });
            }
            else {
               //incorrect insertion
               q.reject({ status: "400", message: 'Error posting message' });
            }
         }).catch(function (error) {
            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to get user conversation
     * @param {number} conversationData object data for which conversation is to be fetched
     * @param {number} pp records per page
     * @param {number} pg page number
    * **/
   getConversation(conversationData, pp, pg) {
      var q = Q.defer();
      var me = this;
      try {

         var rowCount = pp;
         var offset = (pg - 1) * pp;

         var sql = `SELECT CONCAT(u.first_name ,' ',u.last_name) AS user_name,up.profile_pic,uc.message,uc.crd,uc.job_id,uc.to_user,uc.from_user 
                        FROM user_conversations uc 
                        LEFT JOIN user_profile up ON up.user_id = uc.to_user
                        JOIN users u ON u.id = uc.to_user 
                        WHERE ((to_user = :u1Id AND from_user = :u2Id)OR (to_user = :u2Id AND from_user = :u1Id))
                              AND uc.job_id=:jId
                        ORDER BY uc.crd DESC `;

         let limitClause = " LIMIT " + offset + "," + rowCount + ";";

         var sql2 = `
                     # Get tsk details
                     SELECT task_name from jobs WHERE task_id = :jId ;
                     #Get total record counts
                     SELECT count(id) as record_count FROM user_conversations  WHERE  ((to_user = :u1Id AND from_user = :u2Id)OR (to_user = :u2Id AND from_user = :u1Id)) AND job_id=:jId`;
         let normalQuery = sql + limitClause;
         let countQuery = sql2;
         const finalSql = normalQuery + countQuery;
         var sqlParams = {
            u1Id: conversationData.userId,
            u2Id: conversationData.withUser,
            jId: conversationData.jobId
         };
         this.app.mysqldb.query(finalSql, sqlParams).then(function (multiRowset) {

            var conversationData = [];
            _.each(multiRowset[0], function (userChat) {
               var userChatRow = {
                  to_user: userChat.to_user,
                  //message: Buffer.from(userChat.message, 'base64').toString(), // base 64 decode
                  message: userChat.message, // base 64 decode
                  messageEpoch: Date.parse(userChat.crd),
                  sender_name: userChat.user_name
               };
               userChatRow.sender_profile_pic = me.app.helper.serverUrl({
                  partialUrl: userChatRow.profile_pic
               });
               conversationData.push(userChatRow);
            });
            var taskInfo = {
               job_id: conversationData.jobId,
               job_name: (multiRowset[1].length > 0) ? multiRowset[1][0].task_name : ''
            };

            var metaInfo = {
               "total": (multiRowset[2].length > 0) ? multiRowset[2][0].records_count : 0,
               "pg": pg,
               "pp": rowCount,
               "totalInPage": multiRowset[0].length
            };
            var returnSet = {
               conversation: conversationData,
               jobInfo: taskInfo,
               meta: metaInfo
            };

            var message = _.isEmpty(conversationData) ? "No messages" : "Fetched Messages sucessfully.";
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


   /**
    * Function to get comments list 
     * @param {number} id of the user for whom inbox is to be fetched
     * @param {number} pp records per page
     * @param {number} pg page number
    * */
   getUserInbox(userId, pp, pg) {
      var q = Q.defer();
      var me = this;
      try {

         var rowCount = pp;
         var offset = (pg - 1) * pp;

         var sql = `SELECT * 
                     FROM 
                       (SELECT fu.online_status,CONCAT(fu.first_name ,' ',fu.last_name) AS chat_partner_name,fup.profile_pic,j.task_name,j.task_id,uc.message,uc.crd,
                                 IF(uc.from_user=:uId,uc.to_user,uc.from_user) as chat_with_userid,uc.job_id 
                        FROM user_conversations uc 
                        LEFT JOIN user_profile fup ON fup.user_id = IF(uc.from_user=:uId,uc.to_user,uc.from_user) 
                        JOIN users fu ON fu.id = IF(uc.from_user=:uId,uc.to_user,uc.from_user) 
                        JOIN jobs j on uc.job_id = j.task_id
                        WHERE to_user = :uId OR from_user = :uId
                        ORDER BY uc.crd DESC ) dt
                     GROUP BY job_id `;

         let limitClause = " LIMIT " + offset + "," + rowCount + ";";

         var sql2 = " SELECT count(id) as record_count FROM user_conversations  WHERE to_user = :uId OR from_user = :uId GROUP BY job_id ";
         let normalQuery = sql + limitClause;
         let countQuery = sql2;
         const finalSql = normalQuery + countQuery;

         this.app.mysqldb.query(finalSql, { uId: userId }).then(function (multiRowset) {

            var data = [];
            _.each(multiRowset[0], function (userChat) {
               var userChatRow = {
                  chat_partner_id: userChat.chat_with_userid,
                  message: userChat.message,
                  job_id: userChat.task_id,
                  job_name: userChat.task_name,
                  messageEpoch: Date.parse(userChat.crd),
                  partner_online_status: userChat.online_status,
                  chat_partner_name: userChat.chat_partner_name
               };
               userChatRow.profile_pic = me.app.helper.serverUrl({
                  partialUrl: userChatRow.profile_pic
               });
               data.push(userChatRow);
            });
            var metaInfo = {
               "total": (multiRowset[1].length > 0) ? multiRowset[1][0].records_count : 0,
               "pg": pg,
               "pp": rowCount,
               "totalInPage": multiRowset[0].length
            };
            var returnSet = {
               chatList: data,
               meta: metaInfo
            };

            var message = _.isEmpty(data) ? "No messages" : "Fetched Messages sucessfully.";
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

module.exports = MessagesModel;


