"use strict";
const userDeviceModel = require('../models/usersdevices.model');
const gTranslator = require('@google-cloud/translate');
const stripe = require("stripe")(
   process.env.STRIPE_SECRET_KEY
);

const _ = require('lodash');
class testController {
   constructor(app) {
      this.app = app;
   }

   _stripeCreateAccount() {
      return new Promise(function (resolve, reject) {
         stripe.accounts.create({
            type: 'custom',
            country: 'US',
            email: 'bob@example.com'
         }, function (err, account) {
            if (err) {
               console.log(err);
               reject(err);
            }
            else {
               resolve(account);
            }
         });
      });
   }

   
   _stripeAddBankToAccount() {
      return new Promise(function (resolve, reject) {
         stripe.accounts.createExternalAccount(
            "acct_1032D82eZvKYlo2C",
            { external_account: "btok_1CL78G2eZvKYlo2CUZHz6Ows" },
            function (err, bank_account) {
               if (err) {
                  console.log(err);
                  reject(err);
               }
               else {
                  resolve(bank_account);
               }
            }
         );
      }
      );
   }



   _stripeCreateCustomer(userEmail, cardToken) {

      /**
       * "Customer ID" === > cus_Ckbm1uNG7R7RPU
       * **/

      return new Promise(function (resolve, reject) {
         stripe.customers.create({
            description: `Customer for ${userEmail}`,
            source: cardToken // obtained with Stripe.js
         }, function (err, account) {
            if (err) {
               console.log(err);
               reject(err);
            }
            else {
               resolve(account);
            }
         });
      });
   }

   _stripeDeleteCard() {
      return new Promise(function (resolve, reject) {
         stripe.customers.deleteCard(
            "cus_CkbJIjNhuSVcZm",
            "card_1CL6892eZvKYlo2Cp9uh1hYp", function (err, account) {
               if (err) {
                  console.log(err);
                  reject(err);
               }
               else {
                  resolve(account);
               }
            });
      });
   }



   _stripeAttachCardToCustomer() {
      var me = this;
      return new Promise(function (resolve, reject) {
         new testController(me.app)._stripeCardToken().then(response => {
            var cardToken = response.id;
            stripe.customers.createSource(
               "cus_Ckbm1uNG7R7RPU",
               { source: cardToken },
               function (err, source) {
                  if (err) {
                     reject(err);
                  }
                  else {
                     resolve(source);
                  }
                  // asynchronously called
               }
            );
         }).catch(error => {
            reject(error);
         });
      });
   }


   _stripeCardToken() {
      // get token.id and token.bank_account.id
      return new Promise(function (resolve, reject) {
         stripe.tokens.create({
            card: {
               "number": '4242424242424242',
               "exp_month": 12,
               "exp_year": 2019,
               "cvc": '123'
            }
         }, function (err, account) {
            if (err) {
               reject(err);
            }
            else {
               resolve(account);
            }
         });
      });
   }

   _stripeCreateBankToken() {
      // get token.id and token.bank_account.id
      return new Promise(function (resolve, reject) {
         stripe.tokens.create({
            bank_account: {
               country: 'US',
               currency: 'usd',
               account_holder_name: 'Noah Smith',
               account_holder_type: 'individual',
               routing_number: '110000000',
               account_number: '000123456789'
            }
         }, function (err, account) {
            if (err) {
               reject(err);
            }
            else {
               resolve(account);
            }
         });
      });
   }



   /**
    * Handler to test stripe 
    **/
   testStripe(req, res, next) {
      var me = this;
      try {
         var objTestController = new testController(me.app);
         objTestController._stripeCardToken().then(response => {
            return objTestController._stripeAttachCardToCustomer();
         }).then(response => {
            me.helper.sendSuccessResponse(res, response, {});
         }).catch(error => {
            console.log(error);
            me.helper.sendFailureResponse(res, error);
         });
      }
      catch (error) {
         console.log(error);
         me.helper.sendFailureResponse(res, error);
      }
   }

