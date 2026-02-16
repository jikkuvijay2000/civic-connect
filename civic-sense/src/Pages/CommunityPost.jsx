import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBullhorn, FaPen, FaTags } from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';
import { useNavigate } from 'react-router-dom';

const CommunityPost = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tag: 'Update',
        image: null
    });

    const handleChange = (e) => {
        if (e.target.name === 'image') {
            setFormData({ ...formData, image: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            notify("error", "You must be logged in.");
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('content', formData.content);
        data.append('tag', formData.tag);
        data.append('author', user.userName || "Authority");
        data.append('role', user.role || "Admin");
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            const response = await api.post('/community-post/create', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 201) {
                notify("success", "Community post created successfully!");
                setFormData({ title: '', content: '', tag: 'Update', image: null });
            }
        } catch (error) {
            console.error("Error creating post:", error);
            notify("error", "Failed to create post.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5">
            <div className="mb-5">
                <h2 className="fw-bold text-dark ls-tight">Create Community Post</h2>
                <p className="text-muted">Share updates, alerts, and events with the community.</p>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-custom-xl shadow-custom-sm p-5 border border-light position-relative overflow-hidden"
                    >
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary text-uppercase ls-wide">Post Title</label>
                                <div className="input-group shadow-sm rounded-custom overflow-hidden">
                                    <span className="input-group-text bg-surface border-light border-end-0 text-primary-custom"><FaPen /></span>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="form-control form-control-lg bg-surface border-light border-start-0 text-dark focus-ring-primary"
                                        placeholder="e.g., City Clean-up Drive"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary text-uppercase ls-wide">Tag / Category</label>
                                <div className="input-group shadow-sm rounded-custom overflow-hidden">
                                    <span className="input-group-text bg-surface border-light border-end-0 text-primary-custom"><FaTags /></span>
                                    <select
                                        name="tag"
                                        value={formData.tag}
                                        onChange={handleChange}
                                        className="form-select form-select-lg bg-surface border-light border-start-0 text-dark focus-ring-primary shadow-none"
                                    >
                                        <option value="Update">Update</option>
                                        <option value="Alert">Alert</option>
                                        <option value="Event">Event</option>
                                        <option value="News">News</option>
                                        <option value="Notice">Notice</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary text-uppercase ls-wide">Upload Image (Optional)</label>
                                <input
                                    type="file"
                                    name="image"
                                    onChange={handleChange}
                                    className="form-control form-control-lg bg-surface border-light text-dark focus-ring-primary"
                                    accept="image/*"
                                />
                            </div>

                            <div className="mb-5">
                                <label className="form-label fw-bold small text-secondary text-uppercase ls-wide">Content</label>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    className="form-control bg-surface border-light shadow-sm text-dark focus-ring-primary"
                                    rows="6"
                                    placeholder="Write your update here..."
                                    required
                                    style={{ resize: 'none' }}
                                ></textarea>
                            </div>

                            <div className="d-flex justify-content-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary px-5 py-3 fw-bold rounded-pill shadow-custom-lg hover-scale transition-fast d-flex align-items-center gap-2"
                                >
                                    {loading ? (
                                        <span><span className="spinner-border spinner-border-sm me-2"></span> Posting...</span>
                                    ) : (
                                        <>
                                            <FaBullhorn /> Publish Post
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPost;
