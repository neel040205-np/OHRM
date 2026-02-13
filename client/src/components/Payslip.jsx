import React from 'react';

const Payslip = ({ payroll, employee, onClose }) => {
    if (!payroll || !employee) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto print:static print:bg-white">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full m-4 print:shadow-none print:w-full print:max-w-none print:m-0">

                {/* Header */}
                <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wide">OHRM Solutions</h1>
                    <p className="text-gray-600">123 Corporate Park, Tech City, Gujarat, India - 380001</p>
                    <p className="text-gray-600">Email: contact@ohrm.com | Phone: +91 98765 43210</p>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold uppercase underline">Payslip for {payroll.payMonth || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Employee Details */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <p><span className="font-bold">Employee Name:</span> {employee.name}</p>
                        <p><span className="font-bold">Employee ID:</span> {employee._id.slice(-6).toUpperCase()}</p>
                        <p><span className="font-bold">Role:</span> {employee.role || 'Employee'}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-bold">Bank Name:</span> HDFC Bank</p>
                        <p><span className="font-bold">Account No:</span> XXXXXX1234</p>
                        <p><span className="font-bold">PAN:</span> ABCDE1234F</p>
                    </div>
                </div>

                {/* Salary Table */}
                <div className="mb-6">
                    <table className="w-full border-collapse border border-gray-400">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border border-gray-400 p-2 text-left w-1/2">Earnings</th>
                                <th className="border border-gray-400 p-2 text-right w-1/2">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-400 p-2">Basic Salary</td>
                                <td className="border border-gray-400 p-2 text-right">{payroll.salary}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 p-2">HRA (House Rent Allowance)</td>
                                <td className="border border-gray-400 p-2 text-right">0</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 p-2">Special Allowance</td>
                                <td className="border border-gray-400 p-2 text-right">0</td>
                            </tr>
                            <tr className="bg-gray-100 font-bold">
                                <td className="border border-gray-400 p-2">Total Earnings</td>
                                <td className="border border-gray-400 p-2 text-right">{payroll.salary}</td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="w-full border-collapse border border-gray-400 mt-[-1px]">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border border-gray-400 p-2 text-left w-1/2">Deductions</th>
                                <th className="border border-gray-400 p-2 text-right w-1/2">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-400 p-2">Leave Deductions ({payroll.attendanceDays ? 'Unpaid Days' : 'LWP'})</td>
                                <td className="border border-gray-400 p-2 text-right text-red-600">{payroll.deductions}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 p-2">Prof. Tax</td>
                                <td className="border border-gray-400 p-2 text-right">0</td>
                            </tr>
                            <tr className="bg-gray-100 font-bold">
                                <td className="border border-gray-400 p-2">Total Deductions</td>
                                <td className="border border-gray-400 p-2 text-right text-red-600">{payroll.deductions}</td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="w-full border-collapse border border-gray-400 mt-4">
                        <tbody>
                            <tr className="bg-blue-50 font-bold text-lg">
                                <td className="border border-gray-400 p-3">Net Salary Payable</td>
                                <td className="border border-gray-400 p-3 text-right">₹{payroll.netSalary}</td>
                            </tr>
                        </tbody>
                    </table>

                    <p className="mt-2 text-sm italic">Amount in words: {convertNumberToWords(Math.round(payroll.netSalary))} Rupees Only</p>
                </div>

                {/* Footer / Signatures */}
                <div className="flex justify-between items-end mt-16 print:mt-24">
                    <div className="text-center">
                        <div className="border-t border-gray-400 w-40 mx-auto"></div>
                        <p className="font-bold mt-2">Employee Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400 font-bold rotate-[-15deg]">
                            COMPANY STAMP
                        </div>
                        <div className="border-t border-gray-400 w-40 mx-auto"></div>
                        <p className="font-bold mt-2">Authorized Signatory</p>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-gray-500 print:hidden">
                    <p>This is a computer-generated document and does not require a physical signature.</p>
                </div>

                {/* Actions */}
                <div className="mt-8 flex justify-end space-x-4 print:hidden">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
                    >
                        Print / Download PDF
                    </button>
                </div>
            </div>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .fixed, .fixed * {
                        visibility: visible;
                    }
                    .fixed {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background: white;
                    }
                    .print\\:hidden { // Double escaping backslash for string
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

// Helper to convert number to words (Simplified version)
function convertNumberToWords(amount) {
    // Basic implementation or placeholder
    return amount + "";
}

export default Payslip;
