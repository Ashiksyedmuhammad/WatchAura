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
const Offer = require('../../model/admin/offerModal')
require('dotenv').config();


const loadCheckOut = async (req, res) => {
    try {
        const userId = req.session.userSession;
        let subTotal = 0;

        const [cart, user, address, coupon] = await Promise.all([
            Cart.findOne({ userId })
                .populate('items.productId')
                .populate({
                    path: 'items.productId',
                    populate: {
                        path: 'category'
                    }
                }),
            User.findById(userId),
            Address.find({ userId }),
            Coupon.find()
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!cart || cart.items.length < 1) {
            return res.redirect("/");
        }

        let productDetails = [];

   
        const productOfferIds = cart.items
            .map(item => item.productId.offerId)
            .filter(Boolean);

        const categoryIds = [...new Set(
            cart.items
                .map(item => item.productId.category?._id)
                .filter(Boolean)
        )];

       
        const [productOffers, categoryOffers] = await Promise.all([
            Offer.find({
                _id: { $in: productOfferIds },
                status: 'active',
                expiryDate: { $gt: new Date() }
            }).lean(),
            Offer.find({
                categories: { $in: categoryIds },
                status: 'active',
                expiryDate: { $gt: new Date() }
            }).lean()
        ]);

       
        const productOffersMap = new Map(
            productOffers.map(offer => [offer._id.toString(), offer])
        );

        const categoryOffersMap = new Map(
            categoryOffers.map(offer => [offer.categories[0].toString(), offer])
        );

       
        productDetails = await Promise.all(
            cart.items.map(async (item) => {
                const product = item.productId;
                const category = product.category;

               
                const productOffer = product.offerId ?
                    productOffersMap.get(product.offerId.toString()) : null;
                const productDiscount = productOffer?.discount || 0;

           
                const categoryOffer = category?._id ?
                    categoryOffersMap.get(category._id.toString()) : null;
                const categoryDiscount = categoryOffer?.discount || 0;

              
                const bestDiscount = Math.max(productDiscount, categoryDiscount);
                const effectivePrice = product.price * (1 - bestDiscount / 100);

                return {
                    productId: product._id,
                    name: product.productName,
                    price: product.price,
                    offerId: productOffer?._id || categoryOffer?._id,
                    effectivePrice: effectivePrice,
                    discount: bestDiscount,
                    discountType: bestDiscount === productDiscount ? 'product' : 'category',
                    offerTitle: bestDiscount === productDiscount ? 
                        productOffer?.title : categoryOffer?.title
                };
            })
        );

       
        cart.items.forEach((cartItem) => {
            const product = cartItem.productId;
            const quantity = cartItem.quantity;
            const productDetail = productDetails.find(
                detail => detail.productId.toString() === product._id.toString()
            );

            subTotal += productDetail.effectivePrice * quantity;
        });

      
        subTotal = Math.round(subTotal * 100) / 100;

        res.render('checkOut', {
            cart,
            user,
            subTotal,
            address,
            coupon,
            productDetails
        });
    } catch (error) {
        console.error('Error loading checkout:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while loading the checkout' 
        });
    }
};



//APPLY COUPON


