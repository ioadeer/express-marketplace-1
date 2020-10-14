const Validator = require('validator');
const isEmpty = require('is-empty');

module.exports = function validateLoginInput(data){
  
  let errors = {}

  // Convert fields to string 
  let email = !isEmpty(data.email) ? data.email : "";
  let password = !isEmpty(data.password) ? data.password : "";

  // Email check
  if(Validator.isEmpty(email)){
    errors.email = "Email is required";
  } else if (!Validator.isEmail(email)){
    errors.email = "Email is invalid";
  }

  // Password check
  if(Validator.isEmpty(password)){
    errors.password = "Password is required";
  }

  return{
    errors,
    isValid: isEmpty(errors),
  }

}
