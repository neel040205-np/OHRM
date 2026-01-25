const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notice = require('../models/Notice');

// Add Notice (HR Only)
router.post('/add', auth, async (req, res) => {
    try {
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        const { title, description, image } = req.body;
        const newNotice = new Notice({
            title,
            description,
            image,
            postedBy: req.user.id
        });
        const notice = await newNotice.save();
        res.json(notice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get All Notices (Public to authenticated users)
router.get('/all', auth, async (req, res) => {
    try {
        const notices = await Notice.find().sort({ date: -1 }).populate('postedBy', 'name');
        res.json(notices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete Notice (HR Only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        await Notice.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Notice removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
