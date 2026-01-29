const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Payroll = require('./models/Payroll');

const cleanupUser = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/hrms', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const targetEmail = 'neelpatelnp.0402@gmail.com';
        const user = await User.findOne({ email: targetEmail });

        if (!user) {
            console.log(`User ${targetEmail} not found.`);
            process.exit();
        }

        console.log(`Deleting data for: ${user.name} (${user.email})`);

        // Delete related data first
        const attendanceResult = await Attendance.deleteMany({ user: user._id });
        console.log(`Deleted ${attendanceResult.deletedCount} attendance records.`);

        const leaveResult = await Leave.deleteMany({ user: user._id });
        console.log(`Deleted ${leaveResult.deletedCount} leave records.`);

        const payrollResult = await Payroll.deleteMany({ user: user._id });
        console.log(`Deleted ${payrollResult.deletedCount} payroll records.`);

        // Delete user
        await User.findByIdAndDelete(user._id);
        console.log('User deleted successfully.');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanupUser();
