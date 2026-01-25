import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const PayrollManagement = () => {
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        fetchPayroll();
    }, []);

    const fetchPayroll = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/api/payroll/all`, {
                headers: { 'x-auth-token': token }
            });
            setEmployees(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const processPayment = async (id, name) => {
        if (!window.confirm(`Confirm payment processing for ${name}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${config.API_URL}/api/payroll/process/${id}`, {}, {
                headers: { 'x-auth-token': token }
            });
            alert('Payment Processed Successfully');
            fetchPayroll();
        } catch (err) {
            console.error(err);
            alert('Error processing payment');
        }
    };

    const updateSalary = async (id, currentSalary) => {
        const newSalary = window.prompt("Enter new salary:", currentSalary);
        if (!newSalary || isNaN(newSalary)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${config.API_URL}/api/payroll/update-salary/${id}`, { salary: newSalary }, {
                headers: { 'x-auth-token': token }
            });
            fetchPayroll();
        } catch (err) {
            console.error(err);
            alert('Error updating salary');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Payroll Management</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Employee</th>
                            <th className="px-4 py-2 text-left">Base Salary</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Last Processed</th>
                            <th className="px-4 py-2 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp._id} className="border-b">
                                <td className="px-4 py-2">{emp.user?.name}</td>
                                <td className="px-4 py-2">₹{emp.salary}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs text-white ${emp.status === 'Processed' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                        {emp.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    {emp.lastProcessed ? new Date(emp.lastProcessed).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 py-2">
                                    {emp.status === 'Pending' ? (
                                        <button
                                            onClick={() => processPayment(emp._id, emp.user?.name)}
                                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                                        >
                                            Process Payment
                                        </button>
                                    ) : (
                                        <button className="bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed text-xs" disabled>
                                            Paid
                                        </button>
                                    )}
                                    <button
                                        onClick={() => updateSalary(emp._id, emp.salary)}
                                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs ml-2"
                                    >
                                        Update Salary
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 p-4 bg-gray-50 text-gray-500 text-sm italic rounded">
                Note: Processing payment updates the status immediately.
            </div>
        </div>
    );
};

export default PayrollManagement;
