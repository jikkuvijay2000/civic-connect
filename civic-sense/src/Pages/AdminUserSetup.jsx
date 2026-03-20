import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaUserShield, FaUsers, FaSearch, FaUserTag, FaBuilding, 
    FaSave, FaTimes, FaCheckCircle, FaExclamationTriangle,
    FaFire, FaTint, FaBroom, FaHardHat, FaShieldAlt, FaEllipsisH,
    FaEdit, FaUserCircle
} from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';

const DEPARTMENTS = [
    'Cleaning Department',
    'Public Works Department',
    'Water Department',
    'Fire Department',
    'Police Department',
    'Others'
];

const DEPT_ICONS = {
    'Fire Department': FaFire,
    'Water Department': FaTint,
    'Cleaning Department': FaBroom,
    'Public Works Department': FaHardHat,
    'Police Department': FaShieldAlt,
    'Others': FaEllipsisH,
};

const DEPT_COLORS = {
    'Fire Department': '#ef4444',
    'Water Department': '#3b82f6',
    'Cleaning Department': '#10b981',
    'Public Works Department': '#f59e0b',
    'Police Department': '#6366f1',
    'Others': '#64748b',
};

const AdminUserSetup = () => {
    const { secret } = useParams();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [authorized, setAuthorized] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, [secret]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/user/admin/users/${secret}`);
            if (res.data && res.data.data) {
                setUsers(res.data.data);
                setAuthorized(true);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            if (error.response?.status === 403) {
                setAuthorized(false);
            }
            notify('error', error.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (userId, data) => {
        setUpdating(true);
        try {
            const res = await api.patch(`/user/admin/users/${userId}/${secret}`, data);
            if (res.data.status === 'success') {
                notify('success', 'User updated successfully');
                setUsers(users.map(u => u._id === userId ? { ...u, ...data } : u));
                setEditingUser(null);
            }
        } catch (error) {
            notify('error', error.response?.data?.message || 'Failed to update user');
        } finally {
            setUpdating(false);
        }
    };

    const filteredUsers = users.filter(user => 
        user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!authorized) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light text-dark p-4">
                <div className="text-center bg-white p-5 rounded-5 shadow-sm border border-danger border-opacity-10" style={{ maxWidth: '450px' }}>
                    <div className="bg-danger bg-opacity-10 p-4 rounded-circle d-inline-block mb-4">
                        <FaExclamationTriangle size={48} className="text-danger" />
                    </div>
                    <h1 className="h2 fw-bold mb-3">Unauthorized Access</h1>
                    <p className="text-muted mb-4 opacity-75">Your administrative secret is invalid or has expired. Please verify your link and try again.</p>
                    <button onClick={() => navigate('/')} className="btn btn-danger w-100 py-3 rounded-4 fw-bold shadow-sm transition-all">
                        Return to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-white" style={{ color: '#1e293b', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div className="sticky-top bg-white border-bottom border-light py-4 px-5 z-3">
                <div className="container-fluid d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-4">
                        <div className="p-3 rounded-4 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center shadow-sm">
                            <FaUserShield size={28} />
                        </div>
                        <div>
                            <h2 className="mb-0 fw-bold tracking-tight">Admin Console</h2>
                            <span className="badge bg-light text-muted fw-medium border px-3 py-2 rounded-pill mt-2">User Permissions & Roles</span>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="position-relative shadow-sm rounded-pill overflow-hidden border border-light">
                            <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                            <input 
                                type="text" 
                                placeholder="Search by name or email..." 
                                className="form-control border-0 ps-5 py-3 bg-light text-dark"
                                style={{ width: '350px', fontSize: '14px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={fetchUsers} className="btn btn-white border border-light rounded-pill px-4 py-3 shadow-sm hover-elevate">
                            Refresh Data
                        </button>
                    </div>
                </div>
            </div>

            <main className="container-fluid p-5">
                {loading ? (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5">
                        <div className="spinner-border text-primary border-4 mb-3" role="status" style={{ width: '3.5rem', height: '3.5rem' }}></div>
                        <p className="text-muted fw-medium fs-5">Fetching latest records...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-5 shadow-sm border border-light overflow-hidden">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '15px' }}>
                                <thead className="bg-light bg-opacity-50">
                                    <tr>
                                        <th className="px-5 py-4 text-muted small text-uppercase">User Identity</th>
                                        <th className="py-4 text-muted small text-uppercase">Access Role</th>
                                        <th className="py-4 text-muted small text-uppercase">Department</th>
                                        <th className="py-4 text-muted small text-uppercase text-end px-5">Management</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-5 border-0">
                                                <div className="py-5 opacity-50">
                                                    <FaUsers size={48} className="text-muted mb-3" />
                                                    <p className="fw-medium">No users match your criteria</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <tr key={user._id} className="transition-all hover-white">
                                                <td className="px-5 py-4">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '48px', height: '48px' }}>
                                                            {user.userName[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark mb-0">{user.userName}</div>
                                                            <div className="text-muted small opacity-75">{user.userEmail}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className={`d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill small fw-bold ${user.userRole === 'Authority' ? 'bg-indigo-light text-indigo' : 'bg-slate-light text-slate'}`}>
                                                        <FaUserTag size={12} />
                                                        {user.userRole}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    {user.userRole === 'Authority' ? (
                                                        <div className="d-flex align-items-center gap-2 text-dark fw-medium">
                                                            {(() => {
                                                                const Icon = DEPT_ICONS[user.userDepartment] || FaBuilding;
                                                                return <Icon className="text-primary opacity-75" size={14} />;
                                                            })()}
                                                            <span>{user.userDepartment || 'Not Assigned'}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted opacity-50 small">—</span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-end px-5">
                                                    <button 
                                                        onClick={() => setEditingUser(user)}
                                                        className="btn btn-primary bg-primary bg-opacity-10 text-primary border-0 rounded-pill px-4 py-2 small fw-bold shadow-sm transition-all hover-primary-solid"
                                                    >
                                                        <FaEdit className="me-2" /> 
                                                        Adjust Access
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Footer stats */}
                        <div className="bg-light bg-opacity-25 px-5 py-3 border-top border-light d-flex justify-content-between align-items-center">
                            <div className="text-muted small fw-medium">
                                Total Records: <span className="text-dark fw-bold">{users.length}</span>
                            </div>
                            <div className="text-muted small fw-medium">
                                Showing <span className="text-dark fw-bold">{filteredUsers.length}</span> results
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Premium Light Modal */}
            <AnimatePresence>
                {editingUser && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-5 p-4" style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white border-0 p-5 w-100"
                            style={{ maxWidth: '550px', borderRadius: '40px', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)' }}
                        >
                            <div className="text-center mb-5">
                                <div className="bg-primary bg-opacity-10 p-4 rounded-circle d-inline-block mb-3">
                                    <FaUserCircle size={48} className="text-primary" />
                                </div>
                                <h3 className="fw-black mb-1">Access Management</h3>
                                <p className="text-muted small">Update identity permissions for <strong>{editingUser.userName}</strong></p>
                            </div>

                            <div className="mb-4">
                                <label className="form-label text-muted small fw-black text-uppercase tracking-wider mb-4 d-block text-center">System Role</label>
                                <div className="d-flex gap-3 px-2">
                                    {['Citizen', 'Authority'].map(role => (
                                        <button 
                                            key={role}
                                            onClick={() => setEditingUser({ ...editingUser, userRole: role, userDepartment: role === 'Citizen' ? '' : editingUser.userDepartment })}
                                            className={`flex-grow-1 py-4 rounded-4 border-2 transition-all d-flex flex-column align-items-center gap-2 fw-bold ${editingUser.userRole === role ? 'bg-primary border-primary text-white shadow-lg scale-elevate' : 'bg-white border-light text-muted'}`}
                                        >
                                            <FaUserTag size={18} />
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <AnimatePresence>
                                {editingUser.userRole === 'Authority' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-5 overflow-hidden"
                                    >
                                        <div className="bg-light bg-opacity-50 p-4 rounded-5 border border-light mt-3">
                                            <label className="form-label text-muted small fw-black text-uppercase tracking-wider mb-3 d-block">Assigned Department</label>
                                            <div className="row g-2">
                                                {DEPARTMENTS.map(dept => {
                                                    const Icon = DEPT_ICONS[dept] || FaBuilding;
                                                    const isActive = editingUser.userDepartment === dept;
                                                    return (
                                                        <div key={dept} className="col-6">
                                                            <button 
                                                                onClick={() => setEditingUser({ ...editingUser, userDepartment: dept })}
                                                                className={`w-100 py-3 rounded-4 border transition-all text-start px-3 d-flex align-items-center gap-3 ${isActive ? 'bg-white border-primary border-2 text-primary shadow-sm' : 'bg-white border-light text-muted opacity-75'}`}
                                                            >
                                                                <Icon size={14} style={{ color: isActive ? DEPT_COLORS[dept] : 'inherit' }} />
                                                                <span className="small fw-bold">{dept}</span>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="d-grid gap-3 mt-4">
                                <button 
                                    onClick={() => handleUpdateUser(editingUser._id, { userRole: editingUser.userRole, userDepartment: editingUser.userDepartment })}
                                    disabled={updating}
                                    className="btn btn-primary py-4 rounded-4 fw-black shadow-lg text-uppercase tracking-wider"
                                >
                                    {updating ? <span className="spinner-border spinner-border-sm me-2"></span> : <FaSave className="me-2" />}
                                    Apply Changes
                                </button>
                                <button onClick={() => setEditingUser(null)} className="btn btn-link text-muted fw-bold text-decoration-none py-2 hover-dark">
                                    Dismiss Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .tracking-tight { letter-spacing: -0.025em; }
                .tracking-wider { letter-spacing: 0.05em; }
                .fw-black { font-weight: 900; }
                
                .bg-indigo-light { background-color: #eef2ff; }
                .text-indigo { color: #4f46e5; }
                .bg-slate-light { background-color: #f1f5f9; }
                .text-slate { color: #475569; }
                
                .hover-white:hover { background-color: #fafafa !important; }
                .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05) !important; }
                .scale-elevate { transform: scale(1.02); }
                
                .hover-primary-solid:hover { background-color: #1a73e8 !important; color: white !important; }
                .hover-dark:hover { color: #000 !important; }
                
                .backdrop-blur { backdrop-filter: blur(10px); }
                
                /* Table Tweaks */
                .table > :not(caption) > * > * { border-bottom-width: 1px; border-color: #f1f5f9; }
                .table-hover tbody tr:hover { cursor: default; }

                .rounded-5 { border-radius: 2rem !important; }
                .rounded-4 { border-radius: 1.25rem !important; }
            `}} />
        </div>
    );
};

export default AdminUserSetup;
