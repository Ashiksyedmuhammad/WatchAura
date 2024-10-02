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
userRoute.get('/resetpassword/:token', userController.loadResetPassword); 
userRoute.post('/reset-password', userController.resetPassword);

//LOADSHOPE
userRoute.get('/shop', productController.loadShop);
userRoute.get('/product/:id', productController.productDetails);

//CART
userRoute.get('/cart',cartController.loadCart);
userRoute.post('/addCartItem',cartController.addToCart);
userRoute.post('/update-cart-quantity',cartController.updateCartQuantity);
userRoute.post('/remove-cart-item',cartController.removeItem)

//CHECKOUT
userRoute.get('/checkOut',checkOutController.loadCheckOut)

//DASHBOARD
userRoute.get('/profile', dashboard.loadDashboard);
userRoute.get('/address', dashboard.loadAddressPage);
userRoute.post('/addAddress', dashboard.addAddress);
userRoute.put('/editAddress/:id', dashboard.editAddress);
userRoute.delete('/deleteAddress/:id', dashboard.deleteAddress);
userRoute.get('/account', dashboard.loadAccount);
userRoute.post('/update-account', dashboard.updateUserData)




module.exports = userRoute;