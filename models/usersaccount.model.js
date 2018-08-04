"use strict";
var Q = require('q');
var _ = require('lodash');
var siteConsts = require('../consts/siteConsts');
var socialSites = require('../consts/socialsites');
const baseModel = require("./base.model");
const notificationModel = require("./notifications.model");
const feedbackModel = require("./feedbackrating");

class UsersAccountModel extends baseModel {

   /** Function to add user portfolio
    * @param {int} userId id of the user for whom portfolio is to be added
    * @param {file} portfolio uploaded portfolio 
    **/
   addUserPortfolio(userId, portfolio) {
      var q = Q.defer();
      try {
         var uploadFileObj = {
            "destination": 'uploads/users/',
            "tempFile": portfolio.path,
            "uploadedFileName": portfolio.name,
            "nameOnFileSystem": userId,
         };
         this.app.helper.uploadFile(uploadFileObj).then(response => {
            var sql = `INSERT INTO  user_portfolio  SET portfolio_media = ?,user_id = ?`;
            return this.app.mysqldb.query(sql, [uploadFileObj.destination + response.uploadedFile, userId]);
         }).then(response => {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: "Portfolio updated successfully", 'portfolio_id': response.insertId });
            }
            else {
               q.reject({ status: "400", message:'Failed update portofolio' });
            }
         }).catch((error) => {
            q.reject({ status: "500", message:'Internal server error' });
         });

      }
      catch (error) {
         q.reject({ status: "500",message:'Internal server error' });
      }
      return q.promise;
   }

   /** set user language
       * @param {int} userId id of the user for whom portfolio is to be removed
       * @param {number} languageId  id of the language to be set 
       **/
   setLanguage(userId, languageId) {
      var q = Q.defer();
      try {
         var sql = `INSERT INTO user_profile (user_id,app_language) VALUES (:uid,:lid) ON DUPLICATE KEY UPDATE app_language=VALUES(app_language);
                     SELECT lan_code FROM sys_app_languages WHERE id=:lid`;
         this.app.mysqldb.query(sql, { lid: languageId, uid: userId })
            .then(multiResponse => {
               var selectResponse = multiResponse[1];
               q.resolve({ status: "SUCCESS", "message": "Language successfully set", "update_lan_code": selectResponse[0].lan_code });
            }).catch((error) => {
               q.reject({ status: "ERROR", message:'Internal server error' });
            });
      }
      catch (error) {
         q.reject({ status: "ERROR", message:"Internal server error" });
      }
      return q.promise;
   }

   /** Function to remove user portfolio
    * @param {int} userId id of the user for whom portfolio is to be removed
    * @param {number} portfolioId  portfolio 
    **/
   removeUserPortfolio(userId, portfolioId) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `SELECT  portfolio_media FROM user_portfolio WHERE  portfolio_id = :pid ;
         DELETE FROM  user_portfolio  WHERE portfolio_id = :pid AND user_id = :uid`;
         this.app.mysqldb.query(sql, { pid: portfolioId, uid: userId })
            .then(multiresponse => {
               if (multiresponse[1].affectedRows > 0) {
                  var mediaPath = multiresponse[0][0].portfolio_media;
                  me.app.helper.removeFileFromSystem(mediaPath);
                  q.resolve({ status: "SUCCESS", "message": "Portfolio deleted successfully" });
               }
               else {
                  q.reject({ status: "400", message:'Failed delete' });
               }
            }).catch((error) => {
               q.reject({ status: "500", message: 'Internal server error' });
            });

      }
      catch (error) {
         q.reject({ status: "500", message:'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to handle user general info 
    * @param {int} userId id of the user info is to be updated
    * @param {object} infoToUpdate  Information to update 
    **/
   handleGeneralInfo(userId, infoToUpdate) {

      var q = Q.defer();
      var me = this;
      try {
         var userFields = { "first_name": "first_name", "last_name": "last_name" };
         var userProfileFields = { "location": "location", "tagline": "tagline", "about_me": "about" };

         var userUpdate = [];
         var userProfileUpdate = [];

         _.each(userFields, function (dbField, infoField) {
            if (infoToUpdate[infoField]) {
               userUpdate.push(`${dbField} = ${me.escape(infoToUpdate[infoField])}`);
            }
         });
         _.each(userProfileFields, function (dbField, infoField) {
            if (infoToUpdate[infoField] || null) {
               userProfileUpdate.push(`${dbField} = ${me.escape(infoToUpdate[infoField])}`);
            }
         });

         var sqlUserUpdate = '';
         var sqlUserProfileUpdate = '';
         if (userUpdate.length > 0) {
            sqlUserUpdate = `UPDATE users SET ${userUpdate.join(',')} WHERE id =:uId;`;
         }
         if (userProfileUpdate.length > 0) {
            sqlUserProfileUpdate = `UPDATE user_profile SET ${userProfileUpdate.join(',')} WHERE user_id =:uId;`;
         }
         var sqlToExecute = sqlUserProfileUpdate + sqlUserUpdate;
         if (sqlToExecute) {
            this.app.mysqldb.query(sqlToExecute, { 'uId': userId })
               .then(multiresponse => {
                  q.resolve({ status: "SUCCESS", message: "Information successfully updated" });
               }).catch((error) => {
                  console.log(error);
                  q.reject({ status: "500", message:'Internal server error' });
               });
         }
         else {
            q.reject({ status: "400", message: "No data to update" });
         }
      }
      catch (error) {
         console.log(error);
         q.reject({ status: "500", message:'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to handle user private info
    * @param {int} userId id of the user info is to be updated
    * @param {object} infoToUpdate  Information to update 
    * */
   handlePrivateInfo(userId, infoToUpdate) {
      var q = Q.defer();
      var me = this;
      try {
         var userFields = { "email": "email" };
         var userProfileFields = { "birth_date": "birth_date" };

         var userUpdate = [];
         var userProfileUpdate = [];

         _.each(userFields, function (dbField, infoField) {
            if (infoToUpdate[infoField]) {
               userUpdate.push(`${dbField} = ${me.escape(infoToUpdate[infoField])}`);
            }
         });
         _.each(userProfileFields, function (dbField, infoField) {
            if (infoToUpdate[infoField]) {
               userProfileUpdate.push(`${dbField} = ${me.escape(infoToUpdate[infoField])}`);
            }
         });

         var sqlUserUpdate = '';
         var sqlUserProfileUpdate;
         if (userUpdate.length > 0) {
            sqlUserUpdate = `UPDATE users SET ${userUpdate.join(',')} WHERE id =:uId;`;
         }
         if (userProfileUpdate.length > 0) {
            sqlUserProfileUpdate = `UPDATE user_profile SET ${userProfileUpdate.join(',')} WHERE user_id =:uId;`;
         }
         var sqlToExecute = sqlUserProfileUpdate + sqlUserUpdate;
         if (sqlToExecute) {
            this.app.mysqldb.query(sqlToExecute, { 'uId': userId })
               .then(multiresponse => {
                  q.resolve({ status: "SUCCESS", message: "Profile successfully updated" });
               }).catch((error) => {
                  console.log(error);
                  q.reject({ status: "ERROR",message:'Internal server error' });
               });
         }
      }
      catch (error) {
         console.log(error);
         q.reject({ status: "ERROR", message:'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to update alert preferences
    * @param {int} userId id of the user info is to be updated
    * @param {string} alertType  Type of alert for which information is to be fetched 
    * @param {object} preferences  preferences for different type of notifications 
    **/
   updateAlertPreferences(userId, alertType, preferences) {
      var q = Q.defer();
      var me = this;
      try {
         var settingsUpdates = [];
         _.each(preferences, function (value, alertMode) {
            if (value) {
               settingsUpdates.push(`${alertMode}=${value}`);
            }
         });
         if (settingsUpdates) {
            var sql = `INSERT INTO user_notification_settings SET ${settingsUpdates.join(',')} 
                        , notification_type=(SELECT id from sys_notification_types WHERE system_name = :nsn) , user_id = :uid
                        ON DUPLICATE KEY UPDATE ${settingsUpdates.join(',')}  `;
            me.app.mysqldb.query(sql, { 'uid': userId, 'nsn': alertType })
               .then(response => {
                  q.resolve({ status: "SUCCESS", "message": "Settings updated successfully" });
               }).catch((error) => {
                  q.reject({ status: "ERROR" });
               });
         }
         else {
            q.resolve({ status: "SUCCESS", "message": "Settings updated successfully" });
         }
      }
      catch (error) {
         q.reject({ status: "ERROR", message:'Internal server error' });
      }
      return q.promise;

   }

   /**
    * Function to get alert preferences
    * @param {int} userId id of the user info is to be updated
    * @param {string} alertType  Type of alert for which information is to be fetched 
    **/
   getAlertPreferences(userId, alertType) {
      var q = Q.defer();
      var me = this;
      try {
         var settings = [];
         var sql = `SELECT uns.*,snt.system_name 
                    FROM user_notification_settings uns 
                    RIGHT JOIN sys_notification_types snt ON snt.id = uns.notification_type AND uns.user_id=:uid
                    WHERE 1=1`;
         if (alertType) {
            sql = sql + ` AND snt.system_name = ${me.escape(alertType)}`;
         }

         var alertModeKeys = ["email", 'push', 'sms'];
         me.app.mysqldb.query(sql, { 'uid': userId, 'nsn': alertType })
            .then(response => {
               _.each(response, function (row, key) {
                  var values = {};
                  _.each(alertModeKeys, function (mode) {
                     values[mode] = row[mode] || 0;
                  });
                  settings.push({
                     values: values,
                     name: row.system_name
                  });
               });
               q.resolve({ status: "SUCCESS", "message": "Data fetched successfully", data: settings });
            }).catch((error) => {
               q.reject({ status: "400", message: 'Failed data fetch' });
            });

      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;

   }

   /** 
   * Function to get user ratings 
   * @param {int} userId id of the user for whom ratings is to be fetched
   ** */
   getUserRatings(userId) {
      var q = Q.defer();
      var me = this;
      try {
         var objFeedback = new feedbackModel(me.app);
         objFeedback.getUserFeedbackData(userId).then(response => {
            var data = response.rating;
            q.resolve({ status: "SUCCESS", data: data });
         }).catch(error => {
            q.reject({ status: "ERROR", message: "Internal Server error" });
         });
      }
      catch (error) {
         q.reject({ status: "ERROR", message: "Internal server error" });
      }
      return q.promise;

   }

   /**
    * Function to get user complete profile 
    * @param {int} userId id of the user
    **/
   getCompleteAccountProfile(userId) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `SELECT u.*,up.birth_date,up.social_profile_pic,up.mobile_number,up.is_mobile_verified,up.profile_pic,up.cover_pic,up.location,up.tagline,up.about,
                     sci.site_token as fbToken,upi.bank_token,up.is_fixer,
                     GROUP_CONCAT(CONCAT_WS('>==<',IFNULL(upo.portfolio_media,''),upo.portfolio_id) SEPARATOR ">===<") as portfolio  ,
                     us.skills                   
                     FROM users u
                     LEFT JOIN user_profile up ON up.user_id = u.id
                     LEFT JOIN user_social_info sci ON sci.user_id = u.id AND sci.site_id = ${socialSites.fb}
                     LEFT JOIN user_payment_info upi ON upi.user_id = u.id
                     LEFT JOIN user_portfolio upo ON upo.user_id = u.id
                     LEFT JOIN (
                               SELECT GROUP_CONCAT(CONCAT_WS('>==<',ss.sys_name,us.value) SEPARATOR ">===<") as skills,us.user_id  
                               FROM user_skills us 
                               JOIN sys_skills ss ON ss.id = us.skill_id
                               WHERE us.user_id = :uid
                              ) us ON us.user_id = u.id
                     WHERE u.id=:uid
                     GROUP BY u.id`;

         me.app.mysqldb.query(sql, { "uid": userId })
            .then(response => {

               if (response.length > 0) {
                  var userRow = response[0];

                  /** Parsing user skills **/
                  var parsedUserSkills = {};
                  var userSkills = (userRow.skills || '').split(">===<").filter(value => value);
                  _.each(userSkills, function (row) {
                     var splittedRow = row.split(">==<");
                     if (!parsedUserSkills.hasOwnProperty(splittedRow[0])) {
                        parsedUserSkills[splittedRow[0]] = [];
                     }
                     parsedUserSkills[splittedRow[0]].push(splittedRow[1]);
                  });

                  var data = {
                     "general_info": {
                        "first_name": userRow.first_name,
                        "last_name": userRow.last_name,
                        "location": userRow.location,
                        "tagline": userRow.tagline,
                        "about_me": userRow.about,
                        "social_site_image": userRow.social_profile_pic,
                        "member_since": userRow.created_at,
                        "is_fixer": userRow.is_fixer,
                        "profile_image": me.app.helper.serverUrl({
                           partialUrl: userRow.profile_pic
                        }),
                        "cover_image": me.app.helper.serverUrl({
                           partialUrl: userRow.cover_pic
                        })

                     },
                     "privateInfo": {
                        "email": userRow.email,
                        "birth_date": userRow.birth_date,
                        "contact": userRow.mobile_number
                     },
                     "badges": [
                        { "name": "payment", "value": userRow.bank_token ? "1" : "0" },
                        { "name": "mobile", "value": (userRow.mobile_number && userRow.is_mobile_verified) ? "1" : "0" },
                        { "name": "facebook", "value": userRow.fbToken ? "1" : "0" },
                        { "name": "email", "value": userRow.email ? "1" : "0" }
                     ],
                     "portfolio": ((userRow.portfolio || '').split('>===<').filter(value => value)).map((value) => {
                        var portifolioDetails = value.split(">==<");
                        return {
                           portfolio_id: portifolioDetails[1],
                           portfolio_image: me.app.helper.serverUrl({
                              partialUrl: portifolioDetails[0]
                           }),
                        };
                     }),
                     "skill": {
                        "transportation": parsedUserSkills.transportation || [],
                        "languages": parsedUserSkills.languages || [],
                        "education": parsedUserSkills.education || [],
                        "work": parsedUserSkills.work || [],
                        "specialities": parsedUserSkills.speciality || []
                     },
                     "metadata": {
                        "last_online": (userRow.last_online) ? Date.parse(userRow.last_online) : ""
                     }
                  };
                  q.resolve({ "message": "Data Successfully fetched", "data": data });
               }
               else {
                  console.log("E3 ===>", error); //debug
                  q.reject({ status: "400", message: 'Failed fetch' });
               }
            }).catch((error) => {
               console.log("E2 ===>", error); //debug
               q.reject({ status: "500", message:'Internal server error' });
            });
      }
      catch (error) {
         console.log("E1 ===>", error); //debug
         q.reject({ status: "500", message:'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to get user check info before posting job
    * @param {int} userId id of the user
    **/
   getCheckInfo(userId) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `SELECT u.*,up.birth_date,up.mobile_number,up.profile_pic,up.is_mobile_verified,
                     upi.card_token,upi.bank_token,uwp.*
                    FROM users u
                    LEFT JOIN user_profile up ON up.user_id = u.id
                    LEFT JOIN user_payment_info upi  ON upi.user_id = u.id
                    LEFT JOIN user_worker_profile uwp ON uwp.user_id = u.id
                    WHERE u.id=:uid `;

         me.app.mysqldb.query(sql, { "uid": userId })
            .then(response => {
               var data = {
                  "profile_pic": {
                     "available": false,
                     "data": {}
                  },
                  "date_of_birth": {
                     "available": false,
                     "data": {}
                  },
                  "billing_address": {
                     "available": false,
                     "data": {}
                  },
                  "mobile_number": {
                     "available": false,
                     "data": {}
                  },
                  "bank_details": {
                     "available": false,
                     "data": {}
                  },
                  "card_info": {
                     "available": false,
                     "data": {}
                  },
                  "servicfee": siteConsts.serviceTax
               };

               if (response.length > 0) {
                  var userRow = response[0];
                  // mobile number
                  if (userRow.mobile_number && userRow.is_mobile_verified == 1) {
                     var mobileNumberData = {
                        available: true,
                        data: {
                           "mobile_number": userRow.mobile_number
                        }
                     };
                     data.mobile_number = mobileNumberData;
                  }

                  // birth_date
                  if (userRow.birth_date) {
                     var dateOfBirthData = {
                        available: true,
                        data: {
                           "date_of_birth": userRow.birth_date
                        }
                     };
                     data.date_of_birth = dateOfBirthData;
                  }
                  //profile pic
                  if (userRow.profile_pic) {
                     var profilePicData = {
                        available: true,
                        data: {
                           "pic": me.app.helper.serverUrl({
                              partialUrl: userRow.poster_pic
                           })
                        }
                     };
                     data.profile_pic = profilePicData;
                  }

                  //billing address
                  if (userRow.state) {
                     var billingAddressInfo = {
                        available: true,
                        "data": {
                           "street_address": userRow.address,
                           "city": userRow.city,
                           "state": userRow.state,
                           "zipcode": userRow.zipcode
                        }
                     };
                     data.billing_address = billingAddressInfo;
                  }

                  //bank details 
                  if (userRow.bank_token) {
                     var decodedBankInfo = JSON.parse(Buffer.from(userRow.bank_token, 'base64').toString()); //STATIC //--TODO
                     var bankDetailsInfo = {
                        available: true,
                        "data": {
                           "account_name": decodedBankInfo.account_name,
                           "bank_name": decodedBankInfo.bank_name,
                           "account_number": decodedBankInfo.account_number.toString().slice(-4),
                           "routing_number": decodedBankInfo.routing_number,
                           "is_default_method": decodedBankInfo.is_default_method,
                           "personal_id_last4": decodedBankInfo.personal_id_number
                        }
                     };
                     data.bank_details = bankDetailsInfo;
                  }

                  //card details
                  if (userRow.card_token) {
                     var decodedCardInfo = JSON.parse(Buffer.from(userRow.card_token, 'base64').toString()); //STATIC //--TODO
                     var cardDetailsInfo = {
                        available: true,
                        "data": {
                           "card_number": decodedCardInfo.card_number.toString().slice(-4),
                           "exp_month": decodedCardInfo.exp_month,
                           "exp_year": decodedCardInfo.exp_year,
                           "card_name": decodedCardInfo.card_name,
                           "brand": "Visa", //STATIC
                        }
                     };
                     data.card_info = cardDetailsInfo;
                  }

                  q.resolve({ status: "SUCCESS", "message": "Data Successfully fetched", "data": data });
               }
               else {
                  q.reject({ status: "400", message: "Error fetching info" });
               }

            }).catch((error) => {
               console.log(error);
               q.reject({ status: "500", message:'Internal server error'  });
            });
      }
      catch (error) {
         console.log(error);
         q.reject({ status: "500", message:'Internal server error' });
      }
      return q.promise;
   }


   /**
    * Function to get dashboard 
     * @param {int} userId id of the user 
    **/
   getDashboard(userId) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `
                    # Worker profile 
                    SELECT COUNT(IF(jo.is_assigned='1',1, NULL)) as assigned,
                    COUNT(IF(jo.offered_by=:uid,1, NULL)) as bid_on, 
                    COUNT(IF(j.task_activity_status='3',1, NULL)) as completed ,
                    COUNT(if(j.task_end_day>NOW(),1,NULL)) as overdue FROM job_offers jo
                    LEFT JOIN jobs j ON j.task_id =jo.task_id 
                    RIGHT JOIN users u ON jo.offered_by = u.id AND u.id = :uid  
                    GROUP BY jo.offered_by;

                    #poster profile
                    SELECT COUNT(IF(jo.is_assigned='1',1,NULL)) as assigned, COUNT(IF(j.task_activity_status=1,1,NULL)) as openforoffer,
                    COUNT(IF(j.task_activity_status='3',1,NULL)) as completed ,COUNT(IF(j.task_end_day>NOW(),1,NULL)) as overdue
                    FROM job_offers jo 
                    RIGHT JOIN jobs j ON j.task_id =jo.task_id 
                    RIGHT JOIN users u ON j.user_id = u.id AND u.id = :uid  
                    GROUP BY j.user_id;
                    `;
         var notificationData = {};

         me.app.mysqldb.query(sql, { "uid": userId })
            .then(multiResponse => {

               var profileAsWorker = multiResponse[0][0];
               var profileAsPoster = multiResponse[1][0];
               notificationData = {
                  "workerProfile": {
                     "bidon": profileAsWorker.bid_on,
                     "assigned": profileAsWorker.assigned,
                     "overdue": profileAsWorker.overdue,
                     "awaitingpayments": 0,
                     "completed": profileAsWorker.completed,
                     "completionrate": (profileAsWorker.assigned > 0) ? (profileAsWorker.completed / profileAsWorker.assigned) : 0
                  },
                  "poster": {
                     "openforoffer": profileAsPoster.openforoffer,
                     "assigned": profileAsPoster.assigned,
                     "overdue": profileAsPoster.overdue,
                     "awaitingpayments": 0,
                     "compelted": profileAsPoster.completed,
                     "completionrate": (profileAsPoster.assigned > 0) ? (profileAsPoster.completed / profileAsPoster.assigned) : 0
                  },
                  "reviews": 0,
                  "notifications": {
                     "data": []
                  }
               };
               var objNotificationModel = new notificationModel(me.app);
               return objNotificationModel.getUserNotifications(userId, 5, 1); // showing top 5 notifications
            }).then(response => {
               notificationData.notifications.data = response.data.notifications;
               q.resolve({ status: "SUCCESS", "message": "Data Successfully fetched", "data": notificationData });
            }).catch((error) => {
               q.reject({ status: "ERROR", message:'Internal server error' });
            });
      }
      catch (error) {
         q.reject({ status: "ERROR", message:'Internal server error' });
      }
      return q.promise;
   }

   /**
     * Function to get user transactions
     * @param {int} userId id of the user
     * @param {object} transactionFilters 
     * @param {pp} pp  per page
     * @param {pg} pg number
     **/
   getTransactions(userId, transactionFilters, pp, pg) {
      /**
       *1=current quarter, 2=>last quarter, 3=>current finance year, 4=> last finance year
       * IN US financial year is from oct-oct
       * **/

      var rowCount = pp;
      var offset = (pg - 1) * pp;
      var q = Q.defer();
      var transactionType = transactionFilters.transactionType || 1;
      var type = transactionFilters.type || 1;

      var where = null;
      var currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
      var currentYear = new Date().getFullYear();
      var currentFinancialYear = (new Date().getMonth() < 9) ? (currentYear - 1) : currentYear;


      // set time interval accoriding to transactionType
      switch (type) {
         case 1:
            where = `QUARTER(transaction_date_time) = ${currentQuarter} AND YEAR(transaction_date_time) = ${currentYear}`;
            break;
         case 2:
            where = `QUARTER(transaction_date_time) = ${currentQuarter - 1} AND YEAR(transaction_date_time) = ${currentYear}`;
            break;
         case 3:
            where = `(MONTH(transaction_date_time)>= 10 AND YEAR(transaction_date_time) = ${currentFinancialYear}) OR (YEAR(transaction_date_time)= ${currentFinancialYear + 1} AND MONTH(transaction_date_time)< 10 ) `;
            break;
         case 4:
            where = `(MONTH(transaction_date_time)>= 10 AND YEAR(transaction_date_time) = ${currentFinancialYear - 1}) OR (YEAR(transaction_date_time)= ${currentFinancialYear} AND MONTH(transaction_date_time)< 10 ) `;
            break;
      }


      var sql = `SELECT ut.*,j.task_name 
                 FROM user_transactions ut 
                 JOIN jobs j ON ut.task_id = j.task_id
                 WHERE flow = :fl AND ut.user_id = :ui AND ${where}`;

      let limitClause = " LIMIT " + offset + "," + rowCount + ";";

      var sql2 = `SELECT count(*) as records_count  
                  FROM user_transactions ut 
                  WHERE flow = :fl AND user_id = :ui AND ${where}`;

      let normalQuery = sql + limitClause;
      let countQuery = sql2;
      const finalSql = normalQuery + countQuery;

      this.app.mysqldb.query(finalSql, { ui: userId, fl: transactionType }).then(function (multiRowset) {

         var data = [];
         _.each(multiRowset[0], function (row) {
            data.push({
               "current_user_id": userId,
               "task_id": row.task_id,
               "task_name": row.task_name,
               "amount": row.pay_amount,
               "transaction_timestamp": Date.parse(row.transaction_date_time)
            });
         });

         var metaInfo = {
            "total": multiRowset[1][0].records_count,
            "pg": pg,
            "pp": rowCount,
            "totalInPage": multiRowset[0].length
         };
         var returnSet = {
            transactions: data,
            meta: metaInfo
         };

         var message = _.isEmpty(data) ? "Currently there are no transaactions." : "Fetched  transactions successfully.";
         q.resolve({ status: "SUCCESS", message: message, data: returnSet });
      }).catch(function (error) {
         console.log(error);
         q.reject({ status: "ERROR", message: 'Internal Server Error' });
      });
      return q.promise;
   }

   /**
    * Function to update user check info  
    * @param {int} userId id of the user
    * @param {sting} fieldType field type for which value is to be added
    * @param {sting} value value which is to be updated
    **/
   updatecheckinfo(userId, fieldType, value) {
      var sql = {};
      var updateParams = {};
      var messageField = '';
      var q = Q.defer();
      try {
         switch (fieldType) {
            case 'dob':
               sql = 'UPDATE user_profile SET birth_date = :bd WHERE user_id = :ui';
               updateParams.bd = value;
               updateParams.ui = userId;
               messageField = 'Date of birth';
               break;
            case 'billing_address':
               sql = `INSERT INTO user_worker_profile SET address = :ad,city=:ci,state=:st,zip=:zi,user_id = :ui
                       ON DUPLICATE KEY UPDATE address = :ad,city=:ci,state=:st,zip=:zi`;
               var billingInfo = JSON.parse(value);
               updateParams.ad = billingInfo.street_address;
               updateParams.ci = billingInfo.city;
               updateParams.st = billingInfo.state;
               updateParams.zi = billingInfo.zipcode;
               updateParams.ui = userId;
               messageField = 'Billing address';
               break;
         }
         this.app.mysqldb.query(sql, updateParams).then(response => {
            q.resolve({ status: "SUCCESS", "message": `${messageField} successfully updated` });
         }).catch(error => {
            q.reject({ status: "400", message: 'Internal server error' });
         });
      } catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }
}

module.exports = UsersAccountModel;


