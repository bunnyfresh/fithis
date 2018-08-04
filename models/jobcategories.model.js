"use strict";
var Q = require('q');
var _ = require('lodash');
var uniqid = require('uniqid');
var shortid = require('shortid');
const baseModel = require("./base.model");

class JobCategories extends baseModel {

   /**
    * Function to get job categories
      * @param {number} pp records per page
     * @param {number} pg page number
     * @param {object} filter filetdata
    * **/
   getPaginatedCategoryListing(pp, pg, filters) {
      var q = Q.defer();
      var rowCount = pp;
      var offset = (pg - 1) * pp;

      try {
         var me = this;
         var whereCondition = '';
         if (filters.search_key) {
            whereCondition = `WHERE category_name LIKE ${me.escape('%' + filters.search_key + '%')}`;
         }

         var sql = `SELECT *,'e.g Clean my 2 bedroom apartment' as placeholder 
                    FROM job_categories 
                    ${whereCondition}
                    ORDER BY crd desc
                    LIMIT ${offset},${rowCount};
                   
                    # Get count 
                    SELECT count(*) as records_count FROM job_categories ${whereCondition}
                    `;

         this.app.mysqldb.query(sql, {}).then(function (multiRowset) {

            var categoriesList = [];
            _.each(multiRowset[0], function (categoryRow) {
               var categoryInfoRow = {
                  category_id: categoryRow.category_id,
                  category_name: categoryRow.category_name,
                  category_description: categoryRow.description,
                  is_online: categoryRow.is_online,
                  placeholder: categoryRow.placeholder,
               };

               categoriesList.push(categoryInfoRow);
            });

            var metaInfo = {
               "total": (multiRowset[1].length > 0) ? multiRowset[1][0].records_count : 0,
               "pg": pg,
               "pp": rowCount,
               "totalInPage": multiRowset[0].length
            };
            var returnSet = {
               categories: categoriesList,
               meta: metaInfo
            };

            var message = _.isEmpty(categoriesList) ? "No category available" : "Fetched Categories sucessfully.";
            q.resolve({ status: "SUCCESS", message: message, data: returnSet });

         }).catch(function (error) {
            //debug
            console.log(error);
            q.reject({ status: "ERROR", message: 'Internal Server Error' });
         });
      }
      catch (error) {
         //debug
         console.log(error);
         q.reject({ status: "ERROR", message: 'Internal Server Error' });
      }
      return q.promise;
   }

   /** Function to add category
   * @param {object} categoryInfo containing info for category
   * @param {object} categoryImage category image
   **/
   addJobCategory(categoryInfo, categoryImage) {
      var q = Q.defer();
      try {
         var uploadFileObj = {
            "destination": 'uploads/job_categories/',
            "tempFile": categoryImage.path,
            "uploadedFileName": categoryImage.name,
            "nameOnFileSystem": uniqid.time(),
         };
         var columns = [];
         var params = {};
         _.each(categoryInfo, function (value, field) {
            columns.push(`${field} = :${field}`);
            params[field] = value;
         });

         columns.push('category_sys_name =:category_sys_name');
         params['category_sys_name'] = shortid.generate();

         this.app.helper.uploadFile(uploadFileObj).then(response => {

            columns.push('category_image =:category_image');
            params['category_image'] = response.uploadedFile;

            var sql = `INSERT INTO job_categories SET ${columns.join(",")}`;
            return this.app.mysqldb.query(sql, params);
         }).then(response => {
            if (response.insertId > 0) {
               q.resolve({ status: "SUCCESS", "message": "Category successfully added" });
            }
            else {
               q.reject({ status: "400", "message": "Error adding category" });
            }
         }).catch((error) => {
            console.log(error);
            q.reject({ status: "500", "message": "Internal Server Error" });
         });
      }
      catch (error) {
         console.log(error);
         q.reject({ status: "500", "message": "Internal Server Error" });
      }
      return q.promise;
   }


   /** Function to edit category
   * @param {object} categoryInfo containing info for category
   * @param {object} categoryImage category image
   **/
   editJobCategory(categoryInfo, categoryImage) {
      var q = Q.defer();
      try {

         // upload image if file is uploaded
         var conditionalPromise = new Q(true);
         if (categoryImage) {
            var uploadFileObj = {
               "destination": 'uploads/job_categories/',
               "tempFile": categoryImage.path,
               "uploadedFileName": categoryImage.name,
               "nameOnFileSystem": uniqid.time(),
            };
            conditionalPromise = this.app.helper.uploadFile(uploadFileObj);
         }

         conditionalPromise.then((response) => {
            var columns = [];
            var params = {};
            var category_id = categoryInfo.category_id;
            delete categoryInfo.category_id;

            // if file is uploaded then update its name
            if (response.uploadedFile) {
               columns.push('category_image =:category_image');
               params['category_image'] = response.uploadedFile;
            }

            _.each(categoryInfo, function (value, field) {
               if (value) {
                  columns.push(`${field} = :${field}`);
                  params[field] = value;
               }
            });
            var sql = `UPDATE job_categories SET ${columns.join(",")} WHERE category_id = :cid`;
            params['cid'] = category_id;
            if (columns.length > 0) {
               return this.app.mysqldb.query(sql, params);
            }
            else {
               q.reject({ status: "400", message: "No data for update" });
            }
         }).then(() => {
            q.resolve({ status: "SUCCESS", "message": "Category updated successfully" });
         }).catch(error => {
            q.reject({ status: "500", message: "Internal Server Error" });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: "Internal Server Error" });
      }
      return q.promise;
   }

}

module.exports = JobCategories;


