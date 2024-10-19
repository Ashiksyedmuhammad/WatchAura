const mongoose = require("mongoose");
const Category = require("../../model/admin/categoryList");
const Product = require('../../model/admin/productModel');
const User = require('../../model/user/userModel');
const Cart = require('../../model/user/cart');
require('dotenv').config();



const loadCart = async (req, res) => {
    try {
        const userId = req.session.userSession;
        let subTotal = 0;
        const [cart, user] = await Promise.all([
            Cart.findOne({ userId }).populate('items.productId'),
            User.findById(userId)
        ]);


        if (!user) {
            res.render('cart', {
                cart: undefined,
                subTotal
            });
        } else {
            if (!cart) {
                res.render('cart', {
                    cart:undefined,
                    user,
                    subTotal
                });
            }else{
            cart.items.forEach((cartItem) => {
                subTotal += cartItem.productId.price * cartItem.quantity;
            });
            res.render('cart', {
                cart,
                user,
                subTotal
            });}
        }





    } catch (error) {
        console.error('Error Loading Cart:', error);
        res.status(500).json({ success: false, message: 'An error occurred while loading the Cart' });
    }
};


const addToCart = async (req, res) => {
    
    const { productId, quantity, userId } = req.body;

    try {

        let cart = await Cart.findOne({ userId: userId });

        if (cart) {

            const productExists = cart.items.some(item => item.productId.toString() === productId);
            if (productExists) {
                return res.status(400).json({ success: false, message: "Product already in cart...!" });
            }

            cart.items.push({ productId, quantity });

            await cart.save();
            return res.status(200).json({ success: true, message: 'Product added to cart...!' });
        } else {
            const newCart = new Cart({
                userId: userId,
                items: [{ productId, quantity }]
            });

            
            await newCart.save();

            return res.status(201).json({ success: true, message: 'New Product added to cart...!' });
        }

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error...!' });
    }
};



const updateCartQuantity = async (req, res) => {

    const { productId, quantity } = req.body;
    const cartId = req.query.cartId

    try {

        let cart = await Cart.findOne({ _id: cartId }).populate('items.productId');

        if (cart) {
            const productIndex = cart.items.findIndex(item => item.productId._id.toString() === productId);

            if (productIndex > -1) {

                cart.items[productIndex].quantity = quantity;

                await cart.save();


                let subTotal = 0;

                let itemTotal = 0

                cart.items.forEach((item) => {
                    subTotal += item.productId.price * item.quantity;
                    if (item.productId._id.toString() === productId) {
                        itemTotal = item.productId.price * item.quantity;
                    }
                });
                return res.status(200).json({
                    success: true,
                    message: 'Cart item quantity updated',
                    subTotal: subTotal,
                    quantity,
                    cart,
                    itemTotal
                });
            } else {
                return res.status(404).json({ success: false, message: 'Product not found in cart' });
            }
        } else {
            return res.status(404).json({ success: false, message: 'Cart not found for this user' });
        }

    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const removeItem = async (req, res) => {
    try {
        const { cartId } = req.query;
        
        const { productId } = req.body;

        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();

        const newSubTotal = cart.items.reduce((total, item) => {
            return total + (item.productId.price * item.quantity);
        }, 0);

        res.json({ success: true, newSubTotal });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ success: false, message: 'An error occurred while removing the item from the cart' });
    }
}
module.exports = {
    loadCart,
    addToCart,
    updateCartQuantity,
    removeItem
}