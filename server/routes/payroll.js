const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Payroll = require('../models/Payroll');
const User = require('../models/User');

// Get All Payrolls (HR) - Auto creates if missing
router.get('/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const employees = await User.find({ role: 'Employee' });

        // Ensure payroll record exists for each employee
        for (let emp of employees) {
            let payroll = await Payroll.findOne({ user: emp._id });
            if (!payroll) {
                payroll = new Payroll({ user: emp._id });
                await payroll.save();
            }
        }

        const payrolls = await Payroll.find().populate('user', ['name', 'email']);
        res.json(payrolls);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Process Payment (HR)
router.post('/process/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        let payroll = await Payroll.findById(req.params.id);
        if (!payroll) return res.status(404).json({ msg: 'Record not found' });

        payroll.status = 'Processed';
        payroll.lastProcessed = Date.now();

        await payroll.save();
        res.json(payroll);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Salary (HR)
router.put('/update-salary/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const { salary } = req.body;
        let payroll = await Payroll.findById(req.params.id);
        if (!payroll) return res.status(404).json({ msg: 'Record not found' });

        payroll.salary = salary;
        await payroll.save();
        res.json(payroll);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get My Status (Employee)
router.get('/my-status', auth, async (req, res) => {
    try {
        let payroll = await Payroll.findOne({ user: req.user.id });
        if (!payroll) {
            // Create if not exists (though HR view usually creates it)
            payroll = new Payroll({ user: req.user.id });
            await payroll.save();
        }
        res.json(payroll);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
