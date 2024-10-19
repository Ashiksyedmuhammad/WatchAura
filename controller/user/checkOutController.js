const mongoose = require("mongoose");
const Category = require("../../model/admin/categoryList");
const Product = require('../../model/admin/productModel');
const User = require('../../model/user/userModel');
const Cart = require('../../model/user/cart');
const Address = require('../../model/user/userAddress');
const Payment = require('../../model/admin/paymentType');
const Order = require('../../model/user/userOrder');
const UserOrder = require('../../model/user/userOrder');
const Coupon = require('../../model/admin/coupon');
const Razorpay = require('razorpay');
require('dotenv').config();


const loadCheckOut = async (req, res) => {
    try {
        const userId = req.session.userSession;

        const [cart, user, address, coupon] = await Promise.all([
            Cart.findOne({ userId }).populate('items.productId'),
            User.findById(userId),
            Address.find({ userId }),
            Coupon.find()
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Cart or User not Found...!' })
        }
        if (cart.items.length < 1) {

            return res.redirect("/")
        }
        let subTotal = 0;
        cart.items.forEach((item) => {
            subTotal += item.productId.price * item.quantity;
        });
        res.render('checkOut', {
            cart,
            user,
            subTotal,
            address,
            coupon
        });
    } catch (error) {
        console.error('Error loading checkout:', error);
        res.status(500).json({ success: false, message: 'An error occurred while loading the checkout' });
    }
}

//APPLY COUPON


const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.userSession;

        const coupon = await Coupon.findOne({ couponId: couponCode, isActive: true });

        if (!coupon) {
            return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        let subTotal = cart.items.reduce((total, item) => total + (item.productId.price * item.quantity), 0);


        if (subTotal < coupon.minPurchaseAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase of ₹${coupon.minPurchaseAmount} required to use this coupon`
            });
        }

        if (coupon.maxPurchaseAmount && subTotal > coupon.maxPurchaseAmount) {
            return res.status(400).json({
                success: false,
                message: `This coupon is only valid for purchases up to ₹${coupon.maxPurchaseAmount}`
            });
        }

        let discountAmount;
        if (coupon.discountType === 'percentage') {
            discountAmount = (subTotal * coupon.discount) / 100;
            if (coupon.maxAmount) {
                discountAmount = Math.min(discountAmount, coupon.maxAmount);
            }
        } else {
            discountAmount = coupon.discount;
        }

        const totalAfterDiscount = subTotal - discountAmount;

        req.session.appliedCoupon = {
            code: coupon.couponId,
            discountAmount: discountAmount,
        };

        res.status(200).json({
            success: true,
            message: 'Coupon applied successfully',
            discountAmount,
            totalAfterDiscount,
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, message: 'An error occurred while applying the coupon' });
    }
};


const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.userSession;


        delete req.session.appliedCoupon;

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const subTotal = cart.items.reduce((total, item) => total + (item.productId.price * item.quantity), 0);

        res.status(200).json({
            success: true,
            message: 'Coupon removed successfully',
            subTotal,
        });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ success: false, message: 'An error occurred while removing the coupon' });
    }
};

// RAZOR PAY INTEGRATION 

const razorpay = new Razorpay({

    key_id: 'rzp_test_O3ME5jMYgYC8PP',
    key_secret: 'aPROhAiDugzPGG8hrVTXyck6'
});


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const { addressId, paymentMethod } = req.body;

        const [cart, user, address] = await Promise.all([
            Cart.findOne({ userId }).populate('items.productId'),
            User.findById(userId),
            Address.findById(addressId)
        ]);

        if (cart.items.length < 1) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        let totalAmount = cart.items.reduce((total, item) => {
            return total + (item.productId.price * item.quantity);
        }, 0);


        let discountAmount = 0;
        let couponId = null;
        if (req.session.appliedCoupon) {
            discountAmount = req.session.appliedCoupon.discountAmount;
            couponId = req.session.appliedCoupon.code;
            totalAmount -= discountAmount;
        }

        const payment_type_objId = await Payment.findOne({ payType: paymentMethod });

        if (!payment_type_objId) {
            return res.status(400).json({ success: false, message: 'Invalid payment type' });
        }

        const randomOrderId = Math.floor(10000 + Math.random() * 90000);

        const newOrder = new UserOrder({
            userId: userId,
            orderId: `ORD-${randomOrderId}`,
            items: cart.items.map(item => ({
                productId: item.productId._id,
                productName: item.productId.productName,
                image: item.productId.image,
                quantity: item.quantity,
                price: item.productId.price
            })),
            totalAmount: totalAmount,
            shippingAddress: address,
            paymentMethod: paymentMethod,
            paymentStatus: 'Pending',
            orderStatus: 'Placed',
            couponApplied: couponId,
            discountAmount: discountAmount
        });

        await newOrder.save();

        if (couponId) {

            await Coupon.findOneAndUpdate(
                { code: couponId },
                { $inc: { usedCount: 1 } }
            );


            delete req.session.appliedCoupon;
        }

        if (paymentMethod === 'COD') {
            for (let item of cart.items) {
                await Product.findByIdAndUpdate(
                    item.productId._id,
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );
            }
            await Cart.findOneAndDelete({ userId: userId });

            res.status(200).json({
                success: true,
                message: 'Order placed successfully',
                orderId: newOrder._id
            });
        } else {
            const razorpayOrder = await razorpay.orders.create({
                amount: totalAmount * 100,
                currency: 'INR',
                receipt: newOrder.orderId,
                payment_capture: 1
            });

            newOrder.razorpayOrderId = razorpayOrder.id;
            await newOrder.save();

            res.status(200).json({
                success: true,
                message: 'Razorpay order created',
                orderId: newOrder._id,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                key: process.env.RAZORPAY_KEY_ID
            });
        }
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'An error occurred while placing the order' });
    }
};


const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const order = await UserOrder.findOne({ _id: orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.paymentStatus = 'Completed';
        await order.save();


        for (let item of order.items) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
        }


        await Cart.findOneAndDelete({ userId: order.userId });

        return res.status(200).json({
            orderId,
            success: true,
            message: "Payment verified successfully"
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'An error occurred while verifying the payment' });
    }
};




module.exports = {
    loadCheckOut,
    placeOrder,
    verifyPayment,
    applyCoupon,
    removeCoupon
};