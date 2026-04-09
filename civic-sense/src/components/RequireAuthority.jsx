import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AccessPopup from './AccessPopup';

const RequireAuthority = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (user.userRole !== 'Authority') {
        // Instead of a silent redirect, show the blocking popup
        return (
            <div style={{ position: 'relative', minHeight: '100vh', background: '#f8fafc' }}>
                <AccessPopup
                    message="This area is reserved for authority personnel only."
                    targetUrl="/dashboard"
                />
            </div>
        );
    }

    return <Outlet />;
};

export default RequireAuthority;
