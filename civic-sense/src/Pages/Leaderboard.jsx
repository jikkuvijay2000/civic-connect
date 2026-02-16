import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import api from '../api/axios';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await api.get('/user/leaderboard');
                if (response.data.status === "success") {
                    setLeaders(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid min-vh-100 bg-light p-4">
            <div className="d-flex align-items-center gap-3 mb-5">
                <div className="bg-warning text-white p-3 rounded-circle shadow-sm">
                    <FaTrophy size={24} />
                </div>
                <div>
                    <h4 className="fw-bold mb-0 text-dark ls-tight">Leaderboard</h4>
                    <small className="text-muted">Top contributors making an impact</small>
                </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 ps-4 border-0 text-secondary text-uppercase small fw-bold" style={{ width: '10%' }}>Rank</th>
                                <th className="py-3 border-0 text-secondary text-uppercase small fw-bold">User</th>
                                <th className="py-3 border-0 text-secondary text-uppercase small fw-bold text-center">Reports</th>
                                <th className="py-3 border-0 text-secondary text-uppercase small fw-bold text-center">Resolved</th>
                                <th className="py-3 pe-4 border-0 text-secondary text-uppercase small fw-bold text-end">Impact Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaders.map((user, index) => (
                                <motion.tr
                                    key={user._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <td className="py-3 ps-4 border-0 fw-bold text-secondary">
                                        {index + 1 === 1 && <FaMedal className="text-warning me-2" size={20} />}
                                        {index + 1 === 2 && <FaMedal className="text-secondary me-2" size={20} />}
                                        {index + 1 === 3 && <FaMedal className="text-danger me-2" style={{ color: '#CD7F32' }} size={20} />}
                                        #{index + 1}
                                    </td>
                                    <td className="py-3 border-0">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                {user.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h6 className="mb-0 fw-bold text-dark">{user.userName}</h6>
                                                <small className="text-muted" style={{ fontSize: '0.8rem' }}>{user.userEmail}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 border-0 text-center fw-medium text-secondary">{user.totalComplaints}</td>
                                    <td className="py-3 border-0 text-center fw-medium text-success">{user.resolvedComplaints}</td>
                                    <td className="py-3 pe-4 border-0 text-end">
                                        <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '0.9rem' }}>
                                            {user.impactPoints} pts
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {leaders.length === 0 && (
                <div className="text-center py-5 text-muted">
                    <p>No contributions yet. Be the first to make an impact!</p>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
