"use strict";
var Q = require('q');
var _ = require('lodash');
const baseModel = require("./base.model");

class TaskAlertsModel extends baseModel {

   /**
   * Function to list skill 
   * @param {number} userId id of the user
   * @param {number} pp records per page
   * @param {number} pg page number
   * **/
   getTaskAlertList(userId, pp, pg) {
      var q = Q.defer();
      var rowCount = pp;
      var offset = (pg - 1) * pp;
      try {
         var sql = `SELECT * 
                    FROM user_task_alerts 
                    WHERE user_id = :uId
                    ORDER BY crd DESC
                    LIMIT ${offset} ,${rowCount};`;

         var sqlForCount = `SELECT count(alert_id) as records_count
                            FROM user_task_alerts
                            WHERE user_id = :uId
                            GROUP BY user_id ;`  ;
         sql = sql + sqlForCount;
         this.app.mysqldb.query(sql, { "uId": userId }).then(function (multiRowset) {
            var data = [];
            _.each(multiRowset[0], function (taskAlertRow) {
               var row = {
                  "alert_id": taskAlertRow.alert_id,
                  "alert_type": taskAlertRow.alert_type,
                  "keyword": taskAlertRow.keyword,
                  "suburb": taskAlertRow.suburb,
                  "latitude": taskAlertRow.suburb_lat,
                  "longitude": taskAlertRow.suburb_long,
                  "distance": taskAlertRow.distance,
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
               notifications: data,
               meta: metaInfo
            };

            var message = _.isEmpty(data) ? "Currently there are no notifications to fetch" : "Fetched  data successfully.";
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
    * Function to add user skill 
     * @param {number} userId id of user
     * @param {object} alertData alertData
    * */
   addTaskAlert(userId, alertData) {
      var q = Q.defer();
      var me = this;
      try {
         alertData.user_id = userId;
         var columns = [];
         var values = [];
         _.each(alertData, function (value, column) {
            if (value !== null) {
               columns.push(column);
               values.push(me.escape(value));
            }
         });

         var sql = `INSERT INTO user_task_alerts(${columns.join(",")})
                      VALUES (${values.join(',')});`;

         this.app.mysqldb.query(sql, []).then(function (response) {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: 'Alert added successfully', data: { insertedAlertId: response.insertId } });
            }
            else {
               //incorrect insertion
               q.reject({ status: "400", message: 'Error adding alert' });
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
    * Function to add user skill 
     * @param {number} alertId id of alert
     * @param {object} alertData alertData update data
    * */
   updateTaskAlert(alertId, alertData) {
      var q = Q.defer();
      var me = this;
      try {

         var updations = [];
         _.each(alertData, function (value, column) {
            if (value !== null) {
               updations.push(`${column} = ${me.escape(value)}`);
            }
         });

         if (updations) {
            var sql = `UPDATE user_task_alerts SET ${updations.join(",")}
            WHERE alert_id = ?;`;
            this.app.mysqldb.query(sql, [alertId]).then(function (response) {
               q.resolve({ status: "SUCCESS", message: 'Alert updated successfully' });
            }).catch(function (error) {
               q.reject({ status: "500", message: 'Internal server error' });
            });
         }
         else {
            q.reject({ status: "400", message: 'No data to update' });
         }

      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to add user skill 
     * @param {number} alertId  id of alert
     * @param {number} userId  id of user
    * */
   deleteTaskAlert(alertId, userId) {
      var q = Q.defer();
      var me = this;
      try {
         /**
          * User can delete only his alert 
          **/
         var sql = `DELETE FROM user_task_alerts WHERE alert_id = ? AND user_id = ?`;
         this.app.mysqldb.query(sql, [alertId, userId]).then(function (response) {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: 'Alert successfully deleted' });
            }
            else {
               //incorrect insertion
               q.reject({ status: "400", message: 'Error deleting task alert' });
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
}

module.exports = TaskAlertsModel;


