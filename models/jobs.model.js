"use strict";
var Q = require('q');
var shortid = require('shortid');
var _ = require('lodash');
var siteConst = require('../consts/siteConsts');
const baseModel = require("./base.model");
var jobOffersModel = require("./joboffers.model");
var jobCommentsModel = require("./jobcomments.model");
var paymentModel = require("./payment.model");
var notificationModel = require("./notifications.model");

class JobModel extends baseModel {
   constructor(app) {
      super(app);
      this.statusIdToTextMap = {
         "0": 'Draft',
         "1": 'Open',
         "2": 'Assigned',
         "3": 'Complete',
         "4": 'Applied'
      };


      this.statusTextToIdMap = {
         "open": '1',
         "assigned": '2',
         "completed": '3',
      };

      this.reqFieldMap = {
         task_end_day: "task_end_day",
         task_end_time: "task_end_time",
         job_name: "task_name",
         job_description: "task_description",
         location: "location",
         latitude: "latitude",
         longitude: "longitude",
         is_online_task: "task_online",
         task_price: "task_price",
         hours: "hours",
         hourly_rate: "hourly_rate",
         job_status: "task_activity_status",
         no_of_fixers: "no_of_fixers",
         abn_number: "abn_number",
         user_id: "user_id",
         category_id: "task_category_id"
      };
   }

