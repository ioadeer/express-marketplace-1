const Validator = require('validator');
const isEmpty = require('is-empty');

module.exports = function validateProductCreate(data){

  let errors = {}
  // Convert fields to string 
  let userName = !isEmpty(data.user.name) ? data.user.name: "";
  let productName = !isEmpty(data.body.productname) ? data.body.productname: "";
  let price = !isEmpty(data.body.price) ? data.body.price: "";

  // Username check
  if(Validator.isEmpty(userName)){
    errors.name= "Name is required";
  }

  // Username check
  if(Validator.isEmpty(productName)){
    errors.productName = "Product name is required";
  }

  // price check
  if(Validator.isEmpty(price)){
    errors.price= "Price is required";
  } else if (!Validator.isNumeric(price)){
    errors.price= "Price is must be a number";
  }
  return{
    errors,
    isValid: isEmpty(errors)
  }
}
