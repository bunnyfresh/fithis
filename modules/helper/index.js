"use strict";
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var Q = require('q');
const { URL } = require('url');
const gTranslator = require('@google-cloud/translate');


class helper {
   constructor(app) {
      this.app = app;
   }

   /**
    * Function to prepare body from template 
    **/
   prepareBodyFromTemplate(template, replacements) {
      var patternString = '';
      var matchedPatternKeyMap = {};
      patternString = new RegExp(_.map(_.keys(replacements), function (key) {
         matchedPatternKeyMap[`\{${key}\}`] = key;
         return `\{${key}\}`;
      }).join("|"), "gi");
      var preparedBody = _.replace(template, patternString, function (match) {
         return replacements[matchedPatternKeyMap[match]];
      });
      return preparedBody;
   }

   /**
    * Remove File 
    **/
   removeFileFromSystem(path) {
      fs.unlink(path, function () { });
   }


   /**
    * upload file 
    **/
   uploadFile(obj) {
      var qPromise = Q.defer();
      /** 
       * If no file found the return resolved promise
       * **/
      if (!obj.uploadedFileName) {
         qPromise.resolve({ message: "No file found" });
         return qPromise.promise;
      }
      var extension = path.extname(obj.uploadedFileName);
      var fileNameToSave = (obj.nameOnFileSystem) ? obj.nameOnFileSystem + extension : obj.uploadedFileName;
      var uploadFilePath = obj.destination + fileNameToSave;
      fs.exists(uploadFilePath, (exists) => {
         if (exists) {
            fileNameToSave = path.basename(fileNameToSave, extension) + '_' + Math.floor(new Date() / 1000) + extension;
            uploadFilePath = obj.destination + fileNameToSave;
         }
         fs.rename(obj.tempFile, uploadFilePath, function (error) {
            if (error) {
               qPromise.reject(error);
            }
            fs.unlink(obj.tempFile, function () { });
            qPromise.resolve({ uploadedFile: fileNameToSave });
         });
      });
      return qPromise.promise;
   }

   // function replaces null with quotes and translates as required
   _gTranslateAndSanitize(response, keys) {

      /**
       * var keysToTranslate = { "data.jobs": { "type": "multi", keys: ['task_name', 'task_description'] }, 'message': { type: 'single' } };
      * **/

      var locale = this.app.locale;
      var qPromise = Q.defer();

      // replace null with double quotes
      var stringifiedResponse = JSON.stringify(response, function (key, value) {
         // if value is null, return "" as a replacement
         if (value === null) {
            return "";
         }
         // otherwise, leave the value unchanged
         return value;
      });

      /** Perform transation **/
      if (locale !== 'en' && keys) {
         // perform translation for languages other then english
         console.log("translation is to be performed", locale);
         const translate = new gTranslator({
            projectId: process.env.GT_PROJECTID,
         });

         /** Values to transalte using given keys **/
         var textToTranslate = [];
         _.each(keys, function (details, path) {
            if (details.type == 'multi') {
               var pickedObject = _.flatMap(_.map(_.get(response, path), value => _.flatMap(_.pick(value, details.keys))));
               textToTranslate = textToTranslate.concat(pickedObject);
            }
            if (details.type == 'single') {
               textToTranslate.push(response[path]);
            }
         });

         textToTranslate = _.uniq(textToTranslate);

         // // Translates some text
         translate.translate(textToTranslate, locale).then(results => {
            var matchedPatternKeyMap = {};
            var patternString = new RegExp(_.map(textToTranslate, function (text, key) {
               matchedPatternKeyMap[text] = key;
               return text;
            }).join("|"), "gi");
            var preparedBody = _.replace(stringifiedResponse, patternString,
               function (match) {
                  return results[0][matchedPatternKeyMap[match]];
               });
            qPromise.resolve(JSON.parse(preparedBody));
         }).catch(err => {
            qPromise.resolve(JSON.parse(stringifiedResponse));
         });
      }
      else {
         qPromise.resolve(JSON.parse(stringifiedResponse));
      }
      return qPromise.promise;
   }


   /** Prepare response for success **/
   sendSuccessResponse(res, response, keysToTranslate) {
    //   res.status(403);
    //   response.status = '403';
      response.status = '200';
      try {
         this._gTranslateAndSanitize(response, keysToTranslate).then(translatedResponse => {
            res.send(translatedResponse);
            return;
         }).catch(unTranslatedResponse => {
            res.send(unTranslatedResponse);
            return;
         });
      }
      catch (error) {
         res.send(error);
         return;
      }

      /** -- UNCOMMENT THIS CODE TILL TRANSALTION CODE IS STABLE ----------  **/
      // replace null with quotes 
      // var stringifiedResponse = JSON.stringify(response, function (key, value) {
      //    // if value is null, return "" as a replacement
      //    if (value === null) {
      //       return "";
      //    }

      //    // otherwise, leave the value unchanged
      //    return value;
      // });
      // return JSON.parse(stringifiedResponse);
      /**---------------------------------------------------------------**/
   }


   /** Prepare response for failure **/
   sendFailureResponse(res, response) {
      res.status(500);
      response.status = '500';
      try {
         this._gTranslateAndSanitize(response, {}).then(translatedResponse => {
            res.send(translatedResponse);
            return;
         }).catch(unTranslatedResponse => {
            res.send(unTranslatedResponse);
            return;
         });
      }
      catch (error) {
         res.send(error);
         return;
      }
   }
  /**  Response for Not Found  **/
  sendNotFoundResponse(res, response) {
    res.status(404);
    response.status = '404';
    try {
       this._gTranslateAndSanitize(response, {}).then(translatedResponse => {
          res.send(translatedResponse);
          return;
       }).catch(unTranslatedResponse => {
          res.send(unTranslatedResponse);
          return;
       });
    }
    catch (error) {
       res.send(error);
       return;
    }
  }
  sendBadResponse(res, response) {
    res.status(400);
    response.status = '400';
    try {
       this._gTranslateAndSanitize(response, {}).then(translatedResponse => {
          res.send(translatedResponse);
          return;
       }).catch(unTranslatedResponse => {
          res.send(unTranslatedResponse);
          return;
       });
    }
    catch (error) {
       res.send(error);
       return;
    }
  }
   

   

   /**
  * @description 
  * @param {any} obj 
  * @returns 
  * @memberof helper
  */
   serverUrl(obj) {
      if (_.isEmpty(obj.partialUrl)) {
         return '';
      }
      const partialUrl = obj.partialUrl;
      const serverUrl = new URL(process.env.APP_SERVER_URL).origin;
      return new URL(serverUrl + (obj.destination || '/') + partialUrl).toString();
   }
}

module.exports = helper;