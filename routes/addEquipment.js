const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware')
const EquipmentRental = require('../models/EquipmentRental');
const Farmreg = require('../models/Farmreg');
const router = express.Router();
const Offer = require('../models/Offer');
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
// Route to add equipment with image upload
router.post('/add', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        // Check if image file exists in the request
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded.' });
        }

        // Check if required fields are present
        console.log(req.user);
        const { name, description, price, rateType, condition, location, userName } = req.body;
        console.log(req.body);
        
        if (!name || !description || !price || !rateType || !condition || !location || !userName) {
            return res.status(400).json({ error: 'Please provide all required fields.' });
        }
        
        // Create a new EquipmentRental document
        const newEquipment = new EquipmentRental({
            name,
            description,
            imagePath: req.file.path, // Store image file path
            price,
            rateType,
            condition,
            location,
            userName,
            ownerId: req.user, // Retrieved from auth middleware
        });

        // Save the equipment to the database
        await newEquipment.save();
        res.status(201).json({ message: 'Equipment added successfully!' });
    } catch (error) {
        console.error('Error in /add route:', error); // Logs for easier debugging
        res.status(500).json({ error: 'Failed to add equipment' });
    }
});



// Route to fetch all equipment
router.get('/', authMiddleware, async (req, res) => {
    try {
        const equipmentList = await EquipmentRental.find({ ownerId: { $ne: req.user } }); // Exclude user's own items
        res.status(200).json(equipmentList);
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ error: 'Failed to fetch equipment' });
    }
});


// Route to fetch equipment uploaded by the logged-in user
router.get('/my-uploads', authMiddleware, async (req, res) => {
    try {
        const userId = req.user; // Get user ID from the authenticated request
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
        const deletedItem = await EquipmentRental.findOneAndDelete({ _id: equipmentId, ownerId: req.user });
        if (!deletedItem) return res.status(404).json({ message: 'Item not found or unauthorized' });

        res.status(200).json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        console.error('Error deleting equipment:', error);
        res.status(500).json({ error: 'Failed to delete equipment' });
    }
});

// Create an offer with notification
router.post('/offer/:equipmentId', authMiddleware, async (req, res) => {
    const { equipmentId } = req.params;
    const { rentalDays, message } = req.body;
    const renterId = req.user; // Get the user ID from the authenticated request

    try {
        // Find the equipment item by ID
        const equipment = await EquipmentRental.findById(equipmentId);
        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        // Create the new offer using the Offer model
        const newOffer = new Offer({
            renterId,
            rentalDays,
            message,
        });

        // Save the offer to the database
        await newOffer.save();

        // Add the offer ID to the equipment's offers array
        equipment.offers.push(newOffer._id);
        await equipment.save(); // Save the updated equipment document

        // Notify the equipment owner
        const ownerId = equipment.ownerId;
        const owner = await Farmreg.findById(ownerId);
        if (owner) {
            const notification = {
                message,
                equipmentId,
                offerId: newOffer._id, // This now references the new offer
                senderId: renterId,
            };
            owner.notifications.push(notification);
            await owner.save();
        }
        //notify the renter 
        const renter = await Farmreg.findById(renterId);
        if(renter) {
            const notification = {

                message:`Your have requested for ${equipment.name} from ${equipment.userName}`,
                equipmentId:equipmentId,
                offerId: newOffer._id
            }
            renter.notifications.push(notification); // push the notification to renter
            await renter.save();
        }

        res.status(201).json({ message: 'Offer created successfully' });
    } catch (error) {
        console.error("Error creating offer:", error); // Log error for debugging
        res.status(500).json({ message: 'Error creating offer', error });
    }
});





// Accept an offer
router.post('/accept-offer/:equipmentId/:offerId', authMiddleware, async (req, res) => {
    const { equipmentId, offerId } = req.params;

    try {
        const equipment = await EquipmentRental.findById(equipmentId);
        const offer = equipment.offers.id(offerId);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        offer.status = 'accepted';
        equipment.available = false; // Mark equipment as not available
        equipment.returnDate = new Date(Date.now() + offer.rentalDays * 24 * 60 * 60 * 1000); // Calculate return date

        await equipment.save();

        // Notify the renter
        const renter = await Farmreg.findById(offer.renterId);
        if (renter) {
            renter.notifications.push({
                message: `Your offer for ${equipment.name} has been accepted. Return by ${equipment.rentedUntil.toLocaleDateString()}.`,
                equipmentId,
                offerId,
            });
            await renter.save();
        }

        res.status(200).json({ message: 'Offer accepted' });
    } catch (error) {
        res.status(500).json({ message: 'Error accepting offer.', error });
    }
});


router.post('/reject-offer/:equipmentId/:offerId', authMiddleware, async (req, res) => {
    const { equipmentId, offerId } = req.params;

    try {
        const equipment = await EquipmentRental.findById(equipmentId);
        const offer = equipment.offers.id(offerId);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        offer.status = 'rejected';
        await equipment.save();

        // Notify the renter
        const renter = await Farmreg.findById(offer.renterId);
        if (renter) {
            renter.notifications.push({
                message: `Your offer for ${equipment.name} has been rejected.`,
                equipmentId,
                offerId,
            });
            await renter.save();
        }

        res.status(200).json({ message: 'Offer rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting offer.', error });
    }
});




module.exports = router;
