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
    },
    payMonth: {
        type: String // e.g., "01-2026"
    },
    deductions: {
        type: Number,
        default: 0
    },
    netSalary: {
        type: Number,
        default: 0
    },
    attendanceDays: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Payroll', PayrollSchema);
