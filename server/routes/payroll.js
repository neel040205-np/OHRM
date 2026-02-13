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

        // Use current date to determine the month to process (or pass via body)
        // For simplicity, defaulting to current month logic as before, but improved
        let now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth(); // 0-indexed

        if (req.body.year && req.body.month) {
            year = parseInt(req.body.year);
            month = parseInt(req.body.month) - 1;
        }

        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0); // Last day of month

        // 1. Calculate Total Days in Month
        const totalDaysInMonth = endOfMonth.getDate();

        // 2. Calculate Weekends (Saturdays and Sundays)
        let weekends = 0;
        for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
            const day = d.getDay();
            if (day === 0 || day === 6) { // 0 Sun, 6 Sat
                weekends++;
            }
        }

        // 3. Fetch Holidays for this month
        const Holiday = require('../models/Holiday');
        const holidays = await Holiday.find({
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Filter out holidays that fall on weekends to avoid double counting
        let effectiveHolidays = 0;
        holidays.forEach(h => {
            const day = new Date(h.date).getDay();
            if (day !== 0 && day !== 6) {
                effectiveHolidays++;
            }
        });

        // 4. Calculate Working Days
        const workingDays = totalDaysInMonth - weekends - effectiveHolidays;

        // 5. Fetch Attendance (Present Days)
        const attendanceRecords = await Attendance.find({
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $in: ['Present', 'Half-day'] } // Considering Half-day
        });

        // Calculate Present Days (Half-day counts as 0.5? or 1? Let's assume 1 for now or 0.5 if strict)
        // User didn't specify Half-day logic, so assuming Present count.
        let presentDays = 0;
        attendanceRecords.forEach(att => {
            if (att.status === 'Half-day') presentDays += 0.5;
            else presentDays += 1;
        });

        // 6. Fetch Approved Leaves
        const leaveRecords = await Leave.find({
            user: userId,
            status: 'Approved',
            startDate: { $lte: endOfMonth },
            endDate: { $gte: startOfMonth }
        });

        let paidLeafDays = 0; // Medical, Office (fully paid)
        let otherLeafDays = 0; // Casual, Emergency, Other (subject to deduction or quota)

        leaveRecords.forEach(leave => {
            const s = new Date(leave.startDate);
            const e = new Date(leave.endDate);

            // Interface with month boundaries
            const overlapStart = s > startOfMonth ? s : startOfMonth;
            const overlapEnd = e < endOfMonth ? e : endOfMonth;

            // Iterate days to check if they are working days (skip weekends/holidays)
            // Leaves usually span consecutive days including weekends, but for PAYROLL, 
            // we usually care if they missed a WORKING day.
            // If I take leave Mon-Sun (7 days), and Sat/Sun are off, I missed 5 working days.

            for (let d = new Date(overlapStart); d <= overlapEnd; d.setDate(d.getDate() + 1)) {
                const day = d.getDay();
                // Check if it's a weekend
                if (day === 0 || day === 6) continue;

                // Check if it's a holiday
                const isHoliday = holidays.some(h => {
                    const hDate = new Date(h.date);
                    return hDate.getDate() === d.getDate() && hDate.getMonth() === d.getMonth();
                });
                if (isHoliday) continue;

                // If it is a working day, count it as a leave day
                if (leave.leaveType === 'Sick' || leave.leaveType === 'Office') {
                    // Medical (Sick) or Office -> Paid
                    paidLeafDays++;
                } else {
                    // Casual, Emergency, Other, Vacation -> Potential Deduction
                    otherLeafDays++;
                }
            }
        });

        // 7. Calculate Chargeable Absences
        // A user is expected to be present on 'workingDays'.
        // They were present for 'presentDays'.
        // They had 'paidLeafDays' (credited as present).
        // They had 'otherLeafDays'.

        // Quota Logic: "if he gets any extra leaves then salary should be deducted"
        // Interpretation: 
        // Medical/Office = Unlimited Paid (within reason, logic says "salary should not be deducted")
        // Others = User didn't specify a FREE quota in this specific prompt, but in previous code there was MAX_SICK, MAX_CASUAL.
        // The prompt says "if he gets any extra leaves". This implies there might be a quota. 
        // However, to strictly follow "extras... deducted on salary/30", and lacking specific quota numbers in this prompt:
        // I will assume ALL "other" leaves are "extra" if strictly following "working days - present". 
        // OR better: I will assume a standard small quota (e.g., 1 Casual) fits "extra".
        // BUT, given the strict "salary/30" instruction for "extra", let's assume valid paid leaves are ONLY Medical/Office/Approved-Quota.

        // Let's bring back the quotas for "Other" types if we want to be generous, 
        // OR simply treat Medical/Office as the ONLY free ones if we want to be strict to the "extra" wording.
        // Let's assume standard Quota for Casual is 1, Emergency 2. Excess is deducted.

        const MAX_CASUAL_ALLOWED = 1;
        const MAX_EMERGENCY_ALLOWED = 0; // Let's simplify: Only Medical/Office are fully safe?
        // Actually, the user said "if he is given medical leaves or office leaves... salary should not be deducted but if he gets any extra leaves then salary should be deducted".
        // This phrasing suggests ONLY Medical/Office are safe. "Extra" likely refers to anything else (Casual/Vacation/etc).
        // So I will count ALL 'otherLeafDays' as 'extra' unless I want to be nice. 
        // Lets be safe: Medical/Office = Safe. Others = Deducted (Paid Quota = 0 for them).

        // Days Accounted For = Present + Paid Leaves (Medical/Office)

        // Unaccounted Days = Working Days - (Present + Paid Leaves)
        // These unaccounted days include "Other Leaves" and "Unexplained Absences".

        let chargeableDays = workingDays - (presentDays + paidLeafDays);

        // Now, 'chargeableDays' should theoretically equal 'otherLeafDays' + 'AbsentWithoutLeave'.
        // If chargeableDays < 0, it means they worked extra or data issue.
        if (chargeableDays < 0) chargeableDays = 0;

        // 8. Calculate Deduction
        const baseSalary = payroll.salary;
        const dailySalary = baseSalary / 30; // "salary/30 format"

        const deduction = chargeableDays * dailySalary;
        const netSalary = Math.max(0, baseSalary - deduction);

        payroll.status = 'Processed';
        payroll.lastProcessed = Date.now();
        payroll.deductions = Math.round(deduction);
        payroll.netSalary = Math.round(netSalary);
        payroll.attendanceDays = presentDays; // Actual physical presence
        payroll.payMonth = `${month + 1}-${year}`;

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
            // Create pending if not exists
            payroll = new Payroll({ user: req.user.id });
            await payroll.save();
        }

        await payroll.populate('user', ['name', 'email', 'role']);
        res.json(payroll);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
