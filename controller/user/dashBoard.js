const mongoose = require('mongoose');
const User = require('../../model/user/userModel');
const Product = require('../../model/admin/productModel');
const Address = require('../../model/user/userAddress');
const bcrypt = require('bcrypt');





const loadDashboard = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found')
        }
        res.render('dashBoard', {
            userData: user
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Internal server error');
    }
};

const loadAddressPage = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const user = await User.findById(userId);
        const address = await Address.find({ userId })

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('address', {
            userData: user,
            address
        });
    } catch (error) {
        console.error('Error loading address page:', error);
        res.status(500).send('Internal server error');
    }
};

const addAddress = async (req, res) => {
    try {
        const { first_name, last_name, address, city, state, postal_code, phone } = req.body;

        if (!first_name || !last_name || !address || !city || !postal_code || !state) {

            return res.status(400).json({ error: 'Missing Required Fields' });
        }
        const existingAddress = await Address.findOne({
            address: address
        });

        if (existingAddress) {

            return res.status(400).json({ error: 'Address already exists and cannot be used' });
        }


        const newAddress = {
            firstName: first_name,
            lastName: last_name,
            address,
            city,
            state,
            postal_code,
            phone,
            userId: req.session.userSession
        };

        // Save new address
        const savedAddress = await Address.create(newAddress);

        res.status(201).json({ message: 'Address saved successfully', address: savedAddress });
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getAddress = async (req, res) => {
    try {

        const addresses = await Address.find({ userId: req.session.userSession });

        if (addresses.length === 0) {
            return res.status(200).json({ message: 'No Address Available' });
        }

        res.status(200).json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const editAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, address, city, state, postal_code, phone } = req.body;


        if (!firstName || !lastName || !address || !city || !postal_code || !state) {
            return res.status(400).json({ error: 'Missing Required Fields' });
        }


        const updatedAddress = await Address.findByIdAndUpdate(
            id,
            { firstName: firstName, lastName: lastName, address, city, state, postal_code, phone },
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json({ success: true, message: 'Address updated successfully', address: updatedAddress });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedAddress = await Address.findByIdAndDelete(id);

        if (!deletedAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const loadAccount = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const user = await User.findById(userId);
        res.render('account', { userData: user });
    } catch (error) {
        console.error('Error load account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const updateUserData = async (req, res) => {
    try {
        const userId = req.session.userSession;  // Retrieve user ID from session
        const { name, currentPassword, newPassword, confirmPassword } = req.body;  // Destructure request body

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Verify the current password
        try {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.json({ success: false, message: 'Current password is incorrect' });
            }
        } catch (bcryptError) {
            console.error('bcrypt.compare error:', bcryptError);
            return res.json({ success: false, message: 'Error verifying password' });
        }

        // Check if new password is provided and meets length requirement
        if (newPassword) {
            if (newPassword.length < 8) {
                return res.json({ success: false, message: 'New password must be at least 8 characters long' });
            }

            // Ensure new password and confirm password match
            if (newPassword !== confirmPassword) {
                return res.json({ success: false, message: 'New passwords do not match' });
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update the password and name
            await User.findByIdAndUpdate(userId, {
                firstName: name,  // Update the name
                password: hashedPassword  // Update the hashed password
            });
        } else {
            // Only update the name if no new password is provided
            await User.findByIdAndUpdate(userId, {
                firstName: name  // Update the name
            });
        }

        res.json({ success: true, message: 'User information updated successfully' });
    } catch (error) {
        console.error('Error updating account details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



module.exports = {
    loadDashboard,
    loadAddressPage,
    addAddress,
    getAddress,
    editAddress,
    deleteAddress,
    loadAccount,
    updateUserData
}