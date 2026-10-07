import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Use motion values for better performance than state
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Outer circle springs for trailing effect
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const outerCursorX = useSpring(cursorX, springConfig);
  const outerCursorY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Check if it's a touch device
    const checkTouch = () => {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window);
    };
    
    checkTouch();
    window.addEventListener('resize', checkTouch);

    if (isTouchDevice) return;

    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      // Check if hovering over clickable elements
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('interactive')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('resize', checkTouch);
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY, isTouchDevice]);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Inner precise dot */}
      <motion.div
        className="custom-cursor-dot"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isHovering ? 0 : 1,
          opacity: isHovering ? 0 : 1
        }}
      />
      {/* Outer trailing ring */}
      <motion.div
        className="custom-cursor-ring"
        style={{
          x: outerCursorX,
          y: outerCursorY,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
          borderColor: isHovering ? 'rgba(14, 165, 233, 0)' : 'var(--color-primary)'
        }}
      />
      <style>{`
        /* Only apply cursor: none if the user isn't preferring reduced motion */
        @media (prefers-reduced-motion: no-preference) {
          body, a, button, .interactive {
            cursor: none; 
          }
        }
        .custom-cursor-dot {
          position: fixed;
          top: -4px; left: -4px;
          width: 8px; height: 8px;
          background-color: var(--color-primary);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
        }
        .custom-cursor-ring {
          position: fixed;
          top: -20px; left: -20px;
          width: 40px; height: 40px;
          border: 1px solid var(--color-primary);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </>
  );
};

export default CustomCursor;
