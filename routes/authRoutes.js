const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware')
const Farmreg = require('../models/Farmreg');
// Signup route
router.post('/signup', authController.signup);

// Login route
router.post('/login', authController.login);

 //Get the logged-in user's profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        // Find the user based on the ID from the auth token
        const user = await Farmreg.findById(req.user);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Respond with the user's name and email
        res.json({
            name: user.name
        });
    } catch (error) {
        console.error("Error retrieving user profile:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