   /**
    * Function to get job id
    * @param {number} Id of the job for which details are to be fetched  
    **/
   getJobDetails(jobId) {

      /**
       * @NOTE : showing  top 5 comments and offers
       * **/

      var q = Q.defer();
      try {
         var me = this;
         var jobDetails = {};
         var sql = `SELECT ut.*,jo.offer_id,jc.category_name,CONCAT(tp.first_name,' ',tp.last_name) as poster_fullname, 
                           uptp.profile_pic as poster_pic,tp.online_status as poster_online_status,
                           CONCAT(tf.first_name,' ',tf.last_name) as fixer_fullname, 
                           tp.online_status as fixer_online_status ,tf.online_status,uptf.profile_pic as fixer_pic ,
                    GROUP_CONCAT(jd.document_name SEPARATOR '>====<') as job_attachments      
                    FROM jobs ut
                    JOIN job_categories jc ON jc.category_id = ut.task_category_id 
                    JOIN users tp ON tp.id = ut.user_id 
                    LEFT JOIN users tf ON tf.id = ut.task_worker_id 
                    LEFT JOIN job_offers jo ON jo.task_id = ut.task_id AND is_assigned = 1
                    LEFT JOIN user_profile uptp ON uptp.user_id = ut.user_id
                    LEFT JOIN user_profile uptf ON uptf.user_id = ut.task_worker_id
                    LEFT JOIN job_docs jd ON jd.job_id = ut.task_id
                    WHERE ut.task_id = ? 
                    GROUP BY ut.task_id`;
         this.app.mysqldb.query(sql, [jobId]).then(response => {
            if (response.length > 0) {
               var taskRow = response[0];
               jobDetails = {
                  "servicefee": siteConst.serviceTax,
                  "task_id": taskRow.task_id,
                  'share_message': 'I saw this awesome Job on Fix This I think you would be interested in. Check it out',
                  "task_name": taskRow.task_name,
                  "task_description": taskRow.task_description,
                  "hourly_rate": taskRow.hourly_rate,
                  "hours": taskRow.hours,
                  "task_end_day": taskRow.task_end_day,
                  "task_end_time": taskRow.task_end_time,
                  "no_of_fixers": taskRow.no_of_fixers,
                  "category_name": taskRow.category_name,
                  "category_id": taskRow.task_category_id,
                  "task_url": taskRow.task_url_name,
                  "task_price": taskRow.task_price,
                  "task_post_datetime": Date.parse(taskRow.task_post_date),
                  "done_online": taskRow.task_online,
                  "due_date": taskRow.task_end_datetime,
                  "assigned_offer_id": taskRow.offer_id,
                  "job_activity_status": me.statusIdToTextMap[taskRow.task_activity_status],
                  "userDetails": {
                     'fullname': taskRow.poster_fullname,
                     'user_id': taskRow.user_id,
                     'profile_image': me.app.helper.serverUrl({
                        partialUrl: taskRow.poster_pic
                     }),
                     'online_status': taskRow.poster_online_status
                  },
                  "attachments": [],
                  "offers": [],
                  "comments": [],
                  "fixerDetails": {},
                  "locationDetails": {
                     'location': taskRow.location,
                     'longitude': taskRow.longitude,
                     'latitude': taskRow.latitude,
                  }
               };
               // add fixer details
               if (taskRow.task_worker_id) {
                  jobDetails.fixerDetails = {
                     'fullname': taskRow.fixer_fullname,
                     'user_id': taskRow.task_worker_id,
                     'online_status': taskRow.fixer_online_status,
                     'profile_image': me.app.helper.serverUrl({
                        partialUrl: taskRow.fixer_pic
                     })
                  };
               }

               // add attatchments 
               if (taskRow.job_attachments) {
                  var attachmentsArr = taskRow.job_attachments.split('>====<');
                  _.each(attachmentsArr, function (doc) {
                     var row = me.app.helper.serverUrl({
                        partialUrl: doc
                     });
                     jobDetails.attachments.push(row);
                  });
               }

               var objJobOfferModel = new jobOffersModel(me.app);
               var objJobCommentModel = new jobCommentsModel(me.app);
               var promisesToHandle = [];

               promisesToHandle.push(objJobOfferModel.getJobOffersListing(jobId, 5, 1));
               promisesToHandle.push(objJobCommentModel.getCommentList(jobId, 5, 1));

               return Q.all(promisesToHandle);
            }
            else {
               q.reject({ status: "400", message: "Invalid Job Id" });
               return q.promise;
            }
         }).then(multiResponse => {
            var offersResponse = multiResponse[0];
            var commentsResponse = multiResponse[1];
            jobDetails.comments = commentsResponse.data.comments;
            jobDetails.offers = offersResponse.data;
            q.resolve({ status: "SUCCESS", data: jobDetails, "message": "Details Successfully fetched" });
         }).catch((error) => {
            console.log(error);
            q.reject({ status: "500", message: 'Internal Server Error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal Server Error' });
      }
      return q.promise;
   }

   /**
    * Function browse jobs for frontEnd
     * @param {object} jobSearchData data for filtering search
     * @param {number} pp per page
     * @param {number} pg page number
    **/
   getJobsListing(jobSearchData, pp, pg) {

      /**
       * @NOTES : 
       * 1. Draft jobs are not displayed for browse jobs (Only for myjobs)
       * 2. When user lat long are not passed then radius and distance is ignored
       * 3. Default radius is 50 miles until it is -1 in which radius is ignored
       * 4. Filtering is seperated by AND operator
       * 5. Alias 'uaj' is for applied jobs . Applied jobs are jobs for which user has applied and thet are still "OPEN" 
       * **/

      console.log(jobSearchData);

      var q = Q.defer();
      var me = this;
      try {
         var rowCount = pp;
         var offset = (pg - 1) * pp;
         var sort_by = (jobSearchData.sort_by) ? jobSearchData.sort_by : 'most_recent';
         var radius = (jobSearchData.radius) ? jobSearchData.radius : 50; // radius is in KM 

         // implements sorting
         var sort_by_map = {
            'most_recent': ['ut.task_post_date', 'desc'],
            'distance': ['distance', 'desc'],
            'price_asc': ['ut.task_price', 'asc'],
            'price_desc': ['ut.task_price', 'desc'],
            'task_status': ['task_activity_status', 'desc']
         };

         var columnsToSelect = [
            'ut.*', 'jc.*', 'upto.profile_pic',
            "CONCAT(CAST(tp.first_name AS char), '',CAST(tp.last_name as char)) as full_name",
            'IFNULL(utc.comments_count,0) as comments_count',
            'IFNULL(uto.offers_count,0) as offers_count',
            'IF(uaj.offer_id,4,ut.task_activity_status) as formatted_activity_status',
            'uaj.offer_id as applied_offer_id', 'uaj.offered_by'
         ];

         var countQueryColumns = ['IF(uaj.offer_id,4,ut.task_activity_status) as formatted_activity_status'];

         var whereClause = ['1=1'];
         var havingClause = ['1=1'];


         // implements filtering
         var fieldsForFiltering = {
            title: ['ut.task_name', 'like'],
            category: ['ut.task_category_id', '='],
            is_online: ['ut.task_online', '=']
         };

         // filtering for distance
         if (jobSearchData.user_current_lat && jobSearchData.user_current_long) {
            /** Distance is in miles**/
            var distanceColumn = `3959 * acos ( cos ( radians(${jobSearchData['user_current_lat']}) ) * cos( radians( ut.latitude ) ) *
               cos( radians( ut.longitude ) - radians(${jobSearchData['user_current_long']}) ) + sin ( radians(${jobSearchData['user_current_lat']}) ) *
               sin( radians( ut.latitude ) ) )  AS distance `;
            columnsToSelect.push(distanceColumn);
            countQueryColumns.push(distanceColumn);
            /** if radius is -1 then it means anywhere**/
            if (radius != -1) {
               havingClause.push(`AND distance <= ${radius}`);
            }
         }

         // filtering for job activity status
         if (jobSearchData.job_status || jobSearchData.job_status === 0) {
            havingClause.push(`AND formatted_activity_status = '${jobSearchData.job_status}'`);
         }


         // filtering for my jobs only
         if (jobSearchData.myjobs == true) {
            whereClause.push(`AND (uaj.offered_by = ${me.escape(jobSearchData.user_id)} 
                              OR ut.user_id = ${me.escape(jobSearchData.user_id)}
                              OR ut.task_worker_id = ${me.escape(jobSearchData.user_id)}
                              )`);
         }
         else {
            /** If other user jobs are to be searched**/
            if (jobSearchData.searchForUserjobs) {
               whereClause.push(`AND ut.user_id = ${me.escape(jobSearchData.searchForUserjobs)}`);
            }
            whereClause.push('AND task_activity_status <> 0');
         }

         _.each(fieldsForFiltering, function (dbFieldOperator, paramInSearch) {
            if (jobSearchData[paramInSearch] !== null && jobSearchData.hasOwnProperty(paramInSearch)) {
               var searchField = jobSearchData[paramInSearch];
               if (dbFieldOperator[1] == 'like') {
                  searchField = `%${jobSearchData[paramInSearch]}%`;
               }
               whereClause.push(`AND ${dbFieldOperator[0]} ${dbFieldOperator[1]} ${me.escape(searchField)}`);
            }
         });

         var sqlForData = `SELECT ${columnsToSelect.join(",")} 
                           FROM jobs ut 
                           JOIN job_categories jc ON jc.category_id = ut.task_category_id 
                           JOIN users tp ON tp.id = ut.user_id 
                           LEFT JOIN user_profile upto ON upto.user_id = ut.user_id 
                           LEFT JOIN (SELECT count(comment_id) as comments_count,task_id FROM job_comments GROUP BY task_id) utc on utc.task_id = ut.task_id 
                           LEFT JOIN (SELECT count(offer_id) as offers_count,task_id FROM job_offers GROUP BY task_id) uto on uto.task_id = ut.task_id 
                           LEFT JOIN job_offers uaj ON uaj.task_id = ut.task_id 
                                    AND uaj.offered_by = ${me.escape(jobSearchData.user_id)} AND ut.task_activity_status=1
                           WHERE ${whereClause.join(' ')} 
                           GROUP BY ut.task_id 
                           HAVING ${havingClause.join(' ')}                                               
                           ORDER BY ${sort_by_map[sort_by][0]} ${sort_by_map[sort_by][1]} 
                           LIMIT ${offset}, ${rowCount} ;`;

         var sqlForCount = `SELECT count(*) as records_count
                            FROM (
                                    SELECT ${countQueryColumns.join(",")}
                                    FROM jobs ut 
                                    JOIN job_categories jc ON jc.category_id = ut.task_category_id 
                                    LEFT JOIN job_offers uaj ON uaj.task_id = ut.task_id 
                                             AND uaj.offered_by = ${me.escape(jobSearchData.user_id)} AND ut.task_activity_status=1
                                    JOIN users tp ON tp.id = ut.user_id        
                                    WHERE ${whereClause.join(' ')}
                                 ) AS dtbl 
                            WHERE ${havingClause.join(' ')}`; // Using having condition as where for count as you cant group by here

         var finalSql = sqlForData + sqlForCount;

         this.app.mysqldb.query(finalSql, {}).then(function (multiRowset) {
            var data = [];
            _.each(multiRowset[0], function (taskRow) {
               var row = {
                  "task_id": taskRow.task_id,
                  "task_name": taskRow.task_name,
                  "task_description": taskRow.task_description,
                  "hourly_rate": taskRow.hourly_rate,
                  "task_post_date": Date.parse(taskRow.task_post_date),
                  "hours": taskRow.hours,
                  "category_name": taskRow.category_name,
                  "category_id": taskRow.category_id,
                  "task_url": taskRow.task_url_name,
                  "task_price": taskRow.task_price,
                  "done_online": taskRow.task_online,
                  "due_date": taskRow.task_end_datetime,
                  "activity_status": me.statusIdToTextMap[taskRow.formatted_activity_status],
                  "comment_count": taskRow.comments_count,
                  "offer_count": taskRow.offers_count,
                  "offer_id": taskRow.applied_offer_id,
                  "userDetails": {
                     'fullname': taskRow.full_name,
                     'user_id': taskRow.user_id,
                     'profile_image': me.app.helper.serverUrl({
                        partialUrl: taskRow.profile_pic
                     })
                  },
                  "locationDetails": {
                     'distance': taskRow.distance || null,
                     'location': taskRow.location,
                     'longitude': taskRow.longitude,
                     'latitude': taskRow.latitude,
                  }
               };
               data.push(row);
            });

            var metaInfo = {
               "total": (multiRowset[1].length > 0) ? multiRowset[1][0].records_count : 0,
               "pg": pg,
               "pp": rowCount,
               "totalInPage": multiRowset[0].length
            };
            var returnSet = {
               jobs: data,
               meta: metaInfo
            };

            var message = _.isEmpty(data) ? "Currently there are no jobs to fetch" : "Fetched  data successfully.";
            q.resolve({ status: "SUCCESS", message: message, data: returnSet });
         }).catch(function (error) {
            q.reject({ status: "500", message: 'Internal Server Error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal Server Error' });
      }
      return q.promise;
   }

   /**
    * Function to get job list that are to be revieweed 
    **/
   getJobsToReview(userId, pp, pg) {
      var q = Q.defer();
      var me = this;
      try {
         var rowCount = pp;
         var offset = (pg - 1) * pp;
         var sql = ` #Get Jobs To Review 
                     SELECT j.*,CONCAT(u.first_name,' ',u.last_name) as full_name,up.profile_pic 
                     FROM jobs j
                     LEFT JOIN  users u ON j.task_worker_id=u.id
                     LEFT JOIN  user_profile up ON j.task_worker_id=up.user_id
                     WHERE j.user_id =:uId AND task_activity_status = 3 AND is_reviewed = '0'
                     LIMIT ${offset} ,${rowCount};

                     #Get total record count
                     SELECT count(task_id) as record_count
                     FROM jobs 
                     WHERE user_id =:uId AND task_activity_status = 3 AND is_reviewed = '0'
                     GROUP by user_id;`;

         this.app.mysqldb.query(sql, { "uId": userId }).then(function (multiRowset) {
            var data = [];
            _.each(multiRowset[0], function (taskRow) {
               var row = {
                  "task_id": taskRow.task_id,
                  "task_name": taskRow.task_name,
                  "fixer_id": taskRow.task_worker_id,
                  "fixer_name": taskRow.full_name,
                  "assigned_date": taskRow.task_assigned_date,
                  'completed_date': taskRow.task_complete_date,
                  'fixer_profile_image': me.app.helper.serverUrl({
                     partialUrl: taskRow.profile_pic
                  })
               };
               data.push(row);
            });
            var metaInfo = {
               "total": (multiRowset[1].length > 0) ? multiRowset[1][0].record_count : 0,
               "pg": pg,
               "pp": rowCount,
               "totalInPage": multiRowset[0].length
            };

            var returnSet = {
               jobsToReview: data,
               meta: metaInfo
            };

            var message = _.isEmpty(data) ? "Currently there are no jobs to be fetched" : "Fetched data successfully.";
            q.resolve({ status: "SUCCESS", message: message, data: returnSet });
         }).catch(function (error) {
            q.reject({ status: "500", message: 'Internal Server Error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal Server Error' });
      }
      return q.promise;
   }


   /**
    * Function to get job categories
    * **/
   getJobCategories() {
      var q = Q.defer();
      try {
         var sql = `SELECT *,'e.g Clean my 2 bedroom apartment' as placeholder FROM job_categories WHERE category_status = 1`;

         this.app.mysqldb.query(sql, {}).then(function (response) {
            if (response.length > 0) {
               var returnSet = [];
               _.each(response, function (row) {
                  returnSet.push({
                     category_id: row.category_id,
                     category_name: row.category_name,
                     category_description: row.description,
                     is_online: row.is_online,
                     placeholder: row.placeholder,
                     category_image: process.env.APP_API_HOST + "/uploads/jobs_categories/" + row.category_image
                  });
               });
               q.resolve({ status: "SUCCESS", data: returnSet });
            }
            else {
               //incorrect query
               q.reject({ status: "500", message: 'Internal Server Error' });
            }
         }).catch(function (error) {
            q.reject({ status: "500", message: 'Internal Server Error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal Server Error' });
      }
      return q.promise;
   }


   /**
   * Function to get delete offer 
    * @param {number} jobId id of job to delete
    * @param {number} userId id of user who is deleting the job
   * */
   deleteJob(jobId, userId) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `SELECT *
                    FROM jobs
                    WHERE task_id = ?`;
         this.app.mysqldb.query(sql, [jobId]).then(function (response) {
            if (response.length == 0) {
               q.reject({ status: "400", message: 'No job with given id' });
               return q.promise;
            }
            else if (response[0].user_id != userId) {
               q.reject({ status: "400", message: 'Only poster can delete the job' });
               return q.promise;
            }
            else if (response[0].task_activity_status < 1) {
               q.reject({ status: "400", message: 'Only open jobs can be deleted' });
               return q.promise;
            }
            else {
               var sql = `DELETE FROM jobs WHERE task_id = ?`;
               return me.app.mysqldb.query(sql, [jobId]);
            }
         }).then(function (response) {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: 'Job successfully deleted' });
            }
            else {
               q.reject({ status: "404", message: 'Error deleting job' });
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


   /** Function to upload job document
   * @param {int} jobId id of the job for which document is to be uploaded
   * @param {file} documentFile uploaded document file
   **/
   uploadJobDoc(jobId, documentFile) {
      var q = Q.defer();
      try {
         var uploadFileObj = {
            "destination": 'uploads/jobs/',
            "tempFile": documentFile.path,
            "uploadedFileName": documentFile.name,
            "nameOnFileSystem": jobId,
         };
         this.app.helper.uploadFile(uploadFileObj).then(response => {
            var sql = `INSERT INTO job_docs (job_id,document_name) VALUES (?,?)`;
            return this.app.mysqldb.query(sql, [jobId, uploadFileObj.destination + response.uploadedFile]);
         }).then(response => {
            if (response.insertId > 0) {
               q.resolve({ status: "SUCCESS", "message": "Document successfully uploaded" });
            }
            else {
               q.reject({ status: "400", message:'Failed upload' });
            }
         }).catch((error) => {
            q.reject({ status: "400", message:"Failed SQL" });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal Server Error' });
      }
      return q.promise;
   }


   /**
   * Function to create job 
   * @param {number} userId id of the user
   * @param {object} jobData Job data to be posted
   * **/
   postNewJob(userId, jobData) {
      var q = Q.defer();
      try {
         var sql = `INSERT INTO jobs (task_name,task_url_name,task_description,task_category_id,user_id,task_post_date,location,latitude,longitude)
                      VALUES (:tn,:tu,:td,:tc,:uId,NOW(),:loc,:lat,:long);
                    `;
         var insertParams = {
            tn: jobData.job_name,
            tu: shortid.generate(),
            td: jobData.job_description,
            tc: jobData.category_id,
            uId: jobData.user_id,
            loc: jobData.location,
            lat: jobData.latitude,
            long: jobData.longitude
         };
         this.app.mysqldb.query(sql, insertParams).then(function (response) {
            var insertionResponse = response;
            if (insertionResponse.insertId) {
               q.resolve({ status: "SUCCESS", insertedJobId: insertionResponse.insertId });
            }
            else {
               //incorrect insertion
               q.reject({ status: "400", error: 'Incorrect insertion' });
            }
         }).catch(function (error) {
            q.reject({ status: "500", error: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", error: 'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to assign job
    * @param {number} offerId  offer id against which job is assigned  
    * @param {number} userId  id of the user who assigning the job 
    * @Notes : 1. only job poster can assign job .
               2. Only open jobs can be assigned.
    **/
   assignJob(offerId, userId) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `SELECT j.*,jo.offered_by ,jo.offer_amount
                    FROM job_offers jo 
                    JOIN jobs j ON j.task_id = jo.task_id AND jo.offer_id = :oId`;
         var requiredDetails = {};
         this.app.mysqldb.query(sql, { oId: offerId }).then(function (response) {
            if (response.length > 0) {
               requiredDetails = response[0];
               if (requiredDetails.user_id != userId) {
                  q.reject({ status: "400", error: 'Only Job poster can assign job' });
                  return q.promise;
               }
               else if (requiredDetails.task_activity_status != 1) {
                  q.reject({ status: "400", error: 'Only open job can be assigned' });
                  return q.promise;
               }
               else {
                  // do transaction for escrow account
                  var objPaymentModel = new paymentModel(me.app);
                  var transactAmount = requiredDetails.offer_amount;
                  var trxObj = {
                     task_id: requiredDetails.task_id,
                     userId: requiredDetails.user_id,
                     amount: transactAmount,
                     flow: 2 // outgoing
                  };
                  return objPaymentModel.transact(trxObj);
               }
            }
            else {
               q.reject({ status: "400", error: 'Invalid offer' });
               return q.promise;
            }
         }).then(response => {
            var assignSql = `UPDATE job_offers SET is_assigned = 1 WHERE offer_id = :oId;
                             UPDATE jobs SET task_worker_id = :tw, task_assigned_date = NOW(),
                             task_activity_status = 2 
                             WHERE task_id = :tId`;
            return me.app.mysqldb.query(assignSql, { oId: offerId, tw: requiredDetails.offered_by, tId: requiredDetails.task_id });
         }).then(response => {
            /** Trigger Notification **/
            var objNotificationModel = new notificationModel(me.app);
            // notification for bidder
            var notificationObjBidder = {
               from_user: userId,
               notification_type: 'task_updates',
               templateId: objNotificationModel.templates.job_assigned[0],
               notification_data: { job_title: requiredDetails.task_name },
               metadata: { task_id: requiredDetails.task_id, type: objNotificationModel.templates.job_assigned[1] }
            };
            // notification for poster
            var notificationObjPoster = {
               from_user: userId,
               notification_type: 'transactional',
               templateId: objNotificationModel.templates.user_charged[0],
               notification_data: { job_title: requiredDetails.task_name, amount: requiredDetails.offer_amount },
               metadata: { task_id: requiredDetails.task_id, type: objNotificationModel.templates.user_charged[1] }
            };
            // sending notifications asynchronously
            Q.all([
               objNotificationModel.notify(notificationObjBidder, requiredDetails.offered_by),
               objNotificationModel.notify(notificationObjPoster, requiredDetails.user_id)
            ]).catch(error => {
               console.log(error);
            });
            q.resolve({ status: 'SUCCESS', 'message': 'Job successfully assigned' });
         }).catch(function (error) {
            console.log(error);
            q.reject({ status: "400", error: 'Error assigning job' });
         });
      }
      catch (error) {
         q.reject({ status: "500", error: 'Internal Server error' });
      }
      return q.promise;
   }

   /**
    * Function to complete job
    * @param {number} jobId  job which is to be completed
    * @param {number} userId  id of the user marking job as completed 
    * @Notes : 1. only job poster can complete job .
               2. Only assigned jobs can be completed.
    **/
   completeJob(taskId, userId) {
      var q = Q.defer();
      var me = this;
      var requiredDetails = {};
      var transactAmount = null;
      try {
         var sql = `SELECT j.task_id ,j.user_id ,j.task_activity_status,j.task_name,
                           jo.offered_by,jo.offer_amount FROM jobs j 
                    JOIN job_offers jo ON j.task_id =jo.task_id AND is_assigned=1 AND jo.task_id = :tId
                    WHERE j.task_id = :tId  `;
         this.app.mysqldb.query(sql, { tId: taskId }).then(function (response) {
            if (response.length > 0) {
               requiredDetails = response[0];
               if (requiredDetails.user_id != userId) {
                  q.reject({ status: "400", error: 'Only Job poster can complete job' });
                  return q.promise;
               }
               else if (requiredDetails.task_activity_status != 2) {
                  q.reject({ status: "400", error: 'Only assigned job can be completed' });
                  return q.promise;
               }
               else {
                  // do transaction for escrow account
                  var objPaymentModel = new paymentModel(me.app);
                  transactAmount = requiredDetails.offer_amount - (requiredDetails.offer_amount * (siteConst.serviceTax / 100));
                  var trxObj = {
                     task_id: requiredDetails.task_id,
                     userId: requiredDetails.offered_by,
                     amount: transactAmount,
                     flow: 1 // outgoing
                  };
                  return objPaymentModel.transact(trxObj);
               }
            }
            else {
               q.reject({ status: "400", error: 'Invalid job' });
               return q.promise;
            }
         }).then(response => {
            var sql = ` UPDATE jobs SET  task_complete_date = NOW(),task_activity_status = 3 WHERE task_id = :tId`;
            return me.app.mysqldb.query(sql, { tId: taskId });
         }).then(response => {
            /** Trigger Notification **/
            var objNotificationModel = new notificationModel(me.app);
            // notification for bidder
            var notificationObjBidder1 = {
               from_user: userId,
               notification_type: 'task_updates',
               templateId: objNotificationModel.templates.job_completed[0],
               notification_data: { job_title: requiredDetails.task_name },
               metadata: { task_id: requiredDetails.task_id, type: objNotificationModel.templates.job_completed[1] }
            };
            // notification for poster
            var notificationObjBidder2 = {
               from_user: userId,
               notification_type: 'transactional',
               templateId: objNotificationModel.templates.user_paid[0],
               notification_data: { job_title: requiredDetails.task_name, amount: transactAmount },
               metadata: { task_id: requiredDetails.task_id, type: objNotificationModel.templates.user_paid[1] }
            };
            // sending notifications asynchronously
            Q.all([
               objNotificationModel.notify(notificationObjBidder1, requiredDetails.offered_by),
               objNotificationModel.notify(notificationObjBidder2, requiredDetails.offered_by)
            ]).catch(error => {
               console.log(error);
            });
            q.resolve({ status: 'SUCCESS', 'message': 'Job successfully completed' });
         }).catch(function (error) {
            console.log(error);
            q.reject({ status: "400", error: 'Internal Server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", error: 'Internal Server error' });
      }
      return q.promise;
   }

   /**
      * Function to complete job
      * @param {number} userId  id of the user providing feedback 
      * @param {number} taskId  job which is to be reviewed
      * @param {object} feedbackData  object containing reviewed data
      * @Notes : 1. only job poster can review job .
                 2. Only completed jobs can be reviewed.
      **/
   handleJobFeedback(userId, taskId, feedbackData) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `SELECT * FROM jobs WHERE task_id = :tId`;
         this.app.mysqldb.query(sql, { tId: taskId }).then(function (response) {
            if (response.length > 0) {
               var jobInfo = response[0];
               if (jobInfo.user_id != userId) {
                  q.reject({ status: "400", error: 'Only Job poster can review job' });
               }
               else if (jobInfo.task_activity_status != 3) {
                  q.reject({ status: "400", error: 'Only completed jobs can be reviewed' });
               }
               else if (jobInfo.is_reviewed == '1') {
                  q.reject({ status: "400", error: 'You have already reviewed this job' });
               }
               else {
                  var sql = ` UPDATE jobs SET  is_reviewed = '1' WHERE  task_id = :tId;
                  INSERT INTO job_feedbacks (job_id,rating,feedback_tags,comment) VALUES (:tId,:rt,:ftags,:cm)`;
                  me.app.mysqldb.query(sql, { tId: taskId, rt: feedbackData.rating, cm: feedbackData.comment, ftags: feedbackData.feedback_tags })
                     .then((response) => {
                        if (response[1].affectedRows > 0) {
                           q.resolve({ status: 'SUCCESS', 'messgae': 'Feedback Successfully provided' });
                        }
                        else {
                           q.reject({ status: "400", error: 'Error  providing feedback' });
                        }
                     })
                     .catch((error) => {
                        console.log(error);
                        q.reject({ status: "400", error: 'Internal Server error' });
                     });
               }
            }
            else {
               q.reject({ status: "400", error: 'Invalid job' });
            }
         }).catch(function (error) {
            q.reject({ status: "500", error: 'Internal Server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", error: 'Internal Server error' });
      }
      return q.promise;
   }

   /**
   * Function to update job 
   * @param {number} jobId id of the job to be updated
   * @param {object} jobData Job data to be updated
   * **/
   updateJob(jobId, jobData) {
      var q = Q.defer();
      var me = this;

      try {

         /**
          * @NOTE: Keys in job data should correspond to table field 
          **/
         var updateParams = {};
         var columns = [];
         var sql = ``;

         var abn_number = jobData.abn_number;
         delete jobData.abn_number;

         /**
          * Check if job is posted as hourly or fixed 
          **/
         if (jobData.hourly_rate) {
            jobData.task_price = null;
         }
         else if (jobData.task_price) {
            jobData.hourly_rate = null;
            jobData.hours = null;
         }

         _.each(jobData, function (value, column) {
            columns.push(`${me.reqFieldMap[column]} = :${column}`);
            updateParams[column] = (value !== '') ? value : null;
         });

         if (columns.length > 0) {
            sql += `UPDATE jobs SET  ${columns.join(",")},urd=NOW() WHERE task_id = :ti;`;
         }
         if (abn_number) {
            sql += `UPDATE user_profile SET abn_number = ${me.escape(abn_number)} WHERE user_id = (SELECT user_id FROM jobs WHERE task_id = :ti);`;
         }

         if (sql == '') {
            q.reject({ status: "400", message: 'No data received for updation' });
         }
         else {
            updateParams.ti = jobId;
            this.app.mysqldb.query(sql, updateParams).then(function (response) {
               q.resolve({ status: "SUCCESS", message: "Job successfully updated" });
            }).catch(function (error) {
               q.reject({ status: "500", message: 'Internal server error' });
            });
         }
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to set  user status
    * @param {int} jobId id of job for which status is to be set
    * @param {int} status status to set
    **/
   updateJobStatus(jobId, status) {
      var q = Q.defer();
      var me = this;
      try {

         var columnsToUpdate = [`is_approved=${status}`];
         var sql = `UPDATE jobs SET ${columnsToUpdate.join(',')} WHERE task_id = ?`;
         this.app.mysqldb.query(sql, [jobId]).then(response => {
            q.resolve({ status: "SUCCESS", message: 'Status successfully set' });
         }).catch((error) => {
            q.reject({ status: "ERROR", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "ERROR", message: 'Internal server error' });
      }
      return q.promise;
   }
}

module.exports = JobModel;


