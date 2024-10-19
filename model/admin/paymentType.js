const mongoose = require('mongoose');
const paymentTypeSchema =  new mongoose.Schema({
    payType:{
        type: String
    }
});

module.exports = mongoose.model('PaymentType',paymentTypeSchema);