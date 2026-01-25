import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageModal from '../components/ImageModal';
import config from '../config';

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

    useEffect(() => {
        fetchAttendance();
        fetchLeaves();
        fetchNotices();
        fetchPayrollStatus(); // New Call
    }, []);

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
        } catch (err) {
            console.error(err);
        }
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
                                    <option>Vacation</option>
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
                            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Submit Request</button>
                        </form>
                    </div>

                    {/* Notices Section */}
                    <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
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
                        <h2 className="text-xl font-bold mb-4">Payroll Status</h2>
                        {payroll && payroll.status === 'Processed' ? (
                            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
                                <p className="font-bold">Payment Processed</p>
                                <p>Your salary of ₹{payroll.salary} has been processed on {new Date(payroll.lastProcessed).toLocaleDateString()}. It will be credited to your account within 2 days.</p>
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
                </div>
            </div>
        </div>
    );
};

export default DashboardEmployee;
