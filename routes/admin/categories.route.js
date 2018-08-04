"use strict";

var categoriesController = require("../../controllers/admin/categories.controller");
var Joi = require('joi');
var validate = require('restify-api-validation');

class adminCategoriesRoutes {
   constructor(app) {
      this.app = app;
      this.name = 'admincategories';
      this.validations = this.validations();
   }

   /**
    * @param  {} mp
    */
   resource(mp) {
      let categoriesControllerObj = new categoriesController(this.app);
      this.app.get(mp + '/admin/categories', validate(this.validations.getCategoriesList), this.app.route_filter.tokenMiddleware(), categoriesControllerObj.getCategoriesList);
      this.app.post(mp + '/admin/category/add', validate(this.validations.addCategory), this.app.route_filter.tokenMiddleware(), categoriesControllerObj.addJobCategory);
      this.app.put(mp + '/admin/category/edit', validate(this.validations.editCategory), this.app.route_filter.tokenMiddleware(), categoriesControllerObj.editJobCategory);
   }

   validations() {
      var validate = {
         getCategoriesList: {
            options: { flatten: false },
            query: {
               pp: Joi.number(),
               pg: Joi.number(),
               search_key: Joi.string()
            }
         },
         editCategory: {
            options: { flatten: false },
            body: {
               category_name: Joi.string(),
               category_description: Joi.string(),
               is_online: Joi.string(),
               category_id: Joi.number().required(),
               parent_category_id: Joi.number(),
            }
         },
         addCategory: {
            options: { flatten: false },
            body: {
               category_name: Joi.string().required(),
               category_description: Joi.string(),
               is_online: Joi.string().required,
               parent_category_id: Joi.number(),
            }
         }
      };
      return validate;
   }

}
module.exports = adminCategoriesRoutes;