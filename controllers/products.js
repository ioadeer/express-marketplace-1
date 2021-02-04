const express = require('express');
const router = express.Router();
const passport = require('passport');

const Product = require('../../models/Product');
const User = require('../../models/User');
const Receipt = require('../../models/Receipt');

const {
  validateProductCreate,
  validateProductUpdate,
} = require('../../validation/products');

const {
  validateMongoId,
} = require('../../validation/util');

module.exports = {
    getAll : passport.authenticate('jwt', {session: false}), async (req, res) => {
      const user  = req.user;
        if(!user) {
          return res.status(400).json({ restricted : "nono"})
      } else {
      const userEmail = req.user.email;
      User.findOne({ email : userEmail}, (err, user) => {
        if (err) { return res.status(400).json({ error: err });} 
        User.findById(user._id).populate("product").exec((err, user) =>{
        if(err) return res.status(400).json({ error: err });
          return res.status(200).json({ products: user.products})
        });
      });
      }
    }
}