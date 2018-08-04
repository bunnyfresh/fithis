"use strict";

var jwt = require('jsonwebtoken');
let querystring = require('querystring');
var HttpStatus = require('http-status-codes');
var acl = require('acl');

class routeFilter {

   constructor(app) {
      this.app = app;
      this.acl = this.aclRules();
   }

   /**
    * If path matched then return true else false;
    * @param req
    * @param res
    * @param next
    * @returns {boolean}
    * @private
    */
   preRequestHandle(req, res, next) {
      if (req.path() === '/docs') {
         console.log("redirect to correct path")
         return res.redirect(301, '/docs/', next);
      }
      else if (req.path().match('/api-docs')
         || req.path().match(/\/docs\/?.*/)) {
         next();
      }
      else {
         return next();
      }
   }

   notFoundHandler(req, res, error, callback) {
      error.toJSON = function customToJSON() {
         return {
            code_name: "ERROR",
            name: "NotFound",
            message: 'Invalid Request URL/method'
         };
      };
      error.toString = function customToString() {
         return 'Invalid Request URL/method';
      };
      return callback();
   }


   loadUserRoles(acl) {
      var me = this;
      var batch = 1000;
      return new Promise((resolveMain, rejectMain) => {

         // function to fetch user roles
         var fetchUsers = function (pg, pp) {
            console.log("acl: fetchUsersFn");
            return new Promise(function (resolve, reject) {
               var rowCount = !isNaN(pp) && (pp > 0) ? pp : 10;
               var offset = !isNaN(pg) && (pg > 0) ? pg - 1 : 0;
               var sql = 'SELECT u.id as user_id,ut.role as type FROM users u ' +
                  ' JOIN sys_user_types ut on ut.id = u.user_type ' +
                  ' WHERE u.account_status = 1 ' +
                  ' LIMIT ' + offset + ',' + rowCount + ';';
               sql += 'SELECT count(*) as cnt FROM users;';

               me.app.mysqldb.query(sql).then(multiRowset => {
                  var returnSet = {};
                  returnSet.data = multiRowset[0];
                  returnSet.meta = {
                     "total": multiRowset[1][0].cnt
                  };
                  resolve(returnSet);
               }).catch(error => {
                  reject(error);
               });

            });
         };

         var addUsersPromises = [];

         // function to add user roles
         var addUsersToAcl = function (rows) {
            console.log("acl: addUsersToAclFn");
            for (var j = 0; j < rows.length; j++) {
               addUsersPromises.push(acl.addUserRoles(rows[j].user_id, rows[j].type));
            }
            return Promise.all(addUsersPromises);
         };


         // load user roles
         fetchUsers(1, batch).then(function (result) {
            console.log("acl: fetchUsersThen");
            var promises = [];
            var totalUsers = result.meta.total;
            var totalPages = Math.ceil(totalUsers / batch);
            promises.push(addUsersToAcl(result.data));
            for (var i = 2; i <= totalPages; i++) {
               promises.push(fetchUsers(i, batch));
            }
            return Promise.all(promises);
         }).then((results) => {
            console.log("acl: AllfetchUsersThen");
            addUsersPromises = [];
            for (var i = 1; i < results.length; i++) {
               //SKIP 0 index of addUsersToAcl;
               addUsersPromises.push(addUsersToAcl(results[i].data));
            }
            return Promise.all(addUsersPromises);
         }).then(results => {
            console.log("acl: AllAddUsersPromises");
            resolveMain(results);
         }).catch(err => {
            console.error("acl: ERR AllAddUsersPromises", err);
            rejectMain(err);
         });
      });
   }


   tokenMiddleware(numPathComponents, userId, actions) {
      var acl = this.app.route_filter.acl;
      var me = this;
      function HttpError(errorCode, msg) {
         this.errorCode = errorCode;
         this.statusCode = errorCode;
         this.message = msg;
         this.name = this.constructor.name;
         this.code_name = 'INVALID_TOKEN';
         Error.captureStackTrace(this, this.constructor);
         this.constructor.prototype.__proto__ = Error.prototype;
      }
      return function (req, res, next) {
         var _userId = userId,
            _actions = actions,
            resource,
            url;

         // set user id 
         if (!_userId) {
            if (routeFilter._setJwtToken(req)) {
               me.app.locale = req.token.locale; // set locale for app;
               _userId = req.session.userId;
            }
            else {
               next(new HttpError(HttpStatus.UNAUTHORIZED, 'User not authenticated'));
               return;
            }
         }
         // if still cannot find user id from token the return error
         if (!_userId) {
            next(new HttpError(HttpStatus.UNAUTHORIZED, 'User not authenticated'));
            return;
         }
         url = req.originalUrl.split('?')[0];
         if (!numPathComponents) {
            resource = url;
         } else {
            resource = url.split('/').slice(0, numPathComponents + 1).join('/');
         }
         if (!_actions) {
            _actions = req.method.toLowerCase();
         }
         console.log('Requesting ' + _actions + ' on ' + resource + ' by user ' + _userId);
         // check for acl 
         acl.isAllowed(_userId, resource, _actions, function (err, allowed) {
            if (err) {
               next(new Error('Error checking permissions to access resource'));
            } else if (allowed === false) {
               console.log('Not allowed ' + _actions + ' on ' + resource + ' by user ' + _userId);
               next(new HttpError(HttpStatus.FORBIDDEN, 'Insufficient permissions to access resource'));
            } else {
               console.log('Allowed ' + _actions + ' on ' + resource + ' by user ' + _userId);
               next();
            }
         });
      };
   }


