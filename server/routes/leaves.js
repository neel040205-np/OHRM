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

        // Validation: Max 5 leaves per month logic (Robust for cross-month)
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            return res.status(400).json({ msg: 'End date must be after start date' });
        }

        // Helper to check quota for specific months involved in this request
        // We will build a map of { 'Month-Year': count } for the requested leave
        const requestedPerMonth = {};

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = `${d.getMonth()}-${d.getFullYear()}`;
            requestedPerMonth[key] = (requestedPerMonth[key] || 0) + 1;
        }

        // For each month involved, check existing leaves + requested
        for (const [key, count] of Object.entries(requestedPerMonth)) {
            const [month, year] = key.split('-').map(Number);
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);

            // Find existing leaves overlapping this month
            // Valid overlap: Start <= EndOfMonth AND End >= StartOfMonth
            const existingLeaves = await Leave.find({
                user: req.user.id,
                startDate: { $lte: endOfMonth },
                endDate: { $gte: startOfMonth },
                status: { $ne: 'Rejected' },
                _id: { $ne: req.params.id } // Exclude current if editing (not applicable here but good practice)
            });

            let takenInThisMonth = 0;
            existingLeaves.forEach(l => {
                // Calculate days falling strictly within this month
                const s = new Date(l.startDate);
                const e = new Date(l.endDate);

                const overlapStart = s > startOfMonth ? s : startOfMonth;
                const overlapEnd = e < endOfMonth ? e : endOfMonth;

                if (overlapEnd >= overlapStart) {
                    const days = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
                    takenInThisMonth += days;
                }
            });

            if (takenInThisMonth + count > 5) {
                return res.status(400).json({ msg: `Cannot apply: You exceed the 5-leave limit for ${startOfMonth.toLocaleString('default', { month: 'long' })}.` });
            }
        }

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
