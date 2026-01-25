import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

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

    const deleteEmployee = async (id) => {
        if (!window.confirm('Are you sure you want to remove this employee?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${config.API_URL}/api/employees/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setMessage('Employee Removed Successfully');
            fetchEmployees();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error removing employee');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const addEmployee = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${config.API_URL}/api/employees/add`, formData, {
                headers: { 'x-auth-token': token }
            });
            setMessage('Employee Added Successfully');
            fetchEmployees();
            setFormData({ name: '', email: '', password: '' });
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Error adding employee');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Employee Management</h2>
            {message && <div className="bg-green-100 text-green-700 px-4 py-2 mb-4 rounded">{message}</div>}

            <form onSubmit={addEmployee} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                    type="text" placeholder="Name" className="border p-2 rounded"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required
                />
                <input
                    type="email" placeholder="Email" className="border p-2 rounded"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required
                />
                <input
                    type="password" placeholder="Password" className="border p-2 rounded"
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required
                />
                <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Add Employee</button>
            </form>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp._id} className="border-b">
                                <td className="px-4 py-2">{emp.name}</td>
                                <td className="px-4 py-2">{emp.email}</td>
                                <td className="px-4 py-2">
                                    <button onClick={() => deleteEmployee(emp._id)} className="text-red-500 hover:text-red-700 font-semibold">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeeManagement;
