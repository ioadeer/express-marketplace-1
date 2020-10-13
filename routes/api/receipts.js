const express = require('express');
const router = express.Router();
const passport = require('passport');

const Product = require('../../models/Products');
const User = require('../../models/User');
const Receipt = require('../../models/Receipt');

// @route GET /api/receipts/purchased
// @desc Returns receipts from itmes purchased by user 
// @access Public
router.get('/purchased', passport.authenticate('jwt', {session: false}), (req, res) =>{
	const user  = req.user;
	if(!user) {
		return res.status(400).json({ restricted : "nono"});
	} else {
	const userEmail = req.user.email;
	debugger;
	User.findOne({ 'email' : userEmail})
			.then( user => {
				debugger;
				Receipt.find({ buyer: user._id})
					.sort({createdAt : -1})
					.select('-_id -__v -updatedAt -buyer')
					.populate({path: 'seller', select: '-_id name email' })
					.populate({ path: 'product', select: '-_id name'})
					.exec(function(err, receipts){
						if (err) { return res.status(400).json({ error: err });} 
						return res.status(200).json({receipts: receipts});
				});
			})
			.catch(err => {return res.status(400).json({err : err})});
	}
});

// @route GET /api/receipts/sold
// @desc Returns receipts for itmes sold by user 
// @access Public
router.get('/sold', passport.authenticate('jwt', {session: false}), (req, res) =>{
	const user  = req.user;
	if(!user) {
		return res.status(400).json({ restricted : "nono"});
	} else {
	const userEmail = req.user.email;
	User.findOne({ 'email' : userEmail})
			.then( user => {
				debugger;
				Receipt.find({ seller: user._id})
					.sort({createdAt : -1})
					.select('-_id -__v -updatedAt -seller')
					.populate({path: 'buyer', select: '-_id name email' })
					.populate({ path: 'product', select: '-_id name'})
					.exec(function(err, receipts){
						if (err) { return res.status(400).json({ error: err });} 
						return res.status(200).json({receipts: receipts});
				});
			})
			.catch(err => {return res.status(400).json({err : err})});
	}
});
module.exports = router;
