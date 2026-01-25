import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeManagement from './EmployeeManagement';
import LeaveManagement from './LeaveManagement';
import AttendanceTracking from './AttendanceTracking';
import PayrollManagement from './PayrollManagement';
import CircularManagement from './CircularManagement';

const DashboardHR = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('employees');

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex justify-between">
                        <div className="flex space-x-7">
                            <div className="flex items-center space-x-4">
                                <img src="/logo.png" alt="Logo" className="h-16 w-auto ml-2" />
                                <span className="font-semibold text-gray-500 text-lg py-4 px-2">OHRM - HR Portal</span>
                                <button onClick={() => setActiveTab('employees')} className={`py-4 px-2 ${activeTab === 'employees' ? 'border-b-4 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Employees</button>
                                <button onClick={() => setActiveTab('leaves')} className={`py-4 px-2 ${activeTab === 'leaves' ? 'border-b-4 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Leaves</button>
                                <button onClick={() => setActiveTab('attendance')} className={`py-4 px-2 ${activeTab === 'attendance' ? 'border-b-4 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Attendance</button>
                                <button onClick={() => setActiveTab('payroll')} className={`py-4 px-2 ${activeTab === 'payroll' ? 'border-b-4 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Payroll</button>
                                <button onClick={() => setActiveTab('circulars')} className={`py-4 px-2 ${activeTab === 'circulars' ? 'border-b-4 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Circulars</button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={logout} className="py-2 px-2 font-medium text-gray-500 rounded hover:bg-red-500 hover:text-white transition duration-300">Log Out</button>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="max-w-6xl mx-auto mt-10 px-4 pb-10">
                {activeTab === 'employees' && <EmployeeManagement />}
                {activeTab === 'leaves' && <LeaveManagement />}
                {activeTab === 'attendance' && <AttendanceTracking />}
                {activeTab === 'payroll' && <PayrollManagement />}
                {activeTab === 'circulars' && <CircularManagement />}
            </div>
        </div>
    );
};

export default DashboardHR;
