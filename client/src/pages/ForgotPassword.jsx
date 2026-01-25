import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import config from '../config';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await axios.post(`${config.API_URL}/api/auth/forgot-password`, { email });
            setMessage('Reset password link sent to your email.');
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
                <h2 className="mb-6 text-2xl font-bold text-center">Forgot Password</h2>
                {message && <p className="p-3 mb-4 text-green-700 bg-green-100 rounded">{message}</p>}
                {error && <p className="p-3 mb-4 text-red-700 bg-red-100 rounded">{error}</p>}
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block mb-2 text-sm font-bold text-gray-700">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6 text-center">
                        <button
                            type="submit"
                            className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                        >
                            Send Reset Link
                        </button>
                    </div>
                    <div className="text-center">
                        <Link to="/" className="text-sm text-blue-500 hover:text-blue-800">
                            Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
