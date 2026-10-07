import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Tilt3D = ({ children, maxRotation = 5, className = '' }) => {
  const ref = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Mouse position relative to the element center (-1 to 1)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Springs for smooth return and movement
  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  // Transform raw mouse values into rotation angles
  // If mouse is on left (negative x), rotateY should be negative (tilted left)
  // If mouse is on top (negative y), rotateX should be positive (tilted up)
  const rotateX = useTransform(smoothY, [-1, 1], [maxRotation, -maxRotation]);
  const rotateY = useTransform(smoothX, [-1, 1], [-maxRotation, maxRotation]);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window);
  }, []);

  const handleMouseMove = (e) => {
    if (isTouchDevice || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    
    // Calculate mouse position relative to element center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalize coordinates between -1 and 1
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);
    
    // Clamp values just in case
    x.set(Math.max(-1, Math.min(1, normalizedX)));
    y.set(Math.max(-1, Math.min(1, normalizedY)));
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setIsHovering(false);
    // Smoothly return to original position
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      className={className}
    >
      <motion.div
        style={{
          rotateX: isHovering ? rotateX : 0,
          rotateY: isHovering ? rotateY : 0,
          transition: 'all 0.1s ease', // for non-transform properties
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default Tilt3D;
