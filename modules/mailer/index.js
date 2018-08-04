"use strict";
const nodemailer = require('nodemailer');
const Q = require('q');

class mailer {
   constructor(app) {
      this.app = app;
      this.transporter = null;
      this._creareTranspoter();
   }

   _creareTranspoter() {
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
         host: process.env.APP_SMTP_HOST,
         port: 465,
         secure: true,
         auth: {
            user: process.env.APP_SMTP_USER,
            pass: process.env.APP_SMTP_PASS
         }
      });
      this.transporter = transporter;
   }

   /**
    * Function to Send mail 
    * @param {object} obj 
    * **/
   send(obj) {
      var qPromise = Q.defer();
      // setup email data with unicode symbols
      let mailOptions = {
         from: process.env.APP_SMTP_USER,
         to: obj.to,
         subject: obj.subject,
         text: obj.text,
         html: obj.html
      };
      console.log("========");
      console.log(obj.attachments)
      if (obj.attachments) {
         mailOptions.attachments = obj.attachments;
      }
      

      // send mail with defined transport object
      this.transporter.sendMail(mailOptions, (error, info) => {
        console.log("=============");   
        console.log(error);
        console.log(info);  
         if (error) {
            qPromise.reject(error);
         }
         else {
            qPromise.resolve(info);
         }
      });
      return qPromise.promise;
   }


}

module.exports = mailer;