const Validator = require('validator');
const isEmpty = require('is-empty');

module.exports = function validateMongoId(data){

  let errors = {}
  // Convert fields to string 
  let productId = !isEmpty(data.params.id) ? data.params.id: "";

  // Id check
  if(Validator.isEmpty(productId)){
    errors.product_error= "Product Id is required";
  } else if (!Validator.isMongoId(productId)){
    errors.product_error= "Product Id is required";
  }

  return{
    errors,
    isValid: isEmpty(errors)
  }
}
