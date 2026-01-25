const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Check creating this middleware
const Leave = require('../models/Leave');
const User = require('../models/User');

// Middleware to verify token (Will create this shortly if not exists - assuming standard JWT verify)
// Actually I need to create the auth middleware first or define it here.
// I'll create a dedicated middleware file in next step.

// Apply for Leave (Employee)
router.post('/apply', auth, async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;
        const newLeave = new Leave({
            user: req.user.id,
            leaveType,
            startDate,
            endDate,
            reason
        });
        const leave = await newLeave.save();
        res.json(leave);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get My Leaves (Employee)
router.get('/my-leaves', auth, async (req, res) => {
    try {
        const leaves = await Leave.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get All Leaves (HR)
router.get('/all', auth, async (req, res) => {
    try {
        // Check if HR
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        const leaves = await Leave.find().populate('user', ['name', 'email']);
        res.json(leaves);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Leave Status (HR)
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        const { status, adminRemark } = req.body; // [MODIFIED] Destructuring: Read 'status' AND 'adminRemark' from request
        let leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ msg: 'Leave not found' });

        leave.status = status;
        // [MODIFIED] If an adminRemark was provided, update it in the database
        if (adminRemark) leave.adminRemark = adminRemark;
        await leave.save();
        res.json(leave);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
