const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware')
const EquipmentRental = require('../models/EquipmentRental');
const router = express.Router();

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files to an "uploads" directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Name file with timestamp
    },
});

// Multer middleware
const upload = multer({ storage: storage });

// Route to add equipment with image upload
router.post('/add', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded.' });
        }
        const newEquipment = new EquipmentRental({
            name: req.body.name,
            description: req.body.description,
            imagePath: req.file.path,
            price: req.body.price,
            rateType:req.body.rateType,
            condition:req.body.condition,
            ownerId: req.user.id, // Save the user ID from the decoded token
        });
        await newEquipment.save();
        res.status(201).json({ message: 'Equipment added successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add equipment' });
    }
});


// Route to fetch all equipment
router.get('/', authMiddleware, async (req, res) => {
    try {
        const equipmentList = await EquipmentRental.find({ ownerId: { $ne: req.user.id } }); // Exclude user's own items
        res.status(200).json(equipmentList);
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ error: 'Failed to fetch equipment' });
    }
});

// routes/equipment.js
router.post('/negotiate', authMiddleware, async (req, res) => {
    const { equipmentId, offerPrice, rentalDays, message } = req.body;

    try {
        const equipment = await EquipmentRental.findById(equipmentId);
        if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

        // Create new negotiation entry
        const negotiation = {
            renterId: req.user._id,
            offerPrice,
            rentalDays,
            message,
            status: 'pending',
        };
        equipment.negotiations.push(negotiation); // Add negotiation to the array

        await equipment.save();
        res.status(200).json({ message: 'Negotiation offer sent!' });
    } catch (error) {
        console.error("Error in negotiation route:", error);
        res.status(500).json({ error: 'Failed to initiate negotiation' });
    }
});

// Route to fetch equipment uploaded by the logged-in user
router.get('/my-uploads', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from the authenticated request
        const myEquipment = await EquipmentRental.find({ ownerId: userId });
        res.status(200).json(myEquipment);
    } catch (error) {
        console.error('Error fetching user uploads:', error);
        res.status(500).json({ error: 'Failed to fetch user uploads' });
    }
});

// Route to delete an equipment item
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const equipmentId = req.params.id;
        const deletedItem = await EquipmentRental.findOneAndDelete({ _id: equipmentId, ownerId: req.user.id });
        if (!deletedItem) return res.status(404).json({ message: 'Item not found or unauthorized' });

        res.status(200).json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        console.error('Error deleting equipment:', error);
        res.status(500).json({ error: 'Failed to delete equipment' });
    }
});



module.exports = router;
