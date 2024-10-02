const mongoose = require("mongoose");
const addressSchema = new mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    postal_code: {
        type: String
    },
    phone: {
        type: String
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
         ref: 'user',
         required: true
    }
}, {
    timestamps: true 
});

 module.exports = mongoose.model('Address',addressSchema);
