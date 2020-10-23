const Validator = require('validator');
const isEmpty = require('is-empty');

module.exports = function validateProductUpdate(data){

  let errors = {}
  // Convert fields to string 
  let productId = !isEmpty(data.params.id) ? data.params.id: "";
  let isForSale = !isEmpty(data.body.isforsale) ? data.body.isforsale: "";
  let productName = !isEmpty(data.body.productname) ? data.body.productname: "";
  let price = !isEmpty(data.body.price) ? data.body.price: "";

  // Id check
  if(Validator.isEmpty(productId)){
    errors.product_error= "Product Id is required";
  } else if (!Validator.isMongoId(productId)){
    errors.product_error= "Product Id is required";
  }

  // Is for sale status check
  if(Validator.isEmpty(isForSale)){
    errors.is_for_sale_error = "Stating wether product is for sale is required";
  }

  // Product name check
  if(Validator.isEmpty(productName)){
    errors.product_name_error = "Product name is required";
  }

  // price check
  if(Validator.isEmpty(price)){
    errors.price_error = "Price is required";
  } else if (!Validator.isNumeric(price)){
    errors.price_error = "Price must be a number";
  }
  return{
    errors,
    isValid: isEmpty(errors)
  }
}
