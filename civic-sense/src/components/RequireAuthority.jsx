import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const RequireAuthority = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (user.role !== 'Authority') {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default RequireAuthority;
