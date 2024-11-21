const User = require('../../model/user/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const flash = require('connect-flash');
const passport = require('../../config/passport');
const Wishlist = require('../../model/user/userWishList')
const Cart = require('../../model/user/cart')



// USER LOGIN

const toLogin = async (req, res) => {
    try {
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
};


const checkLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email, isBlocked: false });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch && userData.isValid == true) {
                req.session.userSession = userData._id;
                res.status(200).json({ success: true })
            } else {
                res.json({ success: false, message: "Email or Password Incorrect" })
            }
        } else {
            res.json({ success: false, message: 'Invalid User...' })
        }
    } catch (error) {
        console.error('Error verifying signIn:', error.message);
        return res.status(500).send('Internal Server Error');
    }

};



// LOAD HOME

const loadHome = async (req, res) => {
    if (req.session.userSession) {
        const userData = await User.find({ _id: req.session.userSession })
        const wishlist = await Wishlist.find({userId:req.session.userSession});
        const cart = await Cart.find({userId:req.session.userSession})
        res.render('home', { userData,wishlist,cart })
    } else {
        res.render('home')
    }
}


const loadAuth = (req, res) => {
    res.render('auth');
}

// INSERT USER 

const insertUser = async (req, res) => {
    try {

        const { email, firstName, lastName, password } = req.body;
        const userCheck = await User.findOne({ email });
        if (userCheck) {
            return res.json({
                message: "User Already Exists,Please Login..."
            });
        }
        const securePassword = await bcrypt.hash(password, 10);
        const newUser = {
            password: securePassword,
            firstName,
            lastName,
            email,
            isValid: true
        };
        const otp = crypto.randomInt(100000, 999999);
        req.session.optStore = otp;
        req.session.userData = newUser;
        req.session.otpTIme = Date.now();
        console.log(`${req.session.optStore}`);

        const mailOptions = {
            from: 'ashiknlpy@gmail.com',
            to: email,
            subject: 'Your OTP for Registration',
            text: `Your OTP code is ${otp}`
        };

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ashiknlpy@gmail.com',
                pass: 'poyi szct yrox nkue'
            }
        });
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(`Error Details`, error);
                res.status(500).json({ success: false, message: 'Error Sending email', error: error.message })
            } else {
                res.status(200).json({ success: true, redirectUrl: `/otpValidate?id=${email}` })
            }
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "An error occurred during registration." });
    }
};

// veirify OTP

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const sessionOtp = req.session.optStore;
        const userData = req.session.userData;

        if (parseInt(otp) === sessionOtp) {

            const newUser = new User(userData);
            await newUser.save();


            req.session.optStore = null;
            req.session.userData = null;
            req.session.otpTIme = null;

            const userDetails = await User.find({ email: userData.email })

            req.session.userSession = userDetails[0]._id

            res.status(200).json({ success: true, message: "Registration successful. Please log in." });
        } else {

            res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "An error occurred during OTP verification." });
    }
};

// RESEND OTP

const resendOtp = async (req, res) => {
    try {
        const email = req.body['email'];
        const otp = crypto.randomInt(100000, 999999).toString();
        req.session.otpStore = otp;
        req.session.otpTime = Date.now();
        console.log(`${req.session.otpStore}`);
        const mailOptions = {
            from: process.env.SUPER_EMAIL,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. This OTP is valid for 2 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error.message);
                return res.status(500).send('Error sending email');
            } else {
                res.render('otpform', { email: email, message: "Resended successfully" });
            }
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};



const googleAuthCallback = async (req, res, next) => {

    passport.authenticate('google', (err, user, info) => {

        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/');
        }
        req.logIn(user, async (err) => {
            if (err) {
                return next(err);
            }
            const googleUser = await User.findOne({ email: user.email })
            req.session.userSession = googleUser._id;

            return res.redirect('/');
        });

    })(req, res, next);

};

const logout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log('Error destroying session:', err);
                return res.status(500).send('Internal Server Error');
            }
            req.user = null;

            res.redirect('/');
        });
    } catch (error) {
        console.log('Error during logout:', error);
        res.status(500).send('Internal Server Error');
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate reset token and expiration time
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Password',
            html: `
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="https://www.ashiq.store/resetpassword/${encodeURIComponent(resetToken)}">
                    Reset Password
                </a>
                <p>This link will expire in 1 hour.</p>
            `
        };
        

        // Send the email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ashiknlpy@gmail.com', 
                pass: 'poyi szct yrox nkue' 
            }
        });
        

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'Error sending email' });
            }
            res.status(200).json({ success: true, message: 'Reset password email sent successfully' });
        });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const loadResetPassword = async (req, res) => {
    try {
        const resetToken = req.params.id;

        
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).send('Invalid or expired password reset token');
        }

        
        res.render('resetpassword', { token: resetToken });
    } catch (error) {
        console.error('Error in loadResetPassword:', error);
        res.status(500).send('Internal Server Error');
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

    
        const hashedPassword = await bcrypt.hash(newPassword, 10);

       
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const fourNotFour = async(req,res)=>{
    try {
        const userId = req.session.userSession;
        const user = await User.findById(userId)
        res.render('404',user)
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
module.exports = {
    loadHome,
    insertUser,
    verifyOtp,
    resendOtp,
    loadAuth,
    googleAuthCallback,
    toLogin,
    checkLogin,
    logout,
    forgotPassword,
    loadResetPassword,
    resetPassword,
    fourNotFour
}