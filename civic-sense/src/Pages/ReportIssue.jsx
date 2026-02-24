import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCamera, FaVideo, FaMapMarkerAlt, FaExclamationTriangle, FaCloudUploadAlt, FaRobot } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { notify } from '../utils/notify';
import civicLogo from '../assets/civic_sense_symbolic_logo.png';
import LocationPicker from '../components/LocationPicker';
import api from '../api/axios';

const ReportIssue = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: '',
        location: '',
        location: '',
        image: null,
        video: null,
        aiScore: 0
    });
    const [isCaptioning, setIsCaptioning] = useState(false);
    const [isVideoAnalyzing, setIsVideoAnalyzing] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

    // Updated mapping based on user request
    const departmentMapping = {
        "Cleaning Department": "Cleaning Department",
        "Electricity Department": "Public Works Department",
        "Public Works Department": "Public Works Department",
        "Water Department": "Water Department",
        "Fire Department": "Fire Department"
    };

    // Debounce AI Prediction
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.description.length > 10) {
                predictCategoryAndPriority();
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [formData.description]);

    const predictCategoryAndPriority = async () => {
        setIsThinking(true);
        // Ensure animation runs for at least 2 seconds for better UX
        const minDelay = new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const response = await api.post('/complaint/predict', { text: formData.description });

            await minDelay;

            if (response.data) {
                const predictedCategory = departmentMapping[response.data.department] || "Others";
                setFormData(prev => ({
                    ...prev,
                    category: predictedCategory,
                    priority: response.data.priority,
                    aiScore: response.data.confidence
                }));
            }
        } catch (error) {
            console.error("Prediction failed", error);
        } finally {
            setIsThinking(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, image: file }));

            // Trigger Image Captioning
            setIsCaptioning(true);
            const data = new FormData();
            data.append('image', file);

            try {
                // Ensure animation runs for at least 3 seconds
                const minDelay = new Promise(resolve => setTimeout(resolve, 3000));

                const response = await api.post('/complaint/caption', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                await minDelay;

                if (response.data && response.data.description) {
                    // Update description (this will trigger the useEffect for category prediction)
                    setFormData(prev => ({
                        ...prev,
                        description: response.data.description
                    }));
                }
            } catch (error) {
                console.error("Captioning failed", error);
                const errorMessage = error.response?.data?.message || "Could not analyze image";
                notify("error", errorMessage);
            } finally {
                setIsCaptioning(false);
            }
        }
    };

    const handleVideoChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, video: file }));

            setIsVideoAnalyzing(true);
            const data = new FormData();
            data.append('video', file);

            try {
                // Animation delay
                const minDelay = new Promise(resolve => setTimeout(resolve, 3000));

                const response = await api.post('/complaint/analyze-video', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                await minDelay;

                if (response.data && response.data.description) {
                    setFormData(prev => ({
                        ...prev,
                        description: (prev.description ? prev.description + "\n\n" : "") + response.data.description
                    }));
                }
            } catch (error) {
                console.error("Video analysis failed", error);
                const errorMessage = error.response?.data?.message || "Could not analyze video";
                notify("error", errorMessage);
            } finally {
                setIsVideoAnalyzing(false);
            }
        }
    };

    const handleLocationSelect = ({ lat, lng, address }) => {
        setFormData(prev => ({ ...prev, location: address }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.title || !formData.category || !formData.location || !formData.description || !formData.image || !formData.priority) {
            notify("error", "Please fill in all fields and upload an image.");
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('category', formData.category);
        data.append('location', formData.location);
        data.append('description', formData.description);
        data.append('priority', formData.priority);
        data.append('aiScore', formData.aiScore);
        data.append('aiScore', formData.aiScore);
        data.append('image', formData.image);
        if (formData.video) {
            data.append('video', formData.video);
        }

        try {
            const response = await api.post('/complaint/create', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201) {
                notify("success", "Issue reported successfully!");
                navigate('/dashboard');
            } else {
                notify("error", response.data.message || "Failed to report issue");
            }
        } catch (error) {
            console.error("Error reporting issue:", error);
            notify("error", error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 p-md-5">
            <div className="row justify-content-center">
                <div className="w-100">
                    <div className="d-flex align-items-center justify-content-between mb-4 p-2 bg-white shadow-sm rounded-custom">
                        <h4 className="fw-bold text-dark mb-0 ls-tight ms-3">Report an Issue</h4>
                        <button onClick={() => navigate(-1)} className="btn btn-light rounded-pill px-4 text-secondary hover-scale shadow-sm">
                            Return Home
                        </button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-custom-xl shadow-custom-lg p-5 border-0 position-relative overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="position-absolute top-0 end-0 p-5 opacity-10 pointer-events-none">
                            {/* <FaExclamationTriangle size={150} className="text-secondary" /> */}
                        </div>

                        <form onSubmit={handleSubmit} className="position-relative z-1">
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary text-uppercase ls-wide">Issue Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="form-control form-control-lg bg-surface border-light shadow-sm text-dark placeholder-muted focus-ring-primary"
                                    placeholder="e.g., Deep Pothole on Main St."
                                    required
                                    style={{ fontSize: '0.95rem' }}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary text-uppercase ls-wide">Location</label>
                                <div className="input-group shadow-sm rounded-custom overflow-hidden">
                                    <span className="input-group-text bg-surface border-light border-end-0 text-primary-custom"><FaMapMarkerAlt /></span>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="form-control form-control-lg bg-surface border-light border-start-0 text-dark focus-ring-primary"
                                        placeholder="Enter address or landmark"
                                        required
                                        style={{ fontSize: '0.95rem' }}
                                    />
                                </div>
                                <div className="mt-3 border rounded-custom overflow-hidden shadow-sm">
                                    <LocationPicker onLocationSelect={handleLocationSelect} />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary text-uppercase ls-wide">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="form-control bg-surface border-light shadow-sm text-dark focus-ring-primary"
                                    rows="5"
                                    placeholder="Describe the issue in detail. What is wrong? How long has it been like this?"
                                    required
                                    style={{ fontSize: '0.95rem', resize: 'none' }}
                                ></textarea>
                                {isThinking || isCaptioning || isVideoAnalyzing ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="mt-3 p-4 rounded-custom bg-white border border-light shadow-sm position-relative overflow-hidden"
                                    >
                                        <div className="d-flex align-items-center gap-4 position-relative z-1">
                                            <div className="position-relative">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                                    className="d-flex align-items-center justify-content-center text-primary-custom"
                                                >
                                                    <FaRobot size={28} />
                                                </motion.div>
                                                <motion.div
                                                    className="position-absolute top-50 start-50 translate-middle"
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, transparent 70%)' }}
                                                />
                                            </div>
                                            <div className="flex-grow-1">
                                                <h5 className="fw-bold mb-1" style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                    {isCaptioning ? "Analyzing Image..." : isVideoAnalyzing ? "Analyzing Video..." : "Civic Connect AI is Thinking..."}
                                                </h5>
                                                <p className="small text-muted mb-0">
                                                    {isCaptioning ? "Generating description from your photo..." : isVideoAnalyzing ? "Extracting insights from video..." : "Analyzing description to identify department and priority."}
                                                </p>
                                            </div>
                                            <div className="d-flex gap-2 mt-2">
                                                <motion.span
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="badge bg-blue-50 text-primary-custom border border-blue-100 rounded-pill fw-medium"
                                                >
                                                    Analyzing Content
                                                </motion.span>
                                                <motion.span
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
                                                    className="badge bg-purple-50 text-purple-600 border border-purple-100 rounded-pill fw-medium"
                                                >
                                                    Matching Department
                                                </motion.span>
                                            </div>
                                        </div>

                                    </motion.div>
                                ) : null}
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label fw-bold small text-secondary text-uppercase ls-wide">Category (AI Detected)</label>
                                    <div className="position-relative">
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            disabled={true}
                                            className="form-select form-select-lg bg-light border-light shadow-none text-dark focus-ring-primary cursor-not-allowed opacity-75"
                                            required
                                            style={{ fontSize: '0.95rem' }}
                                        >
                                            <option value="">Waiting for AI...</option>
                                            <option value="Fire Department">Fire Department</option>
                                            <option value="Water Department">Water Department</option>
                                            <option value="Cleaning Department">Cleaning Department</option>
                                            <option value="Public Works Department">Public Works Department</option>
                                            <option value="Police Department">Police Department</option>
                                            <option value="Others">Others</option>
                                        </select>
                                        {formData.category && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="position-absolute top-50 end-0 translate-middle-y me-4 text-success">
                                                <FaExclamationTriangle />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label fw-bold small text-secondary text-uppercase ls-wide">Priority (AI Detected)</label>
                                    <div className="position-relative">
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                            disabled={true}
                                            className="form-select form-select-lg bg-light border-light shadow-none text-dark focus-ring-primary cursor-not-allowed opacity-75"
                                            required
                                            style={{ fontSize: '0.95rem' }}
                                        >
                                            <option value="">Waiting for AI...</option>
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Emergency">Emergency</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="form-label fw-bold small text-secondary text-uppercase ls-wide mb-3">Upload Photo Evidence</label>
                                <div className="border-2 border-dashed border-secondary-subtle bg-surface rounded-custom-xl text-center p-5 cursor-pointer hover-bg-light transition-fast group">
                                    <input type="file" onChange={handleImageChange} className="d-none" id="imageUpload" accept="image/*" />
                                    <label htmlFor="imageUpload" className="cursor-pointer w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                                        <div className="bg-primary-light p-3 rounded-circle text-primary-custom mb-3 group-hover-scale transition-fast">
                                            <FaCloudUploadAlt size={30} />
                                        </div>
                                        <p className="mb-1 text-dark fw-bold">Click to upload image</p>
                                        <small className="text-secondary">JPG, PNG up to 5MB</small>
                                        {formData.image && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                className="mt-3 text-success fw-bold d-flex align-items-center gap-2 bg-success-subtle px-3 py-1 rounded-pill"
                                            >
                                                <FaCamera /> {formData.image.name}
                                            </motion.div>
                                        )}
                                    </label>
                                </div>
                            </div>


                            <div className="mb-5">
                                <label className="form-label fw-bold small text-secondary text-uppercase ls-wide mb-3">Upload Video Evidence (Optional)</label>
                                <div className="border-2 border-dashed border-secondary-subtle bg-surface rounded-custom-xl text-center p-5 cursor-pointer hover-bg-light transition-fast group">
                                    <input type="file" onChange={handleVideoChange} className="d-none" id="videoUpload" accept="video/*" />
                                    <label htmlFor="videoUpload" className="cursor-pointer w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                                        <div className="bg-primary-light p-3 rounded-circle text-primary-custom mb-3 group-hover-scale transition-fast">
                                            <FaVideo size={30} />
                                        </div>
                                        <p className="mb-1 text-dark fw-bold">Click to upload video</p>
                                        <small className="text-secondary">MP4, MOV up to 10MB</small>
                                        {formData.video && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                className="mt-3 text-success fw-bold d-flex align-items-center gap-2 bg-success-subtle px-3 py-1 rounded-pill"
                                            >
                                                <FaVideo /> {formData.video.name}
                                            </motion.div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ title: '', category: '', priority: '', location: '', description: '', image: null, video: null })}
                                    className="btn btn-light px-4 fw-semibold border"
                                >
                                    Clear
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary px-4 fw-semibold"
                                >
                                    {loading ? (
                                        <span><span className="spinner-border spinner-border-sm me-2"></span> Submitting...</span>
                                    ) : (
                                        'Submit Report'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div >
    );
};

export default ReportIssue;
