const express = require('express');
const router = express.Router();
const passport = require('passport');

const Product = require('../../models/Products');
const User = require('../../models/User');

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

router.post('/create',passport.authenticate('jwt', {session: false}), (req, res) =>{
	const userName = req.user.name;
	const productName = req.body.productname;
	const price = req.body.price;

	if(!productName || !price ) {
		return res.status(400).json({ error : "Invalid name or price" });
	}
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

router.get('/detail/:id', (req,res) => {
	const productId = req.params.id;
	Product.findById( productId, (err, product) => {
		if(err) { return res.status(404).json({ error: "Product not found"});}
		return res.status(200).json({ product : product});
	});
});

router.put('/update/:id', passport.authenticate('jwt', {session: false}),(req,res) => {
	const productId = req.params.id;
	const userName = req.user.name;

	debugger;
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

router.delete('/:id', passport.authenticate('jwt', {session: false}), (req,res) => {
	const productId = req.params.id;
	const userName = req.user.name;

	// Check if product is owned by user
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
						//return res.status(200).json({message: "product swap"});
						User.findOneAndUpdate({ 'product' : product._id},
							{ $pull: {product: product._id},
							 	$inc: {balance: product.price}},
							{ new: true, useFindAndModify: false },
							function(err,raw){
								if (err) return res.status(400).json({ error: err, what : "could not pull and pay" });
								console.log(raw);
							});
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
