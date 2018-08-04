"use strict";
var Q = require('q');
var _ = require('lodash');
const baseModel = require("./base.model");

class FeedbackRatingModel extends baseModel {


   /**
   * Function to get user feedback
   * @param {number} userId id of the user
   * **/
   getUserFeedbackData(userId) {
      var q = Q.defer();
      try {
         /**
          *@Note : comments will be fetched only for  completed jobs 
           only top 5 comments will be fetched 
          **/
         var sql = `# Get consolidated data 
                     SELECT COUNT(IF(rating=0,1,NULL)) rate0,COUNT(IF(rating=1,1,NULL)) rate1,
                     COUNT(IF(rating=2,1,NULL)) rate2,COUNT(IF(rating=3,1,NULL)) rate3,
                     COUNT(IF(rating=4,1,NULL)) rate4,COUNT(IF(rating=5,1,NULL)) rate5,
                     COUNT(*) total_reviews ,AVG(rating) as avg_rating 
                     FROM job_feedbacks jf 
                     JOIN jobs j ON j.task_id = jf.job_id AND task_activity_status = 3
                     JOIN users upo ON j.user_id = upo.id 
                     WHERE j.task_worker_id = :uId
                     GROUP BY j.task_worker_id;

                     # GET feedback comments
                     SELECT * FROM job_feedbacks jf 
                     JOIN jobs j ON j.task_id = jf.job_id
                     JOIN users upo ON j.user_id = upo.id 
                     WHERE j.task_worker_id = :uId
                     ORDER BY rating DESC limit 5;
                   `;

         this.app.mysqldb.query(sql, { uId: userId }).then(function (multiResponse) {
            var aggregatedData = multiResponse[0][0] || {};
            var feedbackData = multiResponse[1];

            var ratings = {
               "total_reviews": aggregatedData.total_reviews || 0,
               "total_rating": aggregatedData.avg_rating || 0,
               "rating_details": {
                  "5stars": aggregatedData.rate5 || 0,
                  "4stars": aggregatedData.rate4 || 0,
                  "3stars": aggregatedData.rate3 || 0,
                  "2stars": aggregatedData.rate2 || 0,
                  "1stars": aggregatedData.rate1 || 0,
                  "0stars": aggregatedData.rate0 || 0
               },
               "avg_rating": aggregatedData.avg_rating || 0,
            };

            var comments = [];
            _.each(feedbackData, function (row) {
               comments.push({
                  "user_name": String(row.first_name) + ' ' + String(row.last_name),
                  "task_title": row.task_name,
                  "rating": row.rating,
                  "comment": row.comment,
               });
            });

            q.resolve({ rating: ratings, comments: comments });
         }).catch(function (error) {
            q.reject({ status: "ERROR", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "ERROR", message: 'Internal server error' });
      }
      return q.promise;
   }


   /**
   * Function to get user completing rate 
   * @param {number} userId id of the user
   * **/
   getUserCompletionRate(userId) {
      var q = Q.defer();
      try {
         /**
          *@Note : comments will be fetched only for  completed jobs 
           only top 5 comments will be fetched 
          **/
         var sql = `# Get completion rate 
                        SELECT COUNT(IF(task_worker_id=:uId,1, NULL)) as assigned,
                        COUNT(IF(task_activity_status='3',1, NULL)) as completed 
                        FROM jobs 
                        RIGHT JOIN users on users.id = jobs.task_worker_id
                        WHERE task_worker_id = :uId  
                        GROUP BY users.id;`;

         this.app.mysqldb.query(sql, { uId: userId }).then(function (response) {
            var row = response[0] || {};
            q.resolve({ completionRate: (row.assigned > 0) ? (row.completed / row.assigned) : 0 });
         }).catch(function (error) {
            q.reject({ status: "ERROR", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "ERROR", message: 'Internal server error' });
      }
      return q.promise;
   }


}

module.exports = FeedbackRatingModel;