const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.userSession;

        const coupon = await Coupon.findOne({ couponId: couponCode, isActive: true });
        if (!coupon) {
            return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
        }

        
        const cart = await Cart.findOne({ userId })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category'
                }
            });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        
        const productIds = cart.items.map(item => item.productId._id);
        const categoryIds = [...new Set(cart.items.map(item => 
            item.productId.category?._id).filter(Boolean))];

      
        const [productOffers, categoryOffers] = await Promise.all([
            Offer.find({
                products: { $in: productIds },
                status: 'active',
                expiryDate: { $gt: new Date() }
            }),
            Offer.find({
                categories: { $in: categoryIds },
                status: 'active',
                expiryDate: { $gt: new Date() }
            })
        ]);

     
        const productOffersMap = new Map(
            productOffers.flatMap(offer => 
                offer.products.map(productId => [productId.toString(), offer]))
        );

        const categoryOffersMap = new Map(
            categoryOffers.flatMap(offer => 
                offer.categories.map(categoryId => [categoryId.toString(), offer]))
        );

       
        let subTotal = 0;
        cart.items.forEach((item) => {
            const product = item.productId;
            const quantity = item.quantity;

       
            const productOffer = productOffersMap.get(product._id.toString());
            const categoryOffer = product.category ? 
                categoryOffersMap.get(product.category._id.toString()) : null;

            
            const productDiscount = productOffer?.discount || 0;
            const categoryDiscount = categoryOffer?.discount || 0;
            const bestDiscount = Math.max(productDiscount, categoryDiscount);

           
            const effectivePrice = product.price * (1 - bestDiscount / 100);
            
            subTotal += effectivePrice * quantity;
        });

        
        subTotal = Math.round(subTotal * 100) / 100;

     
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

        const discountAmount = Math.round((subTotal * coupon.discount) / 100 * 100) / 100;
        const totalAfterDiscount = Math.round((subTotal - discountAmount) * 100) / 100;

       
        req.session.appliedCoupon = {
            code: coupon.couponId,
            discountAmount,
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

    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: 'aPROhAiDugzPGG8hrVTXyck6'
});


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const { addressId, paymentMethod } = req.body;

       
        const [cart, user, address] = await Promise.all([
            Cart.findOne({ userId })
                .populate({
                    path: 'items.productId',
                    populate: {
                        path: 'category'
                    }
                }),
            User.findById(userId),
            Address.findById(addressId)
        ]);

       
        if (!cart || cart.items.length < 1) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

  
        const productIds = cart.items.map(item => item.productId._id);
        const categoryIds = [...new Set(cart.items.map(item => 
            item.productId.category?._id).filter(Boolean))];

        
        const [productOffers, categoryOffers] = await Promise.all([
            Offer.find({
                products: { $in: productIds },
                status: 'active',
                expiryDate: { $gt: new Date() }
            }),
            Offer.find({
                categories: { $in: categoryIds },
                status: 'active',
                expiryDate: { $gt: new Date() }
            })
        ]);

       
        const productOffersMap = new Map(
            productOffers.flatMap(offer => 
                offer.products.map(productId => [productId.toString(), offer]))
        );

        const categoryOffersMap = new Map(
            categoryOffers.flatMap(offer => 
                offer.categories.map(categoryId => [categoryId.toString(), offer]))
        );

        
        let totalAmount = 0;
        let discountAmount = 0;
        let couponId = null;

        
        const orderItems = cart.items.map(item => {
            const product = item.productId;
            const quantity = item.quantity;

            
            const productOffer = productOffersMap.get(product._id.toString());
            const categoryOffer = product.category ? 
                categoryOffersMap.get(product.category._id.toString()) : null;

        
            const productDiscount = productOffer?.discount || 0;
            const categoryDiscount = categoryOffer?.discount || 0;
            const bestDiscount = Math.max(productDiscount, categoryDiscount);

            
            const effectivePrice = Math.round(product.price * (1 - bestDiscount / 100) * 100) / 100;
            
           
            totalAmount += effectivePrice * quantity;

         
            return {
                productId: product._id,
                name: product.productName,
                image: product.image,
                quantity: quantity,
                price: effectivePrice,
                originalPrice: product.price,
                appliedDiscount: bestDiscount,
                discountType: bestDiscount === productDiscount ? 
                    (productOffer ? 'product' : null) : 
                    (categoryOffer ? 'category' : null),
                offerId: bestDiscount === productDiscount ? 
                    productOffer?._id : categoryOffer?._id
            };
        });

        
        totalAmount = Math.round(totalAmount * 100) / 100;

       
        if (req.session.appliedCoupon) {
            discountAmount = req.session.appliedCoupon.discountAmount;
            couponId = req.session.appliedCoupon.code;
            totalAmount -= discountAmount;
        }


        
        if (totalAmount > 1000 && paymentMethod === 'COD') {
            return res.status(400).json({ 
                success: false, 
                message: 'Orders above Rs 1000 are not allowed for COD payment' 
            });
        }

        
        const payment_type_objId = await Payment.findOne({ payType: paymentMethod });
        if (!payment_type_objId) {
            return res.status(400).json({ success: false, message: 'Invalid payment type' });
        }


       
        const randomOrderId = Math.floor(10000 + Math.random() * 90000);

        
        const newOrder = new UserOrder({
            userId: userId,
            orderId: `ORD-${randomOrderId}`,
            items: orderItems,
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
                { couponId: couponId },
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
            // Create Razorpay order
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
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while placing the order' 
        });
    }
};



const verifyPayment = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        

        const order = await UserOrder.findOne({ _id: orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.paymentStatus = status;
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

const initiateRetryPayment = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus !== 'Failed') {
            return res.status(400).json({ success: false, message: 'Invalid payment status for retry' });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: order.totalAmount * 100,
            currency: 'INR',
            receipt: order.orderId,
            payment_capture: 1
        });

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.status(200).json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            key: process.env.RAZORPAY_KEY_ID,
            orderId: order._id

        });

    } catch (error) {
        console.error('Error initiating retry payment:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate payment retry' });
    }
};


const quantityCheck = async (req, res) => {
    try {
        const userId = req.session.userSession;
        
       
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        for (const item of cart.items) {
            const product = item.productId; 
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Not enough stock for ${product.name}` });
            }
        }

       
        res.status(200).json({ message: 'Stock verified' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};
module.exports = {
    loadCheckOut,
    placeOrder,
    verifyPayment,
    applyCoupon,
    removeCoupon,
    initiateRetryPayment,
    quantityCheck
};