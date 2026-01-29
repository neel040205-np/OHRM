const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

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

        const userId = payroll.user;
        const previousMonthDate = new Date();
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

        // Define Month Start and End (For the current calculation, let's assume we are calculating for the current month or previous? Usually payroll is for past month. Let's use request body or default to current month for simplicity of testing).
        // Better: Use a query param or body for month. Default: Current Month.
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // 1. Fetch Attendance (Count Present Days)
        const attendanceRecords = await Attendance.find({
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            status: 'Present' // Assuming 'Present' counts as full day
        });
        const presentDays = attendanceRecords.length;

        // 2. Fetch Approved Leaves (Overlapping with this month)
        // Overlap Condition: StartDate <= EndOfMonth AND EndDate >= StartOfMonth
        const leaveRecords = await Leave.find({
            user: userId,
            status: 'Approved',
            startDate: { $lte: endOfMonth },
            endDate: { $gte: startOfMonth }
        });

        // Calculate total leave days taken by type
        let sickLeaves = 0;
        let casualLeaves = 0;
        let emergencyLeaves = 0;
        let otherLeaves = 0;

        leaveRecords.forEach(leave => {
            const s = new Date(leave.startDate);
            const e = new Date(leave.endDate);

            // Clamping dates to current month range
            const overlapStart = s > startOfMonth ? s : startOfMonth;
            const overlapEnd = e < endOfMonth ? e : endOfMonth;

            // Calculate days only within this month
            let days = 0;
            if (overlapEnd >= overlapStart) {
                days = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
            }

            if (leave.leaveType === 'Sick') sickLeaves += days;
            else if (leave.leaveType === 'Casual') casualLeaves += days;
            else if (leave.leaveType === 'Emergency') emergencyLeaves += days;
            else otherLeaves += days;
        });

        // 3. Define Quotas
        const MAX_SICK = 2;
        const MAX_CASUAL = 1;
        const MAX_EMERGENCY = 2; // Approved by HR usually
        const MAX_ALLOWED_LEAVES = 5; // Total max? The prompt says "he can have maximum 5 leaves".

        // Calculate Valid Leaves (Count towards "Present" for salary)
        // Note: Emergency and Casual are approved by HR, so if they are in 'Approved' state here, they are valid.
        // However, we must ensure they don't exceed limits.
        // If they exceed limits, they become 'Unpaid' or 'Deducted'.

        let validLeaves = 0;

        // Count valid sick leaves
        const validSick = Math.min(sickLeaves, MAX_SICK);

        // Count valid casual
        const validCasual = Math.min(casualLeaves, MAX_CASUAL);

        // Count valid emergency
        const validEmergency = Math.min(emergencyLeaves, MAX_EMERGENCY);

        // Sum valid specific leaves
        let totalValidSpecific = validSick + validCasual + validEmergency;

        // Check overall cap of 5
        if (totalValidSpecific > MAX_ALLOWED_LEAVES) {
            totalValidSpecific = MAX_ALLOWED_LEAVES;
        }

        validLeaves = totalValidSpecific;

        // 4. Calculate Absences
        // Calculate Total Working Days in Month (excluding weekends possibly? Prompt says "monday to friday". Assuming 5 day work week).
        let workingDays = 0;
        for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
            const day = d.getDay();
            if (day !== 0 && day !== 6) { // 0 Sun, 6 Sat
                workingDays++;
            }
        }

        // Unaccounted Absences = Working Days - (Present + Valid Leaves)
        // Note: If user didn't mark attendance and didn't apply for leave, it's Absent.
        // Also if user took 'Other' leave or exceeded quotas, those are effectively Absent/Unpaid.

        let chargeableAbsences = workingDays - (presentDays + validLeaves);
        if (chargeableAbsences < 0) chargeableAbsences = 0; // Should not happen

        // 5. Apply Grace Period - REMOVED per user request (User wants 1 absent day = 1 day salary cut immediately)
        // if (chargeableAbsences > 0) {
        //     chargeableAbsences = chargeableAbsences - 1;
        // }

        // 6. Calculate Deduction
        let deduction = 0;
        const baseSalary = payroll.salary;
        const dailySalary = baseSalary / 30; // Prompt: "total salary/30"

        if (chargeableAbsences > 0) {
            // Day 1 Deduction
            deduction += dailySalary;

            // Remaining Days Deduction
            if (chargeableAbsences > 1) {
                const remainingDays = chargeableAbsences - 1;
                // User Formula for Day 2+: (salary/30) * 5% (Interpret as: Daily Salary + 5% Surcharge on Daily)
                // or just the surcharge? Context "deduction should be..." implies the total deduction.
                // Assuming "Heavy Penalty" logic is relaxing to "Daily + 5% of Daily".
                const penaltyPerDay = dailySalary + (dailySalary * 0.05);
                deduction += remainingDays * penaltyPerDay;
            }
        }

        // 7. Update Net Salary
        // Ensure deduction doesn't exceed salary? (Optional check)
        const netSalary = Math.max(0, baseSalary - deduction);

        payroll.status = 'Processed';
        payroll.lastProcessed = Date.now();
        payroll.deductions = Math.round(deduction);
        payroll.netSalary = Math.round(netSalary);
        payroll.attendanceDays = presentDays;
        payroll.payMonth = `${now.getMonth() + 1}-${now.getFullYear()}`; // e.g. "1-2026"

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

// Reset Payment Status (HR)
router.post('/reset/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'HR') {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        let payroll = await Payroll.findById(req.params.id);
        if (!payroll) return res.status(404).json({ msg: 'Record not found' });

        payroll.status = 'Pending';
        payroll.deductions = 0;
        payroll.netSalary = 0;
        payroll.attendanceDays = 0;
        payroll.lastProcessed = null;

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
