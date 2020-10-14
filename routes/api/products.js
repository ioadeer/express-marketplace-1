const express = require('express');
const router = express.Router();
const passport = require('passport');

const Product = require('../../models/Products');
const User = require('../../models/User');
const Receipt = require('../../models/Receipt');

const {
    validateProductCreate,
} = require('../../validation/products');
// @route GET /api/products/
// @desc  Returns all products owned by user
// @access Public
router.get('/', passport.authenticate('jwt', {session: false}), (req, res) =>{
    const user  = req.user;
        if(!user) {
    return res.status(400).json({ restricted : "nono"})
  } else {
  const userEmail = req.user.email;
  User.findOne({ email : userEmail}, (err, user) => {
    if (err) { return res.status(400).json({ error: err });} 
    User.findById(user._id).populate("product").exec((err, user) =>{
    if(err) return res.status(400).json({ error: err });
      return res.status(200).json({ products: user.product})
    });
  });
  }
});

// @route GET /api/products/all
// @desc  Returns all products 
// @access Public
router.get('/all', (req, res) =>{
  Product.find({}).then( (products, err) => {
    if(err) res.status(400).json({error: "No product found"})
    return res.status(200).json({ products: products});
  });
});

// @route  POST /api/products/create
// @desc   Create product 
// @access Public 
router.post('/create',passport.authenticate('jwt', {session: false}), (req, res) =>{

  const { errors, isValid } = validateProductCreate(req);
  if(!isValid){
    return res.status(400).json({error: errors});
  }

  const userName = req.user.name;
  const productName = req.body.productname;
  const price = req.body.price;
  const newProduct = new Product({
    name: productName,
    price: price,
    isForSale: true
  });

  newProduct
    .save()
    .catch(err => console.log(err));
  
  User.findOne({ name: userName }).then( user => {
    User.findByIdAndUpdate(user._id,
      { $push: {product: newProduct}},
      { new: true, useFindAndModify: false},
      (err, doc) => {
        if(err){
          return res.status(400).json({ error: err })
        } else {
          return res.status(200).json({ created: 'success', user: doc.name, product: newProduct})

        }
      });
    });
  });

// @route  GET /api/products/detail/:id
// @desc   Product detail
// @access Public
router.get('/detail/:id', (req,res) => {

  const productId = req.params.id;
  Product.findById( productId, (err, product) => {
    if(err) { return res.status(404).json({ error: "Product not found"});}
    return res.status(200).json({ product : product});
  });
});

// @route  PUT /api/products/update/:id
// @desc   Update product 
// @access Public 
router.put('/update/:id', passport.authenticate('jwt', {session: false}),(req,res) => {
  const productId = req.params.id;
  const userName = req.user.name;

  const productName = req.body.productname;
  const price  = req.body.price;
  const isForSale = req.body.isforsale;

  User.findOne({ name: userName })
    .then( user => {
      if(user.product.includes(productId)){
        Product.findOneAndUpdate( {_id: productId }, 
          { $set:
            {
              price: price,
              name: productName,
              isForSale: isForSale
            },
          },
          { new: true, useFindAndModify: false },
          (err,data) => {
          if(err) return res.status(400).json({ error: err});
          return res.status(200).json({updated : data});
        })
      } else {
        return res.status(400).json({denied: "Product doesn't exist"});
      }
    })
    .catch(err => console.log(err));
});

// @route  DELETE /api/products/update/:id
// @desc   Delete product 
// @access Private 
router.delete('/:id', passport.authenticate('jwt', {session: false}), (req,res) => {
  const productId = req.params.id;
  const userName = req.user.name;

  User.findOne({ name: userName })
    .then( async user => {
      if(user.product.includes(productId)){
        await User.updateOne({'name': userName}, { $pull: { product : productId }});
        Product.findByIdAndDelete( productId , 
          { useFindAndModify: false },
          (err,data) => {
          if(err) return res.status(400).json({ error: err});
          return res.status(200).json({deleted: data});
        })
      } else {
        return res.status(400).json({denied: "Product doesn't exist"});
      }
    })
    .catch(err => console.log(err));
});

// @route  POST /api/products/buy/:id
// @desc   Buy product 
// @access Private 
router.post('/buy/:id',passport.authenticate('jwt', {session: false}), (req,res) => {
  const productId = req.params.id;
  const productBuyer = req.user.name;

  Product.findById( productId, (err, product) => {
    if(err) return res.status(404).json({ error: "Product not found"});
    if(!product.isForSale){
      return res.status(400).json({ error: "Product not for sale"});
    } else {
      User.findOne({ 'name' : productBuyer}).then( (buyer, err) => {
        if(err) return res.status(404).json({ error: "Buyer doesn't exists"});
        if(buyer.product.includes(product._id)){
          return res.status(400).json({ error: "Can't buy your own product"});
        } else {
          if(buyer.balance < product.price) {
            return res.status(400).json({ error: "Not enough funds"});
          } else {
            User.findOne({ 'product' : product._id}).then( seller =>{
              seller.balance += product.price;
              const productPos = seller.product.indexOf(product);
              seller.product.splice(productPos,1);
              seller.save( (err) => {
                if(err) return res.status(400).json({ err, error: "Error writing seller"});
              });
              const newReceipt = new Receipt({seller: seller, buyer: buyer, value: product.price, product: product});
              newReceipt.save( (err)=> {
                if(err) return res.status(400).json({ error: err, what: "Could not create receipt"});
                //console.log(result);
              });
            }).catch(err => { return res.status(400).json({ error: err, seller: "Not found"});});
            buyer.product.push(product);
            buyer.balance-=product.price;
            buyer.save((err, raw) => {
              if (err){ 
                return res.status(400).json({ error: err, what : "could not push and discount" });
              }
              return res.status(200).json({ sold: 'succesful',
                to: buyer.name,
                product: product});
            });
          }
        }
      }).catch(err => console.log(err));
    }
  });
});
 

module.exports = router;