   /**
    * Handler to test notifications
    **/
   testNotifications(req, res, next) {
      var objUserDeviceModel = new userDeviceModel(this);
      var toUser = req.body.to_user;
      var message = req.body.to_user;
      var me = this;
      // code to send notification
      objUserDeviceModel.getUserDevices(toUser).then((response) => {
         _.each(response, function (row) {
            var deviceType = row.device_type;
            var deviceTokens = row.device_token.split(',');
            var notificationConnector = me.notifications.connectionFactory.getNotificationConnector({ device_type: deviceType });
            notificationConnector.sendPush(message, {}, deviceTokens).then(response => {
               console.log(notificationConnector);
               me.helper.sendSuccessResponse(res, response, {});
            }).catch(error => {
               me.helper.sendFailureResponse(res, error);
            });
         });
      }).catch((error) => {
         console.log(error);
         me.helper.sendFailureResponse(res, error);
      });
   }

   /**
    * Handler to test translation
    **/
   testTransalation(req, res, next) {
      var me = this;
      const translate = new gTranslator({
         projectId: process.env.GT_PROJECTID,
      });


      var jobResponse = {
         "status": "200",
         "message": "Fetched  data successfully.",
         "data": {
            "jobs": [
               {
                  "task_id": 13,
                  "task_name": "Job to test notification",
                  "task_description": "This is test notification description",
                  "hourly_rate": "",
                  "task_post_date": 1523031050000,
                  "hours": "",
                  "category_name": "Junk Removal",
                  "category_id": 11,
                  "task_price": 100,
                  "done_online": 0,
                  "activity_status": "Complete",
                  "comment_count": 0,
                  "offer_count": 1,
                  "offer_id": "",
                  "userDetails": {
                     "fullname": "",
                     "user_id": 3,
                     "profile_image": ""
                  },
                  "locationDetails": {
                     "distance": "",
                     "location": "Mohali",
                     "longitude": 76,
                     "latitude": 30
                  }
               },
               {
                  "task_id": 6,
                  "task_name": "Job3 User1",
                  "task_description": "This is test notification description",
                  "hourly_rate": "",
                  "task_post_date": 1521845608000,
                  "hours": "",
                  "category_name": "Accounting",
                  "category_id": 12,
                  "task_price": 70,
                  "done_online": 0,
                  "activity_status": "Open",
                  "comment_count": 0,
                  "offer_count": 1,
                  "offer_id": "",
                  "userDetails": {
                     "fullname": "",
                     "user_id": 3,
                     "profile_image": ""
                  },
                  "locationDetails": {
                     "distance": "",
                     "location": "Mohali,india",
                     "longitude": 76.717873,
                     "latitude": 30.704649
                  }
               }
            ],
            "meta": {
               "total": 5,
               "pg": 1,
               "pp": 10,
               "totalInPage": 5
            }
         }
      };

      /** Values to transalte using given keys **/
      var textToTranslate = _.uniq(_.flatMap(jobResponse.data.jobs,
         value => _.flatMap(_.pick(value, ['task_name', 'task_description']))
      ));

      // // Translates some text
      translate
         .translate(textToTranslate, 'es')
         .then(results => {
            var matchedPatternKeyMap = {};
            var patternString = new RegExp(_.map(textToTranslate, function (text, key) {
               matchedPatternKeyMap[text] = key;
               return text;
            }).join("|"), "gi");
            var preparedBody = _.replace(JSON.stringify(jobResponse), patternString,
               function (match) {
                  console.log(match);
                  return results[0][matchedPatternKeyMap[match]];
               });
            me.helper.sendSuccessResponse(res, JSON.parse(preparedBody), {});
         })
         .catch(err => {
            console.error('ERROR:', err);
            me.helper.sendFailureResponse(res, err);
         });
   }

}
module.exports = testController;