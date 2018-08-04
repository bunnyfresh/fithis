"use strict";
var Q = require('q');
var _ = require('lodash');
const userDeviceModel = require('./usersdevices.model');
var twilio = require('twilio');
var uniqid = require('uniqid');
const notificationTemplates = require("../consts/notificationtemplates");
const baseModel = require("./base.model");

class NotificationsModel extends baseModel {
   constructor(app) {
      super(app);
      this.templates = notificationTemplates;
   }

   /**
    * Function to get user conversation
     * @param {number} userId user for which conversation is to be fetched
     * @param {number} pp records per page
     * @param {number} pg page number
    * **/
   getUserNotifications(userId, pp, pg) {
      var q = Q.defer();
      var me = this;
      var rowCount = pp;
      var offset = (pg - 1) * pp;
      try {
         var sql = `SELECT un.*,up.profile_pic,snt.template
                    FROM user_notifications un
                    LEFT JOIN user_profile up ON up.user_id = un.from_user_id
                    JOIN  sys_notification_templates snt ON snt.id = un.template_id
                    WHERE un.user_id =:uId 
                    ORDER BY un.crd DESC
                    LIMIT ${offset} ,${rowCount};`;
         var sqlForCount = `SELECT count(id) as records_count
                            FROM user_notifications
                            WHERE user_id = :uId
                            GROUP BY user_id ;`  ;
         sql = sql + sqlForCount;
         this.app.mysqldb.query(sql, { "uId": userId }).then(function (multiRowset) {
            var data = [];
            _.each(multiRowset[0], function (notificationRow) {
               var row = {
                  "notification_id": notificationRow.id,
                  "from_user_id": notificationRow.from_user_id,
                  'notification_text': me.app.helper.prepareBodyFromTemplate(notificationRow.template, JSON.parse(notificationRow.data)),
                  "metadata": JSON.parse(notificationRow.metadata),
                  "timestamp": Date.parse(notificationRow.crd),
                  "sender_profile_image": me.app.helper.serverUrl({
                     partialUrl: notificationRow.profile_pic
                  })
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
   * Function to get user conversation
    * @param {number} userId user for whom settings are to be inserted 
   * **/
   insertDefaultNotificationSettings(userId) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `INSERT INTO user_notification_settings(user_id,notification_type)  
                    SELECT '${me.app.mysqldb.db.escape(userId)}',id FROM sys_notification_types as snt
                    ON DUPLICATE KEY UPDATE notification_type=snt.id`;

         this.app.mysqldb.query(sql, []).then(function (response) {
            if (response.affectedRows > 0) {
               q.resolve(true);
            }
            else {
               //incorrect insertion
               q.reject(false);
            }
         }).catch(function (error) {
            q.reject(false);
         });
      }
      catch (error) {
         q.reject(false);
      }
      return q.promise;
   }


   /** Function to notify user according to user settings
    * @param {object} notificationInfo notificationInfo
    * @param {number} userId id of the user
    **/
   notify(notificationInfo, userId) {
      var q = Q.defer();
      var me = this;
      try {
         var notification_type = notificationInfo.notification_type;

         var selectSettingsSql = `# Get user settings and info
                                  SELECT u.email as useremail,up.mobile_number,up.is_mobile_verified,CONCAT_WS('>==<',uns.email,uns.push,uns.sms) as settings
                                  FROM user_notification_settings uns 
                                  RIGHT JOIN users u ON u.id = uns.user_id 
                                  AND notification_type = (SELECT id FROM sys_notification_types WHERE system_name = :nsn) LEFT JOIN user_profile up on up.user_id = u.id 
                                  WHERE u.id = :uid;
                                  
                                  #get template info
                                  SELECT * FROM sys_notification_templates WHERE id = :ti; `;

         var queryParams = { uid: userId, nsn: notification_type, ti: notificationInfo.templateId };
         this.app.mysqldb.query(selectSettingsSql, queryParams).then(function (multiResponse) {

            /** Send response according to settings **/
            var promisesToNotify = [];

            var respQ1 = multiResponse[0];
            var respQ2 = multiResponse[1];

            if (respQ1.length > 0) {
               var row = respQ1[0];

               var notification_text = me.app.helper.prepareBodyFromTemplate(respQ2[0].template, notificationInfo.notification_data);
               notificationInfo.notification_text = notification_text;

               var userSettings = row.settings.split('>==<');
               // send email
               if (userSettings[0]) {
                  promisesToNotify.push(me._sendEmailNotification(row.useremail, notification_text));
               }
               // send push
               if (userSettings[1]) {
                  promisesToNotify.push(me._sendPushNotification(userId, notificationInfo));
               }
               // send sms
               if (userSettings[2] && row.is_mobile_verified) {
                  promisesToNotify.push(me._sendSmsNotification(row.mobile_number, notification_text));
               }
            }

            /** Insert in notification log only if any of the notification settings is on **/
            if (promisesToNotify.length > 0) {
               return Q.all(promisesToNotify);
            }
            else {
               q.resolve(true);
               return q.promise;
            }
         }).then(response => {
            if (response.length > 0) {
               return me.insertNotificationLogs(notificationInfo, userId);
            }
            else {
               q.resolve(true);
               return q.promise;
            }
         }).then(response => {
            q.resolve(true);
         }).catch(function (error) {
            console.log(error);
            q.reject(false);
         });
      }
      catch (error) {
         console.log(error);
         q.reject(false);
      }
      return q.promise;
   }

   /**
    * Function insert notification logs
  * @param {object} rowData Notification Row data to insert
  * @param {integer} userId user for which notification is to be set
    **/
   insertNotificationLogs(rowData, userId) {
      var q = Q.defer();

      try {
         var sql = `INSERT INTO user_notifications SET 
                    id=:id, user_id = :uid ,template_id=:ti,metadata=:md,
                    from_user_id = :fuid, data=:di`;

         var notificationRow = {
            id: uniqid.time(),
            uid: userId,
            ti: rowData.templateId,
            fuid: rowData.from_user,
            di: JSON.stringify(rowData.notification_data),
            md: rowData.metadata ? JSON.stringify(rowData.metadata) : null
         };

         this.app.mysqldb.query(sql, notificationRow).then(function (response) {
            q.resolve(true);
         }).catch(function (error) {
            q.reject(false);
         });

      }
      catch (error) {
         q.reject(false);
      }
      return q.promise;
   }

   /**
      * Function to send push notification
    * @param {number} userId id of user
    * @param {object} userInfo  Notification MetaRow
    * @param {string} notification Notification text
   **/

   _sendPushNotification(userId, notificationInfo) {
      var q = Q.defer();
      var me = this;
      try {
         var objUserDeviceModel = new userDeviceModel(me.app);
         objUserDeviceModel.getUserDevices(userId).then(function (rowSet) {
            var promisesToNotify = [];
            _.each(rowSet, function (row) {
               var deviceType = row.device_type;
               var deviceTokens = row.device_token.split(',');
               var notificationConnector = me.app.notifications.connectionFactory.getNotificationConnector({ device_type: deviceType });
               promisesToNotify.push(notificationConnector.sendPush(notificationInfo.notification_text, {}, deviceTokens));
            });
            Q.all(promisesToNotify).then(response => {
               q.resolve(true);
            }).catch(error => {
               q.reject(false);
            });
         }).catch(function (error) {
            q.reject(false);
         });
      }
      catch (error) {
         q.reject(false);
      }
      return q.promise;
   }



   /**
      * Function to send email notification
    * @param {string} userEmail email of user
    * @param {string} notification Notification text
   **/
   _sendEmailNotification(userEmail, notification) {
      var q = Q.defer();
      var me = this;
      try {
         var htmlMail = `<div>
                        <div>Fixthys Notification</div>
                        <p>${notification}</p>
                        </div>`;

         var mailObj = {
            to: userEmail,
            html: htmlMail,
            text: notification,
            subject: 'Fixthys Notification'
         };
         me.app.mailer.send(mailObj);
         q.resolve(true);
      }
      catch (error) {
         q.reject(false);
      }
      return q.promise;

   }


   /**
      * Function to send sms notification
    * @param {string} userPhone phone number of user
    * @param {string} notification Notification text
    **/
   _sendSmsNotification(userPhone, notification) {
      var q = Q.defer();
      try {
         var twilioClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTHTOKEN);
         twilioClient.messages.create({
            body: notification,
            to: process.env.TWILIO_COUNTRY_CODE + userPhone,
            from: process.env.TWILIO_NUMBER
         }).then(response => {
            q.resolve(true);
         }).catch((error) => {
            q.reject(false);
         });
      }
      catch (error) {
         q.reject(false);
      }
      return q.promise;
   }

}

module.exports = NotificationsModel;


