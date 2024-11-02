// models/EquipmentRental.js
const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema({
    renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmreg', required: true }, // Refers to the user negotiating
    offerPrice: { type: Number, required: true },
    rentalDays: { type: Number, required: true }, // Number of days/weeks for rental
    message: { type: String, required: true },
    status: { type: String, default: 'pending' }, // Status of negotiation (e.g., 'accepted', 'rejected', 'pending')
    createdAt: { type: Date, default: Date.now },
});

const equipmentRentalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    imagePath: {
        type: String,
        required: true,  // Stores the path where the image is saved
    },
    price: {
        type: Number,
        required: true,
    },
    rateType: {
        type: String,
        enum: ['day', 'week'],
        required: true,
    },
    condition: { 
        type: String, 
        enum: ['New', 'Good', 'Fair', 'Poor'], 
        required: true 
    },
    available: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmreg', required: true }, // Reference to the uploader
    negotiations: [negotiationSchema], // Array of negotiation records
});

const EquipmentRental = mongoose.model('EquipmentRental', equipmentRentalSchema);
module.exports = EquipmentRental;
