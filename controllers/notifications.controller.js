"use strict";
const notificationsModel = require('../models/notifications.model');

class NotificationsController {
   constructor(app) {
      this.app = app;
   }

   /**
    * get notifications
    **/
   getNotificationsList(req, res, next) {
      var userId = req.token.user_id;
      var pp = (!isNaN(req.query.pp) && req.query.pp > 0) ? req.query.pp : 10;
      var pg = (!isNaN(req.query.pg) && req.query.pg >= 1) ? req.query.pg : 1;
      var notificationsModelObj = new notificationsModel(this);
      notificationsModelObj.getUserNotifications(userId, pp, pg).then((response) => {
         this.helper.sendSuccessResponse(res, response, {});
      }).catch((error) => {
         this.helper.sendFailureResponse(res, error, {});
      });
   }


}
module.exports = NotificationsController;