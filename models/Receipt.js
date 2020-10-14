const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReceiptSchema = new Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',
  },
  value: {
    type: Number,
    required: true
  }
}, { timestamps : true });

module.exports = Receipt = mongoose.model('receipts', ReceiptSchema);
