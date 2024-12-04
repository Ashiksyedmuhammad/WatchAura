const express = require('express');
const session = require('express-session');
const userRoute = express()
const userController = require('../controller/user/userController');
const productController = require('../controller/user/productController');
const dashboard = require('../controller/user/dashBoard');
const cartController = require('../controller/user/cartController');
const path = require("path");
const config = require('../config/config')
const passport = require('../config/passport');
require('../config/passport');
const userAuth = require('../middleware/userAuth');
const checkOutController = require('../controller/user/checkOutController');
const userOrder = require('../model/user/userOrder');
const coupon = require('../model/admin/coupon');


userRoute.use(session({
  secret: config.userSessionSecret,
  resave: false,
  saveUninitialized: true
}));


userRoute.set('view engine', 'ejs')
userRoute.set('views', './views/user');


userRoute.get('/', userController.loadHome);
userRoute.post('/signUp', userController.insertUser);
userRoute.post('/verify-otp', userController.verifyOtp);
userRoute.post('/resend-otp',userController.resendOtp);
userRoute.post('/login', userController.checkLogin);
userRoute.post('/logout', userController.logout);

userRoute.get('/auth/google/callback', userController.googleAuthCallback);

userRoute.use(passport.initialize());
userRoute.use(passport.session());
userRoute.get('/', userController.loadAuth)
userRoute.get('/auth/google',
passport.authenticate('google', { scope: ['profile', 'email'] }));

userRoute.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  });

//FORGOT PASSWORD
userRoute.post('/forgot-password', userController.forgotPassword);
userRoute.get('/resetpassword/:id', userController.loadResetPassword); 
userRoute.post('/reset-password', userController.resetPassword);
// userRoute.get('/404', userController.fourNotFour);

//LOADSHOPE
userRoute.get('/shop', productController.loadShop);
userRoute.get('/product/:id', productController.productDetails);

//CART
userRoute.get('/cart',userAuth.isLogin,cartController.loadCart);
userRoute.post('/addCartItem',userAuth.isLogin,cartController.addToCart);
userRoute.post('/update-cart-quantity',userAuth.isLogin,cartController.updateCartQuantity);
userRoute.post('/remove-cart-item',userAuth.isLogin,cartController.removeItem)
userRoute.post('/quantityCheck',checkOutController.quantityCheck)
//CHECKOUT
userRoute.get('/checkOut',userAuth.isLogin,checkOutController.loadCheckOut);
userRoute.get('/placeOrder',userAuth.isLogin,checkOutController.placeOrder);
userRoute.post('/place-order',userAuth.isLogin,checkOutController.placeOrder);
userRoute.get('/orderSummary/:id',userAuth.isLogin,dashboard.loadOrderSummary);
userRoute.post('/verify-payment',userAuth.isLogin,checkOutController.verifyPayment);
userRoute.get('/initiate-payment/:orderId', userAuth.isLogin,checkOutController.initiateRetryPayment);


// COUPON
userRoute.post('/apply-coupon',userAuth.isLogin, checkOutController.applyCoupon);
userRoute.post('/remove-coupon', userAuth.isLogin, checkOutController.removeCoupon);


//DASHBOARD
userRoute.get('/profile',userAuth.isLogin, dashboard.loadDashboard);
userRoute.get('/address',userAuth.isLogin, dashboard.loadAddressPage);
userRoute.post('/addAddress',userAuth.isLogin, dashboard.addAddress);
userRoute.put('/editAddress/:id',userAuth.isLogin, dashboard.editAddress);
userRoute.delete('/deleteAddress/:id',userAuth.isLogin,  dashboard.deleteAddress);
userRoute.get('/account',userAuth.isLogin, dashboard.loadAccount);
userRoute.post('/update-account', dashboard.updateUserData)
userRoute.get('/orders',userAuth.isLogin,dashboard.loadOrder)
userRoute.get('/order-details/:id',userAuth.isLogin,dashboard.getOrderDetails);
userRoute.post('/cancelOrder',userAuth.isLogin, dashboard.cancelOrder);
userRoute.post('/returnOrder/:id',userAuth.isLogin, dashboard.returnOrder);
userRoute.get('/wishlist',userAuth.isLogin, dashboard.loadWishlist);
userRoute.post('/addWishlistItem',userAuth.isLogin, dashboard.addWishlistItem);
userRoute.delete('/removeWishlistItem', userAuth.isLogin, dashboard.removeWishlistItem);
userRoute.get('/wallet', userAuth.isLogin,dashboard.loadWallet) ;
userRoute.get('/download-invoice/:id',userAuth.isLogin, dashboard.downloadInvoice);


userRoute.use((req,res,next) => {
  res.status(404).render('404');
})

module.exports = userRoute;