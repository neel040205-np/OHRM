const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');

// Mark Attendance (Check-in / Check-out)
router.post('/mark', auth, async (req, res) => {
    try {
        const { type } = req.body; // 'check-in' or 'check-out'
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({
            user: req.user.id,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        });

        if (type === 'check-in') {
            if (attendance) {
                return res.status(400).json({ msg: 'Already checked in today' });
            }
            attendance = new Attendance({
                user: req.user.id,
                date: new Date(),
                checkInTime: new Date()
            });
            await attendance.save();
        } else if (type === 'check-out') {
            if (!attendance) {
                return res.status(400).json({ msg: 'Have not checked in yet' });
            }
            attendance.checkOutTime = new Date();
            await attendance.save();
        } else {
            return res.status(400).json({ msg: 'Invalid type' });
        }

        res.json(attendance);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get My Attendance
router.get('/my-attendance', auth, async (req, res) => {
    try {
        const attendance = await Attendance.find({ user: req.user.id }).sort({ date: -1 });
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get All Attendance (HR)
router.get('/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        const attendance = await Attendance.find().populate('user', ['name', 'email']).sort({ date: -1 });
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
