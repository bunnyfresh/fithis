"use strict";
var PushConnectonFactory = require('./pushConnectionFactory');
var notificationTypes = require('./notificationType');
var notificationHelper = require('./helper');
class notifications {
   constructor(app) {
      this.app = app;
      this.connectionFactory = new PushConnectonFactory();
      this.helper = new notificationHelper();
      this.notificationTypes = notificationTypes;
   }
}
module.exports = notifications;