import React from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaBolt } from 'react-icons/fa';

const AIAnimation = ({ size = "large" }) => {
    const isSmall = size === "small";

    return (
        <div className={`d-flex flex-column align-items-center justify-content-center ${isSmall ? 'p-2' : 'p-4'}`}>
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                        "0 0 0 0 rgba(76, 110, 245, 0.4)",
                        "0 0 0 20px rgba(76, 110, 245, 0)",
                        "0 0 0 0 rgba(76, 110, 245, 0)"
                    ]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={`rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center position-relative`}
                style={{ width: isSmall ? '50px' : '100px', height: isSmall ? '50px' : '100px' }}
            >
                <FaRobot size={isSmall ? 24 : 48} className="position-relative z-2" />

                {/* Orbiting element */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="position-absolute w-100 h-100 rounded-circle border border-primary border-opacity-25"
                    style={{ borderStyle: 'dashed' }}
                >
                    <motion.div
                        className="position-absolute top-0 start-50 translate-middle bg-primary text-white rounded-circle d-flex align-items-center justify-content-center p-0"
                        style={{ width: isSmall ? '16px' : '24px', height: isSmall ? '16px' : '24px' }}
                    >
                        <FaBolt size={isSmall ? 8 : 12} />
                    </motion.div>
                </motion.div>
            </motion.div>

            {!isSmall && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mt-4 text-center"
                >
                    <span className="badge bg-primary rounded-pill px-3 py-2 fw-normal ls-wide text-uppercase" style={{ fontSize: '0.75rem' }}>
                        <span className="spinner-grow spinner-grow-sm me-2 align-middle" role="status" aria-hidden="true" style={{ width: '0.5rem', height: '0.5rem' }}></span>
                        Civic AI Active
                    </span>
                </motion.div>
            )}
        </div>
    );
};

export default AIAnimation;
