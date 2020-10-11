const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User');

// Create Product Schema 

const ProductSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	isForSale: {
		type: Boolean,
		required: true
	}
});


module.exports = Product = mongoose.model('products', ProductSchema);
