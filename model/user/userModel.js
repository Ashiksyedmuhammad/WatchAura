const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
    firstName: {
        type:String,
    },
    lastName: {
        type:String,
    },
    phone:{
        type:Number,
    },
    email:{
        type:String,
    },
    password:{
        type:String,
    },
    isValid:{
        type:Boolean
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    date:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model('user',userSchema);