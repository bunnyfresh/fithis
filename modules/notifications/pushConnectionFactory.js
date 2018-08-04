"use strict";

var adapters = require("./connectors");


class PushConnectionFactory {
   constructor(app) {
      this.app = app;
      this.deviceTypeToAdapterMap = {
         "1": 'Apns',
         "2": 'Gcm'
      };
   }
   /**
    * @param  {} options
    */
   getNotificationConnector(options) {
      var notificationConnector = this.deviceTypeToAdapterMap[options.device_type];
      return new adapters[notificationConnector]();
   }
}

module.exports = PushConnectionFactory;