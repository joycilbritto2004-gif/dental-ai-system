import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CursorGlow = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Use motion values for performance
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring physics for trailing glow
  const springConfig = { damping: 35, stiffness: 100, mass: 1 };
  const glowX = useSpring(mouseX, springConfig);
  const glowY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Check for touch device
    const checkTouch = () => {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);

    if (isTouchDevice) return;

    // Track mouse
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('resize', checkTouch);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY, isTouchDevice]);

  // Hide entirely on touch/mobile
  if (isTouchDevice) return null;

  return (
    <motion.div
      className="cursor-glow-background"
      style={{
        x: glowX,
        y: glowY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <style>{`
        .cursor-glow-background {
          position: fixed;
          top: 0; left: 0;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(14, 165, 233, 0.08) 0%, transparent 60%);
          pointer-events: none;
          z-index: 1; /* Keep it above background but below content */
        }
        
        [data-theme="dark"] .cursor-glow-background {
          background: radial-gradient(circle at center, rgba(34, 211, 238, 0.06) 0%, transparent 60%);
        }
      `}</style>
    </motion.div>
  );
};

export default CursorGlow;
