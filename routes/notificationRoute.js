
const express = require('express');
const router = express.Router();
const Farmreg = require('../models/Farmreg');
const EquipmentRental = require('../models/EquipmentRental');
const authMiddleware = require('../middlewares/authMiddleware');

// Route to fetch categorized notifications
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const userId = req.user;

        // Find all notifications for the logged-in user
        const user = await Farmreg.findById(userId).populate({
            path: 'notifications.offerId',
            populate: { path: 'equipmentId', model: 'EquipmentRental' },
        });

        // Separate notifications into "Our Offers" and "Our Requests"
        const ourOffers = user.notifications.filter(notification =>
            notification.equipmentId.ownerId.toString() === userId.toString()
        );

        const ourRequests = user.notifications.filter(notification =>
            notification.senderId.toString() === userId.toString()
        );

        res.status(200).json({ ourOffers, ourRequests });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.delete('/notifications/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user;
        const notificationId = req.params.id;

        // Find the user and delete the specific notification
        const user = await Farmreg.findById(userId);
        user.notifications = user.notifications.filter(notification =>
            notification._id.toString() !== notificationId
        );
        await user.save();

        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});


module.exports = router;
