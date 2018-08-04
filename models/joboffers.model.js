"use strict";
var Q = require('q');
var _ = require('lodash');
const baseModel = require("./base.model");
const feedbackModel = require("./feedbackrating");
const userAccountModel = require("./usersaccount.model");
var notificationModel = require("./notifications.model");
var paymentModel = require("./payment.model");
var siteConst = require('../consts/siteConsts');

class JobCommentsModel extends baseModel {

   /**
   * Function to post offer 
   * @param {number} userId id of the user
   * @param {object} offerData comment data to be posted
   * **/
   postNewOffer(userId, jobData) {
      var q = Q.defer();
      var me = this;
      var notificationObj = {};
      var objNotificationModel = new notificationModel(me.app);
      var insertedOfferId = null;
      try {
         var sql = `#check for already placed offer and email verification
                     SELECT u.verification_token,jo.offer_id,j.user_id as job_poster_id ,j.task_name,j.task_id
                     FROM jobs j 
                     LEFT JOIN job_offers jo ON jo.task_id = j.task_id AND jo.offered_by = :uid
                     RIGHT JOIN users u ON u.id = :uid 
                     WHERE j.task_id = :ti`;

         var params = {
            ti: jobData.task_id,
            uid: userId,
         };

         this.app.mysqldb.query(sql, params).then(function (response) {
            if (response[0].verification_token) {
               q.reject({ status: "400", message: 'Your email is not verfied' });
               return q.promise;
            }
            else if (response[0].offer_id) {
               q.reject({ status: "400", message: 'You have already placed offer on this task' });
               return q.promise;
            }
            else {
               /** Trigger Notification **/
               notificationObj = {
                  from_user: userId,
                  notification_type: 'task_updates',
                  templateId: objNotificationModel.templates.new_offer[0],
                  notification_data: { job_title: response[0].task_name },
                  to_user: response[0].job_poster_id,
                  metadata: { task_id: response[0].task_id, type: objNotificationModel.templates.new_offer[1] }
               };

               var sql = `#insert 
                           INSERT INTO job_offers(task_id,offered_by,offer_comment,offer_amount,initial_offer_amount)
                           VALUES (:ti,:uId,:cm,:oa,:oa);`;
               var insertParams = {
                  ti: jobData.task_id,
                  cm: _.trim(jobData.comment),
                  oa: jobData.offer_amount,
                  uId: userId,
               };
               return me.app.mysqldb.query(sql, insertParams);
            }
         }).then(function (response) {
            var insertionResponse = response;
            if (insertionResponse.insertId) {
               insertedOfferId = insertionResponse.insertId;
               var toUser = notificationObj.to_user;
               objNotificationModel.notify(notificationObj, toUser).catch(error => {
                  console.log("Error From Notification ==>", error);
               });
               q.resolve({ status: "SUCCESS", insertedOfferId: insertedOfferId, message: 'Offer successfully placed' });
            }
            else {
               //incorrect insertion
               q.reject({ status: "400", message: 'Error placing order' });
            }
         }).catch(function (error) {
            console.log(error);
            q.reject({ status: "500", message: 'Internal server error' });
         });

      }
      catch (error) {
         console.log(error);
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to get job offers  
      * @param {number} taskId id of the task
      * @param {number} pp records to fetch
      * @param {number} pg offset to begin from 
    **/
   getJobOffersListing(taskId, pp, pg) {

      var q = Q.defer();
      var me = this;
      var rowCount = pp;
      var offset = (pg - 1) * pp;
      try {
         var sql = `SELECT uto.*,upto.profile_pic,IFNULL(u.first_name,'') as first_name,IFNULL(u.last_name,'') as last_name,dt2.avg_rating as fixer_avg_rating
                           ,dt1.completion_rate as fixer_completion_rate
                     FROM job_offers uto
                     JOIN users u on u.id = uto.offered_by
                     LEFT JOIN job_feedbacks jf ON uto.task_id = jf.job_id 
                     LEFT JOIN user_profile upto ON upto.user_id = uto.offered_by
                     #completion rate for bidders
                     LEFT JOIN (SELECT (COUNT(IF(j.task_activity_status=3 AND j.task_worker_id = jo.offered_by,1,NULL))/COUNT(IF(jo.is_assigned=1,1,NULL))) as completion_rate , jo.offered_by as user_id
                                 FROM jobs j 
                                 RIGHT JOIN job_offers jo ON j.task_worker_id = jo.offered_by AND j.task_id = jo.task_id 
                                 GROUP BY jo.offered_by) dt1 ON dt1.user_id = uto.offered_by  
                     # avg ratings for bidder   
                     LEFT JOIN (  
                     SELECT AVG(rating) as avg_rating ,j.task_worker_id as user_id
                     FROM job_feedbacks jf 
                     JOIN jobs j ON j.task_id = jf.job_id 
                     GROUP BY j.task_worker_id
                     ) dt2 ON dt2.user_id = uto.offered_by      
                     WHERE task_id = :tid 
                     GROUP BY uto.offered_by
                     ORDER BY uto.crd DESC`;

         let limitClause = " LIMIT " + offset + `,${rowCount};`;

         let normalQuery = sql + limitClause;
         this.app.mysqldb.query(normalQuery, { tid: taskId }).then(function (response) {

            var offerList = [];
            if (response.length > 0) {
               _.each(response, function (offerRow) {
                  offerList.push({
                     offer_id: offerRow.offer_id,
                     offer_price: offerRow.offer_amount,
                     offered_at: Date.parse(offerRow.crd),
                     profile_image: me.app.helper.serverUrl({
                        partialUrl: offerRow.profile_pic
                     }),
                     fixer_id: offerRow.offered_by,
                     fixer_full_name: offerRow.first_name + ' ' + offerRow.last_name,
                     rating: offerRow.fixer_avg_rating,
                     completion_rate: offerRow.fixer_completion_rate,
                  });
               });
            }
            q.resolve({ data: offerList });
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
    * Function to get offer details 
    * @param {number} offerId id of the offer for which to get details
    * */
   getOfferDetails(offerId) {
      var q = Q.defer();
      try {
         var sql = `SELECT uto.*,j.user_id AS to_user
                     FROM job_offers uto
                     JOIN jobs j ON j.task_id = uto.task_id
                     WHERE offer_id = :uoId`;
         this.app.mysqldb.query(sql, { uoId: offerId }).then(function (response) {
            if (response.length > 0) {
               var offerRow = response[0];
               var offerData = {
                  to_user: offerRow.to_user,
                  from_user: offerRow.offered_by,
                  offer_amount: offerRow.offer_amount,
                  description: offerRow.offer_comment,
                  servicefee: siteConst.serviceTax,
               };
               q.resolve({ status: "SUCCESS", data: offerData });
            }
            else {
               q.reject({ status: "400", message: 'Invalid offer id' });
            }

         }).catch(function (error) {
            console.log("ERROR1 ===>1", error);
            q.reject({ status: "500", message: 'Internal Server Error' });
         });
      }
      catch (error) {
         console.log("ERROR1 ===>2", error);
         q.reject({ status: "500", message: 'Internal Server Error' });
      }
      return q.promise;
   }



   /**
    * Function to get offer review list 
     * @param {number} taskId id of the task
     * @param {number} offerSequence offer sequence number
    * */
   getOffersReviewList(task_id, offerSequence) {
      var q = Q.defer();
      var me = this;
      try {

         var offset = offerSequence - 1;

         var sql = `SELECT uto.*,upto.profile_pic
                     FROM job_offers uto
                     LEFT JOIN user_profile upto ON upto.user_id = uto.offered_by
                     WHERE task_id = :tid`;
         let limitClause = " LIMIT " + offset + ",1;";

         var sql2 = " SELECT count(*) as records_count FROM job_offers WHERE task_id=:tid GROUP BY task_id";
         let normalQuery = sql + limitClause;
         let countQuery = sql2;
         const finalSql = normalQuery + countQuery;
         var returnSet = {};
         this.app.mysqldb.query(finalSql, { tid: task_id }).then(function (multiResponse) {

            var promisesToGetDetails = [];
            var offerData = {};
            var metaInfo = {
               "total": (multiResponse[1][0]) ? multiResponse[1][0].records_count : 0,
               "currentSequence": offset
            };

            returnSet = {
               offerDetails: offerData,
               fixer_profile: {},
               review_data: {},
               meta: metaInfo
            };

            if (multiResponse[0].length > 0) {
               var objUserAccountModel = new userAccountModel(me.app);
               var objFeedbackModel = new feedbackModel(me.app);
               var offerRow = multiResponse[0][0];
               promisesToGetDetails.push(objUserAccountModel.getCompleteAccountProfile(offerRow.offered_by));
               promisesToGetDetails.push(objFeedbackModel.getUserFeedbackData(offerRow.offered_by));
               promisesToGetDetails.push(objFeedbackModel.getUserCompletionRate(offerRow.offered_by));
               returnSet.offerDetails = {
                  offer_id: offerRow.offer_id,
                  comment: offerRow.offer_comment,
                  amount_offer: offerRow.offer_amount,
                  offer_time_epoch: Date.parse(offerRow.crd),
               };
               return Q.all(promisesToGetDetails);
            }
            else {
               q.resolve({ status: "SUCCESS", message: 'Unable to fetch offer', data: returnSet });
            }

         }).then((multiResponse) => {

            var fixerProfile = multiResponse[0].data;
            var fixerFeedback = multiResponse[1];
            var completion_rate = multiResponse[2].completionRate;
            var reviewData = {
               "total_reviews": fixerFeedback.rating.total_reviews,
               "total_rating": fixerFeedback.rating.total_rating,
               "rating_details": {
                  "5stars": fixerFeedback.rating.rating_details['5stars'],
                  "4stars": fixerFeedback.rating.rating_details['4stars'],
                  "3stars": fixerFeedback.rating.rating_details['3stars'],
                  "2stars": fixerFeedback.rating.rating_details['2stars'],
                  "1stars": fixerFeedback.rating.rating_details['1stars'],
                  "0stars": fixerFeedback.rating.rating_details['0stars']
               },
               "comments": fixerFeedback.comments
            };

            var fixerProfileData = {
               "full_name": fixerProfile.general_info.first_name || '' + ' ' + fixerProfile.general_info.last_name || '',
               "user_rating_star": reviewData.total_rating,
               "fixer_user_id": returnSet.fixer_profile.fixer_user_id,
               "total_ratings": reviewData.total_rating,
               "completion_rate": completion_rate,
               "member_since": fixerProfile.general_info.member_since,
               "image": fixerProfile.general_info.profile_image,
               "badges": fixerProfile.badges,
               "about": fixerProfile.general_info.about_me,
               "portfolio": fixerProfile.portfolio,
            };

            returnSet.fixer_profile = fixerProfileData;
            returnSet.review_data = reviewData;
            var message = (returnSet.meta.total == 0) ? "Currently there are no offers for this job." : "Fetched  offer successfully.";
            q.resolve({ status: "SUCCESS", message: message, data: returnSet });
         }).catch(function (error) {
            console.log("ERROR1 ===>1", error);
            q.reject({ status: "ERROR", message: 'Internal Server Error' });
         });
      }
      catch (error) {
         console.log("ERROR1 ===>2", error);
         q.reject({ status: "ERROR", message: 'Internal Server Error' });
      }
      return q.promise;
   }


   /**
    * Function to get delete offer 
     * @param {number} offerId id of offer to delete
     * @param {number} userId id of the user who is deleting this offer
    * */
   deleteOffer(offerId, userId) {

      /**
       * @Note : 1. Can delete offers that are not assigned
       *         2. Only the one who has placed the order can delete it
       * **/
      var q = Q.defer();
      var me = this;
      try {
         var sql = `SELECT jo.*,j.task_activity_status,jo.is_assigned
                    FROM job_offers jo 
                    JOIN jobs j ON j.task_id = jo.task_id  
                    WHERE jo.offer_id = :oId;`;
         this.app.mysqldb.query(sql, { oId: offerId }).then(function (response) {
            if (response.length == 0) {
               q.reject({ status: "400", message: 'Unable to find offer' });
               return q.promise;
            }
            else if (response[0].offered_by != userId) {
               q.reject({ status: "400", message: 'You have not placed this offer' });
               return q.promise;
            }
            else if (response[0].is_assigned == 1) {
               q.reject({ status: "400", message: 'Assigned offers cannot be deleted' });
               return q.promise;
            }
            else {
               var sql = `DELETE FROM job_offers WHERE offer_id = ?`;
               return me.app.mysqldb.query(sql, [offerId]);
            }
         }).then(function (response) {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: 'Offer successfully deleted' });
            }
            else {
               //incorrect insertion
               q.reject({ status: "400", message: 'Error deleting order' });
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
   * Function to get update offer 
    * @param {number} offerId id of offer to update
    * @param {number} userId id of user who is updating the
    * @param {object} dataToUpdate dataToUpdate
   * */
   updateOffer(offerId, userId, dataToUpdate) {

      /**
       * @Notes : 1 offers for completed jobs cannot be updated
       * 2. If task is assigned than amount cannot be less than orignal bid
       * **/

      var q = Q.defer();
      var me = this;
      try {

         // check if we have data to update
         if (_.isEmpty(dataToUpdate)) {
            q.reject({ status: "400", message: 'No data to update' });
            return q.promise;
         }

         var sql = `SELECT jo.*,j.task_activity_status,jo.is_assigned,j.user_id as job_poster_id
                    FROM job_offers jo 
                    JOIN jobs j ON j.task_id = jo.task_id  
                    WHERE jo.offer_id = :oId;`;

         this.app.mysqldb.query(sql, { oId: offerId }).then(function (response) {
            var requiredDetails = response[0] || [];
            if (response.length == 0) {
               q.reject({ status: "ERROR", message: 'Unable to find offer' });
               return q.promise;
            }
            // check if user is authorized 
            else if ((response[0].offered_by != userId) && (response[0].job_poster_id != userId)) {
               q.reject({ status: "400", message: 'You are not authorized to update this offer' });
               return q.promise;
            }
            // check if job is completed or not
            else if (response[0].task_activity_status == 3) {
               q.reject({ status: "400", message: 'Offers for complete jobs cannot be updated' });
               return q.promise;
            }
            else if (response[0].offer_amount > dataToUpdate.offer_amount) {
               q.reject({ status: "400", message: 'Price cannot be less then orignal offer' });
               return q.promise;
            }
            else {
               var increaseInBid = parseInt(dataToUpdate.offer_amount - response[0].offer_amount);
               if (increaseInBid > 0) {
                  // do transaction for escrow account
                  var objPaymentModel = new paymentModel(me.app);
                  var transactAmount = increaseInBid;
                  var trxObj = {
                     task_id: requiredDetails.task_id,
                     userId: requiredDetails.job_poster_id,
                     amount: transactAmount,
                     flow: 2 // outgoing
                  };
                  return objPaymentModel.transact(trxObj);
               }
               else {
                  return Q(true);
               }
            }
         }).then(() => {
            var rowToUpdate = [];
            _.each(dataToUpdate, function (value, key) {
               rowToUpdate.push(`${key}=${me.escape(value)}`);
            });
            var sql = `UPDATE job_offers SET ${rowToUpdate.join(',')} WHERE offer_id = ?;`;
            return this.app.mysqldb.query(sql, [offerId]);
         }).then(function (response) {
            q.resolve({ status: "SUCCESS", message: 'Offer successfully updated' });
         }).catch(function (error) {
            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }

}

module.exports = JobCommentsModel;


