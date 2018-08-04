"use strict";
var Q = require('q');
const baseModel = require("./base.model");
var shortid = require('shortid');


class PaymentModel extends baseModel {

   /**
    * Function to handle card details
    * @param {int} userId 
    * @param {object} cardInfo 
    **/
   handleCardDetails(userId, cardInfo) {
      var q = Q.defer();
      try {
         var cardToken = Buffer.from(JSON.stringify(cardInfo)).toString('base64'); //STATIC //--TODO
         var insertSql = "INSERT INTO user_payment_info SET card_token = :ct , user_id=:ui ON DUPLICATE KEY UPDATE card_token = :ct";
         var sqlParams = { ct: cardToken, ui: userId };
         this.app.mysqldb.query(insertSql, sqlParams).then(function (response) {
            q.resolve({ status: "SUCCESS", message: 'Information successfully updated' });
         }).catch(function () {
            q.reject({ status: "ERROR", message: 'Internal server error' });
         });
      } catch (error) {
         q.reject({ status: "ERROR", message: 'Internal server error' });
      }
      return q.promise;
   }


   /**
    * Function to handle bank details
    * @param {int} userId 
    * @param {object} bankInfo 
    **/
   handleBankDetails(userId, bankInfo) {
      var q = Q.defer();
      try {
         var bankToken = Buffer.from(JSON.stringify(bankInfo)).toString('base64'); //STATIC // --TODO
         var insertSql = "INSERT INTO user_payment_info SET bank_token = :bt ,user_id =:ui ON DUPLICATE KEY UPDATE bank_token = :bt";
         var sqlParams = { bt: bankToken, ui: userId };
         this.app.mysqldb.query(insertSql, sqlParams).then(function (response) {
            q.resolve({ status: "SUCCESS", message: 'Information successfully updated' });
         }).catch(function () {
            q.reject({ status: "ERROR", message: 'Internal server error' });
         });
      } catch (error) {
         q.reject({ status: "ERROR", message: 'Internal server error' });
      }
      return q.promise;
   }


   /**
    * Function to handle transactions 
    * @param {object} transactionInfo 
    **/
   transact(transactionInfo) {
      var q = Q.defer();
      try {
         var insertTransactionSql = `INSERT INTO user_transactions SET user_id=:ui,task_id=:ti,
                                     pay_amount=:pa,flow=:fl,pay_transaction_id=:pti`;
         var sqlParams = {
            ti: transactionInfo.task_id,
            ui: transactionInfo.userId,
            pa: transactionInfo.amount,
            fl: transactionInfo.flow,
            pti: shortid.generate() //STATIC
         };

         this.app.mysqldb.query(insertTransactionSql, sqlParams).then(function (response) {
            q.resolve(true);
         }).catch(function () {
            q.reject(false);
         });
      } catch (error) {
         q.reject(false);
      }
      return q.promise;
   }



}

module.exports = PaymentModel;