   /**
    * Return true if token found
    * @param req
    * @returns {boolean}
    * @private
    */
   static _setJwtToken(req) {
      var hToken = querystring.parse(req.getQuery())._htoken;
      if (hToken != undefined && req.headers.authorization == undefined) {
         req.headers.authorization = 'Bearer ' + hToken;
      }
      if (req.headers.authorization) {
         console.log('AuthHead: ' + req.headers.authorization);
         var authHeader = req.headers.authorization.split(' ');
         if (authHeader.length === 2 && authHeader[0] === 'Bearer') {
            // console.log(authHeader[1]);
            try {
               req.token = jwt.verify(authHeader[1], process.env.JWT_SECRET);
console.log(req.token.user_id);               
               req.session = {
                  userId: req.token.user_id
               };
               req.originalUrl = req.href();
               req.enctoken = authHeader[1];
               return true;
            } catch (e) {
               console.error('Invalid Token: ', e);
            }
         }
      }
      return false;
   }


   aclRules() {
      var aclObj = new acl(new acl.memoryBackend());
      aclObj.addRoleParents('admin', ['appuser']);

      aclObj.allow('appuser', [
         '/api/job/comments',
         '/api/job/details',
         '/api/job/categories',
         '/api/job/list',
         '/api/job/new',
         '/api/job/comment',
         '/api/job/assign',
         '/api/job/complete',
         '/api/job/offers/review',
         '/api/job/offer',
         '/api/job/update',
         '/api/job/feedback',
         '/api/job/uploaddoc',
         '/api/messages/send',
         '/api/messages/inbox',
         '/api/messages/conversation',
         '/api/profile/dashboard',
         '/api/userskills/add',
         '/api/userskills/delete',
         '/api/userskills/list',
         '/api/job/reviewlist',
         '/api/notifications/list',
         '/api/user/createprofile',
         '/api/user/uploadpic',
         '/api/user/uploadcoverpic',
         '/api/profile/addportfolio',
         '/api/profile/removeportfolio',
         '/api/profile/handlegeneralinfo',
         '/api/profile/handleprivateinfo',
         '/api/user/profile',
         '/api/user/changepassword',
         '/api/user/sendotp',
         '/api/user/verifyotp',
         '/api/user/checkinfo',
         '/api/preferences/notification/get',
         '/api/preferences/notification/update',
         '/api/user/onlinestatus',
         '/api/user/getAccountData',
         '/api/job/delete',
         '/api/job/offer/delete',
         '/api/job/offer/details',
         '/api/job/offer/update',
         '/api/user/updatecheckinfo',
         '/api/user/carddetails',
         '/api/user/bankdetails',
         '/api/preferences/taskalert/add',
         '/api/preferences/taskalert/update',
         '/api/preferences/taskalert/delete',
         '/api/taskalerts/list',
         '/api/auth/logout',
         '/api/applanguages',
         '/api/user/setlanguage',
         '/api/report',
         '/api/contactus',
         '/api/user/transactions',
         '/api/user/ratings',
      ], ['post', 'put', 'delete', 'get']);
      aclObj.allow('admin', [
         '/api/admin/users',
         '/api/admin/user/delete',
         '/api/admin/user/status',
         '/api/admin/jobs',
         '/api/admin/categories',
         '/api/admin/category/add',
         '/api/admin/category/edit',
         '/api/admin/job/status',
         '/api/admin/dashboard',
         '/api/admin/job/handle',
         '/api/admin/user/details',
         '/api/admin/user/handle',
         '/api/admin/user/uploadpic',
         '/api/admin/user/uploadcoverpic',
         '/api/admin/user/resetpassword',
      ], ['post', 'put', 'delete', 'get']);
      return aclObj;
   }


}

module.exports = routeFilter;