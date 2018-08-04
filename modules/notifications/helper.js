"use strict";
var _ = require('lodash');

class NotificationHelper {
   /**
    * @param  {} template
    * @param  {} bodyData
    */
   prepareNotificationBody(template, bodyData) {
      var patternString = '';
      var parseBodyData = JSON.parse(bodyData);
      var matchedPatternKeyMap = {};
      patternString = new RegExp(_.map(_.keys(parseBodyData), function (key) {
         matchedPatternKeyMap[`\{${key}\}`] = key;
         return `\{${key}\}`;
      }).join("|"), "gi");
      var preparedBody = _.replace(template, patternString, function (match) {
         return parseBodyData[matchedPatternKeyMap[match]];
      });
      return preparedBody;
   }
}

module.exports = NotificationHelper;