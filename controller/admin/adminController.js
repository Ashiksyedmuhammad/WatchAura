const Admin = require('../../model/admin/adminModel');
const user = require('../../model/user/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const toLogin = async (req, res) => {
    try {
        let errorMessage = '';
        res.render('adminLogin', { errorMessage })
    } catch (error) {
        console.error('Error while Load, Admin Login Page ', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const checkAdmin = async (req, res) => {

    const { email, password } = req.body;


    try {
        const adminData = await Admin.findOne({ email: email })
        if (!adminData) {
            return res.status(401).render('adminLogin', {

                errorMessage: " Invalid  email or Password"
            });
        }
        const passwordMatch = await bcrypt.compare(password, adminData.password);

        if (passwordMatch) {
            req.session.admin = adminData;
            res.redirect('/admin/dashboard')

        } else {
            return res.status(401).render('adminLogin', {
                errorMessage: 'Invalid email or Password'
            })

        }

    } catch (error) {
        console.error('Error In admin Verification:', error);
        res.status(500).send('Server Error');
    }
}

const adminDashboard = async (req, res) => {
    try {
        res.render('dashBoard')
    } catch (error) {
        console.error('Error displaying admin dashboard:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

const logout = async (req, res) => {
    try {
        delete req.session.admin
        res.redirect('/admin/login')
    } catch (error) {
        console.log('An error Occured while passing Your request', error);
    }
};


const loadCustomer = async (req, res) => {
    try {
        const users = await user.find()
        res.render('customers', { users });
    } catch (error) {
        console.error('Error while Load, Admin Login Page ', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};


const blockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const blockUser = await user.findById(userId);

        if (!blockUser) {
            return res.redirect('/admin/customers');
        }

        blockUser.isBlocked = true;
        await blockUser.save();

        res.redirect('/admin/customers');

    } catch (error) {
        console.error('Error blocking blockUser:', error);
        res.redirect('/admin/customers');
    }
};

const unblockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const blockUser = await user.findById(userId);

        if (!blockUser) {
            return res.redirect('/admin/customers');
        }

        blockUser.isBlocked = false;
        await blockUser.save();

        res.redirect('/admin/customers');
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.redirect('/admin/customers');
    }
};



module.exports = {
    toLogin,
    checkAdmin,
    adminDashboard,
    logout,
    loadCustomer,
    blockUser,
    unblockUser

}