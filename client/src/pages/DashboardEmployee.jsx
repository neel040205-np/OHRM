import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import ImageModal from '../components/ImageModal';
import Payslip from '../components/Payslip'; // Import Payslip

const DashboardEmployee = () => {
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [notices, setNotices] = useState([]);
    const [payroll, setPayroll] = useState(null); // New State
    const [leaveData, setLeaveData] = useState({
        leaveType: 'Sick',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [message, setMessage] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [leavesTakenThisMonth, setLeavesTakenThisMonth] = useState(0);
    const [holidays, setHolidays] = useState([]);
    const [showPayslip, setShowPayslip] = useState(false); // State for Payslip Modal

    const MAX_LEAVES_PER_MONTH = 5;

    useEffect(() => {
        fetchAttendance();
        fetchLeaves();
        fetchNotices();
        fetchPayrollStatus(); // New Call
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/api/holidays?upcoming=true`, {
                headers: { 'x-auth-token': token }
            });
            setHolidays(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPayrollStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/api/payroll/my-status`, {
                headers: { 'x-auth-token': token }
            });
            setPayroll(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchNotices = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/api/notices/all`, {
                headers: { 'x-auth-token': token }
            });
            setNotices(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/api/attendance/my-attendance`, {
                headers: { 'x-auth-token': token }
            });
            setAttendance(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLeaves = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/api/leaves/my-leaves`, {
                headers: { 'x-auth-token': token }
            });
            setLeaves(res.data);
            calculateMonthlyLeaves(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const calculateMonthlyLeaves = (leaveList) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        let total = 0;
        leaveList.forEach(leave => {
            // Only count Non-Rejected leaves
            if (leave.status !== 'Rejected') {
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);

                // Calculate overlap with current month
                const overlapStart = start > startOfMonth ? start : startOfMonth;
                const overlapEnd = end < endOfMonth ? end : endOfMonth;

                if (overlapEnd >= overlapStart) {
                    const days = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
                    total += days;
                }
            }
        });
        setLeavesTakenThisMonth(total);
    };

    const markAttendance = async (type) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${config.API_URL}/api/attendance/mark`, { type }, {
                headers: { 'x-auth-token': token }
            });
            setMessage(`Successfully Marked ${type}`);
            fetchAttendance();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Error marking attendance');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const submitLeave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${config.API_URL}/api/leaves/apply`, leaveData, {
                headers: { 'x-auth-token': token }
            });
            setMessage('Leave Applied Successfully');
            fetchLeaves();
            setLeaveData({ leaveType: 'Sick', startDate: '', endDate: '', reason: '' }); // Reset form
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error applying for leave');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const openModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-100 pb-10">
            <nav className="bg-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex justify-between">
                        <div className="flex space-x-7">
                            <div>
                                <a href="#" className="flex items-center space-x-3 py-4 px-2">
                                    <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
                                    <span className="font-semibold text-gray-600 text-lg">Employee Portal</span>
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={logout} className="py-2 px-2 font-medium text-gray-500 rounded hover:bg-red-500 hover:text-white transition duration-300">Log Out</button>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="max-w-6xl mx-auto mt-10 px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome Employee</h1>

                {message && <div className="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3 mb-6" role="alert">{message}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Attendance Section */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
                        <div className="flex space-x-4 mb-4">
                            <button onClick={() => markAttendance('check-in')} className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600">Check In</button>
                            <button onClick={() => markAttendance('check-out')} className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600">Check Out</button>
                        </div>
                        <h3 className="font-semibold mb-2">Recent Attendance</h3>
                        <div className="overflow-y-auto h-40">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr>
                                        <th className="text-left">Date</th>
                                        <th className="text-left">In</th>
                                        <th className="text-left">Out</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map((att) => (
                                        <tr key={att._id} className="border-b">
                                            <td>{new Date(att.date).toLocaleDateString()}</td>
                                            <td>{new Date(att.checkInTime).toLocaleTimeString()}</td>
                                            <td>{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Leave Request Section */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>

                        {leavesTakenThisMonth >= MAX_LEAVES_PER_MONTH && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                                <p className="font-bold">Leave Limit Reached</p>
                                <p>You have already applied for {Math.round(leavesTakenThisMonth)} days of leave this month. You cannot apply for more.</p>
                            </div>
                        )}

                        <form onSubmit={submitLeave}>
                            <div className="mb-2">
                                <label className="block text-sm">Type</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={leaveData.leaveType}
                                    onChange={(e) => setLeaveData({ ...leaveData, leaveType: e.target.value })}
                                >
                                    <option>Sick</option>
                                    <option>Casual</option>
                                    <option>Emergency</option>
                                    <option>Vacation</option>
                                    <option>Office</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="block text-sm">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded"
                                        value={leaveData.startDate}
                                        onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded"
                                        value={leaveData.endDate}
                                        onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm">Reason</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    value={leaveData.reason}
                                    onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                                    required
                                />
                            </div>
                            <button
                                className={`w-full text-white py-2 rounded ${leavesTakenThisMonth >= MAX_LEAVES_PER_MONTH ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                disabled={leavesTakenThisMonth >= MAX_LEAVES_PER_MONTH}
                            >
                                {leavesTakenThisMonth >= MAX_LEAVES_PER_MONTH ? 'Limit Reached' : 'Submit Request'}
                            </button>
                        </form>
                    </div>

                    {/* Holidays Section */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Upcoming Holidays</h2>
                        <div className="overflow-y-auto h-40">
                            {holidays.length > 0 ? (
                                <ul className="space-y-2">
                                    {holidays.map(h => (
                                        <li key={h._id} className="flex justify-between border-b pb-1">
                                            <span className="font-medium text-gray-700">{h.name}</span>
                                            <span className="text-gray-500">{new Date(h.date).toLocaleDateString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic">No holidays found.</p>
                            )}
                        </div>
                    </div>

                    {/* Notices Section */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Notice Board</h2>
                        <div className="space-y-4">
                            {notices.map(notice => (
                                <div key={notice._id} className="border-l-4 border-blue-500 bg-blue-50 p-4">
                                    <div className="flex justify-between">
                                        <h3 className="font-bold text-lg text-blue-800">{notice.title}</h3>
                                        <span className="text-sm text-gray-500">{new Date(notice.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="mt-2 text-gray-700">{notice.description}</p>
                                    {notice.image && (
                                        <img
                                            src={notice.image}
                                            alt="Notice"
                                            className="mt-3 max-h-48 rounded shadow-md cursor-pointer hover:opacity-90 transition"
                                            onClick={() => openModal(notice.image)}
                                        />
                                    )}
                                </div>
                            ))}
                            {notices.length === 0 && <p className="text-gray-500 italic">No new notices.</p>}
                        </div>
                    </div>

                    {/* My Leaves Status */}
                    <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
                        <h2 className="text-xl font-bold mb-4">My Leave History</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Type</th>
                                        <th className="px-4 py-2 text-left">From</th>
                                        <th className="px-4 py-2 text-left">To</th>
                                        <th className="px-4 py-2 text-left">Reason</th>
                                        <th className="px-4 py-2 text-left">Status</th>
                                        <th className="px-4 py-2 text-left">HR Remark</th> {/* [MODIFIED] Added Column Header */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((leave) => (
                                        <tr key={leave._id} className="border-b">
                                            <td className="px-4 py-2">{leave.leaveType}</td>
                                            <td className="px-4 py-2">{new Date(leave.startDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-2">{new Date(leave.endDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-2">{leave.reason}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded text-xs text-white ${leave.status === 'Approved' ? 'bg-green-500' : leave.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-gray-500 italic">
                                                {leave.adminRemark || '-'} {/* [MODIFIED] Displaying the remark */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payroll Status Section */}
                    <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Payroll Status</h2>
                            {payroll && payroll.status === 'Processed' && (
                                <button
                                    onClick={() => setShowPayslip(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm font-bold shadow"
                                >
                                    View Payslip
                                </button>
                            )}
                        </div>
                        {payroll && payroll.status === 'Processed' ? (
                            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
                                <p className="font-bold">Payment Processed</p>
                                <div className="mt-2 text-sm">
                                    <p>Base Salary: ₹{payroll.salary}</p>
                                    <p className="text-red-600">Deductions: -₹{payroll.deductions}</p>
                                    <p className="border-t pt-1 mt-1 font-bold text-lg">Net Salary: ₹{payroll.netSalary}</p>
                                    <p className="text-xs text-gray-500 mt-1">Processed on {new Date(payroll.lastProcessed).toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-500 mt-1">For Month: {payroll.payMonth || 'N/A'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                                <p className="font-bold">Pending</p>
                                <p>Your salary for this month is currently pending processing.</p>
                            </div>
                        )}
                    </div>
                    <ImageModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        imageUrl={selectedImage}
                    />

                    {/* Render Payslip Modal */}
                    {showPayslip && (
                        <Payslip
                            payroll={payroll}
                            employee={payroll.user}
                            onClose={() => setShowPayslip(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardEmployee;
