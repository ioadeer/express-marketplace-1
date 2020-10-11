const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema 
const UserSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	date: {
		type: Date,
		default: Date.now
	},
	balance: {
		type: Number,
	},
	product: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'products',
	}],
});

module.exports = User = mongoose.model('users', UserSchema);
