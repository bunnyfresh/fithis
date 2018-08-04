"use strict";
var Q = require('q');
var _ = require('lodash');
const baseModel = require("./base.model");
const userSkills = require("../consts/userSkills");

class UserSkillsModel extends baseModel {

   constructor(app) {
      super(app);
      this.skillTypeIdMap = userSkills;
   }

   /**
   * Function to list skill 
   * @param {number} userId id of the user
   * @param {string} skillType type of skill to be filtered
   * **/
   getUserSkills(userId, skillType) {
      var q = Q.defer();
      try {
         var sql = `SELECT ss.sys_name ,GROUP_CONCAT(us.value SEPARATOR '>===<' ) as skills
                    FROM user_skills us RIGHT JOIN sys_skills ss ON us.skill_id = ss.id  
                    AND us.user_id = :uid `;
         if (skillType != null) {
            sql = sql + ' AND ss.sys_name = ' + this.app.mysqldb.db.escape(skillType);
         }
         sql = `${sql} GROUP BY ss.sys_name`;

         this.app.mysqldb.query(sql, { uid: userId }).then(function (response) {
            if (response.length > 0) {
               var returnData = {};
               _.each(response, function (row) {
                  returnData[row.sys_name] = (row.skills) ? row.skills.split('>===<') : [];
               });
               //incorrect insertion
               q.resolve({ status: "SUCCESS", message: 'Data successfully fetched', data: returnData });
            }
            else {
               //incorrect insertion
               q.reject({ status: "400", message: 'Error fetching data' });
            }
         }).catch(function (error) {
            console.log(error);
            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {
         console.log(error);
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to add user skill 
     * @param {number} userId id of user
     * @param {string} skillType skill type to be added
     * @param {number} value value of skill to be added
    * */
   addUserSkill(userId, skillType, value) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `INSERT INTO user_skills(user_id,skill_id,value)
                      VALUES (:uId,:sId,:va);`;
         var insertParams = {
            uId: userId,
            sId: me.skillTypeIdMap[skillType],
            va: value,
         };
         this.app.mysqldb.query(sql, insertParams).then(function (response) {
            var insertionResponse = response;
            if (insertionResponse.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: 'Skill successfully added' });
            }
            else {
               //incorrect insertion
               q.reject({ status: "400", message: 'Error adding skill' });
            }
         }).catch(function (error) {
            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }

   /**
    * Function to add user skill 
     * @param {number} userId id of user
     * @param {string} skillType skill type to be added
     * @param {number} value value of skill to be added
    * */
   deleteUserSkill(userId, skillType, value) {
      var q = Q.defer();
      var me = this;
      try {
         var sql = `DELETE FROM user_skills WHERE user_id = :uId AND skill_id=:sId AND value=:va`;
         var insertParams = {
            uId: userId,
            sId: me.skillTypeIdMap[skillType],
            va: value,
         };
         this.app.mysqldb.query(sql, insertParams).then(function (response) {
            if (response.affectedRows > 0) {
               q.resolve({ status: "SUCCESS", message: 'Skill successfully deleted' });
            }
            else {
               //incorrect insertion
               q.reject({ status: "400", message: 'Error deleting skill' });
            }
         }).catch(function (error) {
            q.reject({ status: "500", message: 'Internal server error' });
         });
      }
      catch (error) {
         q.reject({ status: "500", message: 'Internal server error' });
      }
      return q.promise;
   }
}

module.exports = UserSkillsModel;


