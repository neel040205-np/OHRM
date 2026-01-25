import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/" />;
    }

    try {
        const decoded = jwtDecode(token);
        const userRole = decoded.user.role;

        if (allowedRoles && !allowedRoles.includes(userRole)) {
            // Redirect based on role if unauthorized for this specific route, or just Logout
            return <Navigate to="/" />;
        }

        return children;
    } catch (err) {
        localStorage.removeItem('token');
        return <Navigate to="/" />;
    }
};

export default ProtectedRoute;
