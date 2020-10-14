const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Load input validation
//const validateRegisterInput = require('../../validation/users/register');
//const validateLoginInput= require('../../validation/users/login');
const { 
  validateRegisterInput, 
  validateLoginInput } = require('../../validation/users');

// Load user model
const User = require('../../models/User');

// @route POST /api/users/register
// @desc Register user
// @access Public
router.post('/register', (req, res) =>{
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if(!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then( user=> {
    if (user) {
      return res.status(400).json({ email: "Email already exists"});
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      });

      //Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) =>{
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err))
        });
      });
    }
  });
});

// @route POST /api/user/login
// @desc Login user and return JWT
// @acces Public
router.post('/login', (req, res) =>{

  const { errors, isValid} = validateLoginInput(req.body);
  
  if(!isValid){
    return res.status(400).json(errors);  
  }

  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email }).then( user => {
    if(!user){
      return res.json({emailnotfound : "User not found!"});
    }
    bcrypt.compare(password, user.password).then( isMatch =>{
      if(isMatch) {
        const payload = {
          id: user.id,
          user: user.name,
        }
        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: "5h",
          },
          (err, token) =>{
            if(err) {return res.json({error : "User or password wrong"});}
            res.json({
              success: true,
              token: "Bearer " + token,
            });
          }
        )
      } else {
        return res.json({error : "User or password wrong"});
      }
    });
  }).catch(err => res.json({err : err}));
});
module.exports = router;
