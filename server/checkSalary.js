const mongoose = require('mongoose');
const Payroll = require('./models/Payroll');
const User = require('./models/User');

const checkSalary = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/hrms', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const employee = await User.findOne({ email: 'neelpatelnp.0402@gmail.com' });
        const payroll = await Payroll.findOne({ user: employee._id });

        console.log(`User: ${employee.name}`);
        console.log(`Current Base Salary: ${payroll ? payroll.salary : 'No Record'}`);
        console.log(`Current Stored Attendance: ${payroll ? payroll.attendanceDays : 'No Record'}`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkSalary();
