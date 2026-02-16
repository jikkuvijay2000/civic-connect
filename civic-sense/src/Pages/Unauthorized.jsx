import React from 'react';
import { Link } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';

const Unauthorized = () => {
    return (
        <div className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
            <div className="text-center p-5 bg-white rounded-custom-xl shadow-custom-lg" style={{ maxWidth: '500px' }}>
                <div className="mb-4 text-danger">
                    <FaLock size={60} />
                </div>
                <h1 className="fw-bold mb-3">Access Denied</h1>
                <p className="text-muted mb-4 fs-5">
                    You do not have permission to view this page. This area is restricted to authorized personnel only.
                </p>
                <Link to="/dashboard" className="btn btn-primary px-4 py-2 rounded-pill fw-bold hover-scale transition-fast">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;
