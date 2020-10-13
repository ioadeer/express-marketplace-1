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
	balance: {
		type: Number,
	},
	product: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'products',
	}],
}, { timestamps: true });

module.exports = User = mongoose.model('users', UserSchema);
