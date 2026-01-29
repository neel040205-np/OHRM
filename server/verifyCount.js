const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');

const verifyAttendance = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/hrms', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const employee = await User.findOne({ email: 'neelpatelnp.0402@gmail.com' });
        if (!employee) {
            console.log('Employee not found');
            process.exit();
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const count = await Attendance.countDocuments({
            user: employee._id,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            status: 'Present'
        });

        console.log(`User: ${employee.name}`);
        console.log(`Month Range: ${startOfMonth.toDateString()} to ${endOfMonth.toDateString()}`);
        console.log(`Actual Attendance Records in DB: ${count}`);

        const records = await Attendance.find({
            user: employee._id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        }).limit(5);

        console.log('Sample Records:', records.map(r => r.date.toDateString()));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyAttendance();
