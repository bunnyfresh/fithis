"use strict";
var _ = require('lodash');
var Q = require('q');
const PushNotifications = new require('node-pushnotifications');

class Apns {

   constructor() {
      const settings = {
         apn: {
            cert: './config/apns/apnscert.pem',
            key: './config/apns/key.pem',
            passphrase: 'welcome',
            production: true,
            topic:'myapptopic'
         }
      };
      this.connector = new PushNotifications(settings);
   }

   // notify using push    
   /**
    * @param  {string} notification
    * @param  {string} deviceTokens
    * @param  {object} metadata
    * @param  {string} options
    */
   sendPush(notification,metadata, deviceTokens, options) {
      var qPromise = Q.defer();
      const registrationIds = deviceTokens;
      var badge = (metadata.badge)?metadata.badge:1;
      delete(metadata.badge);
      const data = {
         body: notification,
         custom:{metadata:metadata},
         badge:badge,
         topic:'com.a1distribute.mpcloud'
      };

      console.log('data===>',JSON.stringify(data));
      console.log('metadata===>',JSON.stringify(metadata));

      this.connector.send(registrationIds, data).then((results) => {
         console.log('push notification data===>',JSON.stringify(results));
         qPromise.resolve(results);
      }).catch((err) => {
         console.log('push notification data reject ===>',err);
         qPromise.reject(err);
      });
      return qPromise.promise;
   }

}

module.exports = Apns;