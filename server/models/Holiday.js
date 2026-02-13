const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true // Prevent duplicate holidays on same date
    },
    name: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Holiday', HolidaySchema);
