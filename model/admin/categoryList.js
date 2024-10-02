const mongoose = require ('mongoose');
const categorySchema = new mongoose.Schema({
    categoryName :{
        type : String,
        required : true
    },
    status :{
        type : Boolean,
        required : true
    },
    description : {
        type : String,
        required : true
    }
});
module.exports = mongoose.model('category',categorySchema);