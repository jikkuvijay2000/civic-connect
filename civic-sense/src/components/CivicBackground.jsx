import React from 'react';
import { motion } from 'framer-motion';
import { FaCity, FaTree, FaRoad, FaTrash, FaBuilding, FaBus, FaTint, FaLightbulb } from 'react-icons/fa';

const CivicBackground = () => {
  const icons = [
    { Icon: FaCity, size: 60, x: '10%', y: '20%', duration: 25 },
    { Icon: FaTree, size: 40, x: '80%', y: '15%', duration: 30 },
    { Icon: FaRoad, size: 50, x: '20%', y: '80%', duration: 28 },
    { Icon: FaTrash, size: 30, x: '90%', y: '70%', duration: 35 },
    { Icon: FaBuilding, size: 70, x: '5%', y: '50%', duration: 40 },
    { Icon: FaBus, size: 40, x: '70%', y: '90%', duration: 32 },
    { Icon: FaTint, size: 30, x: '40%', y: '10%', duration: 38 },
    { Icon: FaLightbulb, size: 35, x: '60%', y: '30%', duration: 29 },
  ];

  return (
    <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0, pointerEvents: 'none' }}>
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className="text-primary position-absolute"
          style={{ 
            left: item.x, 
            top: item.y,
            opacity: 0.05 // Very subtle opacity
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <item.Icon size={item.size} />
        </motion.div>
      ))}
    </div>
  );
};

export default CivicBackground;
