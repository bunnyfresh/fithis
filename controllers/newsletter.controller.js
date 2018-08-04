"use strict";
var httpClient = require("request");
require('request-to-curl');
class NewsletterController {
   constructor(app) {
      this.app = app;
   }

   /**
    * Handler to create profile 
    **/
   subscribe(req, res, next) {
      var me = this;
      var email = req.body.email;
      var path = `${process.env.MAILCHIP_BASE_URL}/lists/${process.env.MAILCHIP_LIST_ID}/members`;
      httpClient.post(path,
         {
            form: JSON.stringify({
               "email_address": email,
               "status": 'subscribed'
            }),
            'auth': {
               'user': 'anystring',
               'pass': process.env.MAILCHIP_API_KEY
            }
         }, function (error, response, body) {
            if (JSON.parse(body).hasOwnProperty('id')) {
               me.helper.sendSuccessResponse(res, { message: 'Email successfully subscribed' }, {});
            }
            else {
               me.helper.sendFailureResponse(res, { message: 'Error subscribing email' });
            }
         }
      );
   }


}
module.exports = NewsletterController;