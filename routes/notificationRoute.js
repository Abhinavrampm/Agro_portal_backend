const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Farmreg = require('../models/Farmreg');

// Get notifications for the logged-in user
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const user = await Farmreg.findById(req.user).populate('notifications.senderId', 'name');
        res.status(200).json(user.notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
});

module.exports = router;