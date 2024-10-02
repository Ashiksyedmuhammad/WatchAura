const mongoose = require("mongoose");
const Category = require("../../model/admin/categoryList");
const Product = require('../../model/admin/productModel');
const User = require('../../model/user/userModel');
const Cart = require('../../model/user/cart');
require('dotenv').config();


const loadCheckOut = async (req, res) => {
   try {
    const userId = req.session.userSession;
    const [cart,user] = await Promise.all([
        Cart.findOne({userId}).populate('items.productId'),
        User.findById(userId)
    ]);
    if(!cart || !user){
        return res.status(404).json({ success :false,message:'Cart or User not Found...!'})
    }
    let subTotal = 0;
    cart.items.forEach((item)=>{
        subTotal += item.productId.price*item.quantity;
    });
    res.render('checkOut',{
        cart,
        user,
        subTotal
    });
   } catch (error) {
    console.error('Error loading checkout:', error);
    res.status(500).json({ success: false, message: 'An error occurred while loading the checkout' });
   }
}


module.exports = {
    loadCheckOut
}