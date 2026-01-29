const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const User = require('./models/User');

const seedAttendance = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/hrms', { // Update DB Name if different
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const targetEmail = 'neelpatelnp.0402@gmail.com';

        // Find Specific Employee
        let employee = await User.findOne({ email: targetEmail });
        if (!employee) {
            console.log(`User ${targetEmail} not found! Creating...`);
            const newUser = new User({
                name: 'Neel Patel',
                email: targetEmail,
                password: 'Neel@123', // Updated to requested password
                role: 'Employee'
            });
            await newUser.save();
            employee = newUser;
        }

        console.log(`Seeding data for: ${employee.name} (${employee.email})`);

        // Clear existing attendance AND leaves for this month
        const Payroll = require('./models/Payroll'); // Add Payroll model

        // Clear existing attendance, leaves, AND Payroll for this user
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        await Attendance.deleteMany({
            user: employee._id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        await Leave.deleteMany({
            user: employee._id,
            startDate: { $gte: startOfMonth },
            endDate: { $lte: endOfMonth }
        });

        // CRITICAL: Delete old payroll to remove "33187" deduction history
        await Payroll.deleteMany({ user: employee._id });

        console.log('Cleared existing attendance, leaves, and payroll records.');

        let workingDays = [];
        for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
            const day = d.getDay();
            if (day !== 0 && day !== 6) { // Mon-Fri
                workingDays.push(new Date(d));
            }
        }

        console.log('Total Working Days:', workingDays.length);

        // Scenario: 1 Day Salary Deducted (requested explicitly)
        // User Request: "attendence days 19 and absent days 3 and deduct salry for day 1"
        // Total Working Days: ~22
        // Present: 19
        // Absent: 3
        // To get 1 Day Deduction (with NO grace period):
        // We need 2 Accounted/Approved Leaves.
        // Unaccounted = 3 - 2 = 1.

        const absentCount = 3;
        const daysToMark = workingDays.slice(0, workingDays.length - absentCount); // Should be ~19
        const absentDays = workingDays.slice(workingDays.length - absentCount);

        console.log(`Marking Present for ${daysToMark.length} days.`);
        console.log(`Leaving ${absentCount} days absent:`);
        absentDays.forEach(d => console.log(` - ${d.toDateString()}`));

        // 1. Mark Attendance
        const attendanceDocs = daysToMark.map(date => ({
            user: employee._id,
            date: date,
            status: 'Present',
            checkInTime: new Date(date.setHours(9, 0, 0)),
            checkOutTime: new Date(date.setHours(17, 0, 0))
        }));
        await Attendance.insertMany(attendanceDocs);

        // 2. Create Leaves
        // Leave 1: Approved Sick Leave (2 Days) -> Covers absentDays[0] and absentDays[1]
        // Leftover: absentDays[2] is unaccounted.
        if (absentDays.length >= 2) {
            await new Leave({
                user: employee._id,
                leaveType: 'Sick',
                startDate: absentDays[0],
                endDate: absentDays[1],
                reason: 'Seeded Approved Leave',
                status: 'Approved'
            }).save();
            console.log(`Created Approved Sick Leave for ${absentDays[0].toDateString()} - ${absentDays[1].toDateString()}`);
        }

        console.log('--- EXPECTED RESULT ---');
        console.log(`Present: ${daysToMark.length}`);
        console.log(`Total Absent (Gaps): ${absentCount}`);
        console.log(`Approved Sick Leaves: 2 Days`);
        console.log(`Unaccounted Absent: ${absentCount} - 2 = 1 Day`);
        console.log(`Chargeable Deduction: 1 Day`);
        console.log('-----------------------');
        console.log('Success! Data seeded.');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAttendance();
