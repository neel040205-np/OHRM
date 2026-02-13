const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Holiday = require('../models/Holiday');

// Get all holidays
router.get('/', auth, async (req, res) => {
    try {
        const query = {};
        console.log('Query Params:', req.query);
        if (req.query.upcoming === 'true') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query.date = { $gte: today };
            console.log('Filtering for date >=', today);
        }

        const holidays = await Holiday.find(query).sort({ date: 1 });
        console.log('Found holidays:', holidays.length);
        res.json(holidays);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add a holiday (HR only)
router.post('/add', auth, async (req, res) => {
    try {
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const { date, name, description } = req.body;
        const holidayDate = new Date(date);
        const year = holidayDate.getFullYear();

        let holiday = await Holiday.findOne({ date: holidayDate });
        if (holiday) {
            return res.status(400).json({ msg: 'Holiday already exists on this date' });
        }

        holiday = new Holiday({
            date: holidayDate,
            name,
            year,
            description
        });

        await holiday.save();
        res.json(holiday);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Seed Holidays (For initial setup/testing)
router.post('/seed', async (req, res) => {
    try {
        // Clear existing for the year if needed or just add if missing
        // For simplicity, let's just add the requested ones if they don't exist
        const holidaysToSeed = [
            { date: '2026-01-14', name: 'Makar Sankranti', year: 2026 },
            { date: '2026-01-26', name: 'Republic Day', year: 2026 }
        ];

        const created = [];
        for (const h of holidaysToSeed) {
            let exists = await Holiday.findOne({ date: new Date(h.date) });
            if (!exists) {
                const newHoliday = new Holiday({
                    date: new Date(h.date),
                    name: h.name,
                    year: h.year
                });
                await newHoliday.save();
                created.push(newHoliday);
            }
        }

        res.json({ msg: 'Seeded holidays', created });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a holiday (HR only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Holiday.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Holiday removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
