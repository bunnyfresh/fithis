"use strict";
var Q = require('q');
const basejobModel = require("../jobs.model");
const _ = require('lodash');
var shortid = require('shortid');

class AdminJobModel extends basejobModel {

   /**
     * Function browse jobs for admin
     * @param {number} pp per page
     * @param {number} pg page number
     * @param {object} filters filters for listing
   **/

   getJobListingForAdmin(pp, pg, filters) {

      /**
     * @NOTES : 
     * 1. Filtering is seperated by OR operator
     * **/
      var q = Q.defer();
      var me = this;
      try {
         var rowCount = pp;
         var offset = (pg - 1) * pp;

         var columnsToSelect = [
            'ut.*', 'jc.*', 'upto.profile_pic',
            "CONCAT(CAST(tp.first_name AS char), '',CAST(tp.last_name as char)) as full_name",
         ];

         var countQueryColumns = ['COUNT(ut.task_id) as records_count'];
         var whereClause = [];

         // implements filtering
         var fieldsForFiltering = {
            title: ['ut.task_name', 'like'],
            location: ['ut.location', '='],
            username: ['CONCAT(tp.first_name," ",tp.last_name)', 'like'],
         };

         /** Filtering for search key **/
         if (filters.search_key) {
            var filterWhere = [];
            _.each(fieldsForFiltering, function (dbFieldOperator) {
               var searchField = filters.search_key;
               if (dbFieldOperator[1] == 'like') {
                  searchField = `%${filters.search_key}%`;
               }
               filterWhere.push(`${dbFieldOperator[0]} ${dbFieldOperator[1]} ${me.app.mysqldb.db.escape(searchField)}`);
            });
            whereClause.push(`(${filterWhere.join('OR')})`);
         }

         /** Filtering form job status**/
         if (filters.job_status) {
            whereClause.push(`task_activity_status = ${filters.job_status}`);
         }

         /** Filtering for user id**/
         if (filters.jobs_for_user) {
            whereClause.push(`ut.user_id = ${filters['jobs_for_user']}`);
         }

         var conditionalWhere = (whereClause.length) ? whereClause.join(' AND ') : 1;

         var sqlForData = `SELECT ${columnsToSelect.join(",")} 
                        FROM jobs ut 
                        JOIN job_categories jc ON jc.category_id = ut.task_category_id 
                        JOIN users tp ON tp.id = ut.user_id 
                        LEFT JOIN user_profile upto ON upto.user_id = ut.user_id                       
                        WHERE task_activity_status <> -1 AND (${conditionalWhere}) 
                        GROUP BY ut.task_id                                         
                        ORDER BY ${filters.sort_field} ${filters.sort_order} 
                        LIMIT ${offset}, ${rowCount} ;`;

         var sqlForCount = `SELECT ${countQueryColumns.join(",")}
                         FROM jobs ut 
                         JOIN users tp ON tp.id = ut.user_id        
                         WHERE task_activity_status <> 0 AND (${conditionalWhere})`;

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
                  "task_url": taskRow.task_url,
                  "task_price": taskRow.task_price,
                  "done_online": taskRow.task_online,
                  "due_date": taskRow.task_end_datetime,
                  "activity_status": me.statusIdToTextMap[taskRow.task_activity_status],
                  "userDetails": {
                     'fullname': taskRow.full_name,
                     'user_id': taskRow.user_id,
                     'profile_image': me.app.helper.serverUrl({
                        partialUrl: taskRow.profile_pic
                     })
                  },
                  "locationDetails": {
                     'location': taskRow.location,
                     'longitude': taskRow.longitude,
                     'latitude': taskRow.latitude,
                  },
                  'is_approved': taskRow.is_approved
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
            q.reject({ status: "ERROR", message: 'Internal Server Error' });
         });
      }
      catch (error) {
         q.reject({ status: "ERROR", message: 'Internal Server Error' });
      }
      return q.promise;
   }

   /**
   * Function to update job 
   * @param {object} jobData Job data to be updated
   *  @param {number} jobId id of the job to be updated
   * **/
   handleJobAdmin(jobData, jobId) {
      var q = Q.defer();
      var me = this;
      try {
         /**
          * @NOTE: Keys in job data should correspond to table field 
          **/
         var queryParams = {};
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
            queryParams[column] = (value !== '') ? value : null;
         });

         // if job id is there then update the job otherwise insert the job
         if (columns.length > 0) {
            if (jobId) {
               sql += `UPDATE jobs SET  ${columns.join(",")},urd=NOW() WHERE task_id = :ti;`;
               queryParams.ti = jobId;
            }
            else {
               columns.push(`task_url_name=${me.escape(shortid.generate())}`);
               sql += `INSERT INTO jobs SET  ${columns.join(",")}`;
            }
         }
         if (abn_number) {
            sql += `UPDATE user_profile SET abn_number = ${me.escape(abn_number)} WHERE user_id = (SELECT user_id FROM jobs WHERE task_id = :ti);`;
         }
         if (sql == '') {
            q.reject({ status: "400", message: 'No data received for job' });
         }
         else {
            this.app.mysqldb.query(sql, queryParams).then(function (response) {
               q.resolve({ status: "SUCCESS", message: "Job successfully handled", meta: { handledJobId: response.insertId || jobId } });
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

}

module.exports = AdminJobModel;


