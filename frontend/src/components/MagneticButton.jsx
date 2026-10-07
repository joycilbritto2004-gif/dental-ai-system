import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const MagneticButton = ({ children, className = '', ...props }) => {
  const ref = useRef(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring for the magnetic pull
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window);
  }, []);

  const handleMouseMove = (e) => {
    if (isTouchDevice || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance from center
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Apply a magnetic pull (max ~8px)
    // The divisor controls how strong the pull is relative to the element size
    x.set(distanceX / 3);
    y.set(distanceY / 3);
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: smoothX,
        y: smoothY,
        display: 'inline-flex',
        position: 'relative',
        zIndex: 10
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default MagneticButton;
