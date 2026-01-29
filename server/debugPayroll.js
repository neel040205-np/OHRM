const mongoose = require('mongoose');
const User = require('./models/User');
const Payroll = require('./models/Payroll');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');

const debugPayroll = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/hrms', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // 1. List All Users and Payrolls
        const payrolls = await Payroll.find().populate('user');
        console.log(`Found ${payrolls.length} payroll records.`);

        for (const p of payrolls) {
            if (!p.user) continue;
            console.log(`\nUser: ${p.user.name} (${p.user.email})`);
            console.log(`  stored Salary: ${p.salary}`);
            console.log(`  stored Deductions: ${p.deductions}`);
            console.log(`  stored Net: ${p.netSalary}`);
            console.log(`  Status: ${p.status}`);

            // Calculate fresh to see what it SHOULD be
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const attendanceCount = await Attendance.countDocuments({
                user: p.user._id,
                date: { $gte: startOfMonth, $lte: endOfMonth },
                status: 'Present'
            });

            // Count Leaves
            const leaves = await Leave.find({
                user: p.user._id,
                status: 'Approved',
                startDate: { $lte: endOfMonth },
                endDate: { $gte: startOfMonth }
            });
            let leaveDays = 0;
            leaves.forEach(l => {
                const s = new Date(l.startDate);
                const e = new Date(l.endDate);
                const overlapStart = s > startOfMonth ? s : startOfMonth;
                const overlapEnd = e < endOfMonth ? e : endOfMonth;
                if (overlapEnd >= overlapStart) {
                    leaveDays += (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
                }
            });

            // Working Days
            let workingDays = 0;
            for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
                if (d.getDay() !== 0 && d.getDay() !== 6) workingDays++;
            }

            const accounted = attendanceCount + leaveDays;
            const unaccounted = workingDays - accounted;

            const dailySalary = p.salary / 30;
            let expectedDeduction = 0;
            if (unaccounted > 0) {
                expectedDeduction += dailySalary;
                if (unaccounted > 1) {
                    const remaining = unaccounted - 1;
                    const penalty = dailySalary + (dailySalary * 0.05);
                    expectedDeduction += remaining * penalty;
                }
            }

            console.log(`  > Present: ${attendanceCount}, Leaves: ${leaveDays}, Working: ${workingDays}`);
            console.log(`  > Unaccounted: ${unaccounted.toFixed(2)}`);
            console.log(`  > EXPECTED Deduction: ${Math.round(expectedDeduction)}`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugPayroll();
