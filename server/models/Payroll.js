const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    salary: {
        type: Number,
        default: 50000
    },
    status: {
        type: String,
        enum: ['Pending', 'Processed'],
        default: 'Pending'
    },
    lastProcessed: {
        type: Date
    }
});

module.exports = mongoose.model('Payroll', PayrollSchema);
