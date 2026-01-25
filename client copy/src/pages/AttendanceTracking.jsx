import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AttendanceTracking = () => {
    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    useEffect(() => {
        fetchAttendance();
        fetchEmployees();
    }, []);

    const fetchAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/api/attendance/all`, {
                headers: { 'x-auth-token': token }
            });
            setAttendance(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/api/employees`, {
                headers: { 'x-auth-token': token }
            });
            setEmployees(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredAttendance = selectedEmployee
        ? attendance.filter(att => att.user?._id === selectedEmployee)
        : attendance;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Attendance Tracking</h2>
                <select
                    className="border p-2 rounded"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                    <option value="">All Employees</option>
                    {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto h-96">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Employee</th>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Check In</th>
                            <th className="px-4 py-2 text-left">Check Out</th>
                            <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAttendance.map(att => (
                            <tr key={att._id} className="border-b">
                                <td className="px-4 py-2">{att.user?.name}</td>
                                <td className="px-4 py-2">{new Date(att.date).toLocaleDateString()}</td>
                                <td className="px-4 py-2">{new Date(att.checkInTime).toLocaleTimeString()}</td>
                                <td className="px-4 py-2">{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString() : '-'}</td>
                                <td className="px-4 py-2">
                                    <span className="px-2 py-1 rounded text-xs text-white bg-green-500">Present</span>
                                </td>
                            </tr>
                        ))}
                        {filteredAttendance.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-500">No attendance records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceTracking;
