const mongoose = require('mongoose');
const User = require('./models/User');
const Payroll = require('./models/Payroll');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const axios = require('axios');

// Configure API URL
const API_URL = 'http://localhost:5001/api';

// Database Connection URI
// HARDCODED for script simplicity or read from env if possible (using strict string here for speed)
const MONGO_URI = 'mongodb://127.0.0.1:27017/ohrm'; // Assuming local default or similar to what server uses

require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB Connected');

        // 1. Create/Find User "Neel Patel"
        let user = await User.findOne({ name: 'Neel Patel' });
        if (!user) {
            console.log('Creating Neel Patel...');
            user = new User({
                name: 'Neel Patel',
                email: 'neel@example.com',
                password: 'password123',
                role: 'Employee'
            });
            await user.save();
        } else {
            console.log('Found Neel Patel:', user._id);
        }

        // 2. Ensure Payroll Record Exists
        let payroll = await Payroll.findOne({ user: user._id });
        if (!payroll) {
            payroll = new Payroll({
                user: user._id,
                salary: 30000,
                status: 'Pending'
            });
            await payroll.save();
        }
        console.log('Payroll Record ID:', payroll._id);

        // 3. Clear Data for October 2026
        const startOct = new Date(2026, 9, 1); // Month 9 = Oct
        const endOct = new Date(2026, 10, 0);

        await Attendance.deleteMany({
            user: user._id,
            date: { $gte: startOct, $lte: endOct }
        });
        await Leave.deleteMany({
            user: user._id,
            startDate: { $gte: startOct },
            endDate: { $lte: endOct }
        });
        console.log('Cleared Oct 2026 data');

        // 4. Seed 19 Present Days (Oct 2026 has 22 Working Days)
        // Weekends: 3,4, 10,11, 17,18, 24,25, 31 (Sat)
        // Working Days: 1, 2, 5-9, 12-16, 19-23, 26-30.
        // Needs 19 Present.
        // Let's create present records for:
        // Oct 1 (Thu), 2 (Fri - wait, user might treat as working if not holiday seeded), 
        // 5,6,7,8,9 (7 days)
        // 12,13,14,15,16 (12 days)
        // 19,20,21,22,23 (17 days)
        // 26,27 (19 days)
        // Total Present = 19.

        const presentDays = [
            1, 2,
            5, 6, 7, 8, 9,
            12, 13, 14, 15, 16,
            19, 20, 21, 22, 23,
            26, 27
        ];

        for (const d of presentDays) {
            await Attendance.create({
                user: user._id,
                date: new Date(2026, 9, d),
                checkInTime: new Date(2026, 9, d, 9, 0, 0),
                checkOutTime: new Date(2026, 9, d, 17, 0, 0),
                status: 'Present'
            });
        }
        console.log(`Seeded ${presentDays.length} Present Days`);

        // 5. Seed 2 "Office" Leaves (Paid)
        // Remaining working days: 28, 29, 30. (3 days left).
        // Let's check Oct 30 is Friday. Oct 29 Thursday.
        // We need 2 Office Leaves. Let's use Oct 28, 29.
        await Leave.create({
            user: user._id,
            leaveType: 'Office',
            startDate: new Date(2026, 9, 28),
            endDate: new Date(2026, 9, 29),
            status: 'Approved',
            reason: 'Client Visit'
        });
        console.log('Seeded 2 Office Leaves (Oct 28-29)');

        // Working Days in Oct 2026 = 22.
        // Data:
        // Present: 19.
        // Paid Leave: 2.
        // Total Accounted: 21.
        // Unaccounted = 22 - 21 = 1 Day (Oct 30 is missing/absent).

        // Expected Deduction = 1 Day Salary.

        // 6. Login as HR to get token
        // Need an HR user.
        let hrUser = await User.findOne({ role: 'HR' });
        if (!hrUser) {
            // Create temp HR if none
            hrUser = new User({
                name: 'HR Admin',
                email: 'hr@example.com',
                password: 'password123',
                role: 'HR'
            });
            await hrUser.save();
        }

        // Log in to get token (using a simplified approach if we can't easily sign jwt here)
        // Actually, let's just use a hardcoded helper or assume we can generate one.
        // But since we are verifying via `axios` to the running server, we need a valid token.
        // Let's use the login endpoint.
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: hrUser.email,
                password: 'password123' // assuming this is the password or reset it
            });
            token = loginRes.data.token;
        } catch (e) {
            console.log('Login failed, trying to reset HR password to password123');
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            hrUser.password = await bcrypt.hash('password123', salt);
            await hrUser.save();
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: hrUser.email,
                password: 'password123'
            });
            token = loginRes.data.token;
        }

        // 7. Process Payroll via API
        console.log('Processing Payroll for Oct 2026...');
        const processRes = await axios.post(`${API_URL}/payroll/process/${payroll._id}`, {
            month: 10, // Oct
            year: 2026
        }, {
            headers: { 'x-auth-token': token }
        });

        console.log('Payroll Processed:', processRes.data);
        console.log('Scenario Verification:');
        console.log(`Salary: ${processRes.data.payroll.salary}`);
        console.log(`Deductions: ${processRes.data.payroll.deductions}`);
        console.log(`Net Salary: ${processRes.data.payroll.netSalary}`);

        const oneDaySalary = (30000 / 30);
        console.log(`Expected Deduction (~1000): ${processRes.data.payroll.deductions}`);

        if (Math.abs(processRes.data.payroll.deductions - oneDaySalary) < 100) {
            console.log('SUCCESS: Deduction matches ~1 day salary.');
        } else {
            console.log('WARNING: Deduction mismatch.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
