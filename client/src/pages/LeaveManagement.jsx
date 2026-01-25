import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/api/leaves/all`, {
                headers: { 'x-auth-token': token }
            });
            setLeaves(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (id, status) => {
        // [MODIFIED] Added prompt to ask HR for a remark (Optional)
        const adminRemark = window.prompt(`Enter a remark for ${status} (Optional):`);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${config.API_URL}/api/leaves/${id}`, { status, adminRemark }, { // [MODIFIED] Sending status AND remark
                headers: { 'x-auth-token': token }
            });
            fetchLeaves();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Leave Management</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Employee</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Dates</th>
                            <th className="px-4 py-2 text-left">Reason</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">HR Remark</th> {/* [MODIFIED] Added Column Header */}
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.map(leave => (
                            <tr key={leave._id} className="border-b">
                                <td className="px-4 py-2">{leave.user?.name}</td>
                                <td className="px-4 py-2">{leave.leaveType}</td>
                                <td className="px-4 py-2">
                                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2">{leave.reason}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs text-white ${leave.status === 'Approved' ? 'bg-green-500' : leave.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                                        {leave.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-gray-500 italic">
                                    {leave.adminRemark || '-'} {/* [MODIFIED] Displaying the remark */}
                                </td>
                                <td className="px-4 py-2 flex items-center space-x-2 whitespace-nowrap">
                                    {/* [MODIFIED] Refined Button Logic for Revoke/Reject/Approve */}
                                    {leave.status === 'Pending' && (
                                        <>
                                            <button onClick={() => updateStatus(leave._id, 'Approved')} className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600">Approve</button>
                                            <button onClick={() => updateStatus(leave._id, 'Rejected')} className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 ml-2">Reject</button>
                                        </>
                                    )}
                                    {leave.status === 'Approved' && (
                                        <>
                                            <button onClick={() => updateStatus(leave._id, 'Rejected')} className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">Reject</button>
                                            <button onClick={() => updateStatus(leave._id, 'Pending')} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 ml-2">Revoke to Pending</button>
                                        </>
                                    )}
                                    {leave.status === 'Rejected' && (
                                        <>
                                            <button onClick={() => updateStatus(leave._id, 'Approved')} className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600">Approve</button>
                                            <button onClick={() => updateStatus(leave._id, 'Pending')} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 ml-2">Revoke to Pending</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaveManagement;
